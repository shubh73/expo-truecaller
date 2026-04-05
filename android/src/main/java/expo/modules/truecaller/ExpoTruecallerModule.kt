package expo.modules.truecaller

import android.graphics.Color
import android.util.Log
import androidx.core.os.bundleOf
import androidx.fragment.app.FragmentActivity
import com.truecaller.android.sdk.oAuth.CodeVerifierUtil
import com.truecaller.android.sdk.oAuth.OAuthThemeOptions
import com.truecaller.android.sdk.oAuth.TcOAuthCallback
import com.truecaller.android.sdk.oAuth.TcOAuthData
import com.truecaller.android.sdk.oAuth.TcOAuthError
import com.truecaller.android.sdk.oAuth.TcSdk
import com.truecaller.android.sdk.oAuth.TcSdkOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.math.BigInteger
import java.security.SecureRandom
import java.util.Locale

class InitOptions : Record {
    @Field val buttonColor: String? = null
    @Field val buttonTextColor: String? = null
    @Field val consentMode: String? = null
    @Field val footerType: String? = null
    @Field val buttonShape: String? = null
    @Field val ctaTextPrefix: String? = null
    @Field val heading: String? = null
    @Field val sdkOption: String? = null
    @Field val language: String? = null
    @Field val theme: String? = null
}

class VerifyOptions : Record {
    @Field val scopes: List<String>? = null
}

private val DEFAULT_SCOPES = arrayOf("profile", "phone")

class ExpoTruecallerModule : Module() {

    companion object {
        private const val TAG = "ExpoTruecaller"
    }

    @Volatile private var pendingVerifyPromise: Promise? = null
    @Volatile private var isInitialized = false
    @Volatile private var codeVerifier: String? = null
    @Volatile private var themeOption: String? = null

    private val oauthCallback = createOAuthCallback()

    override fun definition() = ModuleDefinition {

        Name("ExpoTruecaller")

        AsyncFunction("initialize") { options: InitOptions, promise: Promise ->
            try {
                val activity = requireActivity(promise) ?: return@AsyncFunction

                val tcSdkOptions = buildSdkOptions(activity, oauthCallback, options)
                TcSdk.init(tcSdkOptions)
                isInitialized = true

                options.language?.let { lang ->
                    try { TcSdk.getInstance().setLocale(Locale(lang)) }
                    catch (e: Exception) { Log.e(TAG, "Error setting locale", e) }
                }

                themeOption = options.theme

                val isUsable = try { TcSdk.getInstance().isOAuthFlowUsable }
                    catch (_: Exception) { false }

                promise.resolve(bundleOf("initialized" to true, "isUsable" to isUsable))
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing TcSdk", e)
                promise.reject(CodedException("INIT_FAILED", e.message ?: "Failed to initialize Truecaller SDK", e))
            }
        }

        AsyncFunction("verifyUser") { options: VerifyOptions, promise: Promise ->
            if (!isInitialized) {
                promise.reject(CodedException("NOT_INITIALIZED", "Call initialize() first", null))
                return@AsyncFunction
            }

            val activity = requireActivity(promise) ?: return@AsyncFunction

            val launcher = TruecallerLauncherHolder.launcher
            if (launcher == null) {
                promise.reject(CodedException("LAUNCHER_NOT_REGISTERED", "ActivityResultLauncher not registered — this may indicate a lifecycle issue", null))
                return@AsyncFunction
            }

            if (!TcSdk.getInstance().isOAuthFlowUsable) {
                promise.reject(CodedException("NOT_AVAILABLE", "Truecaller is not installed or user is not logged in", null))
                return@AsyncFunction
            }

            pendingVerifyPromise?.reject(CodedException("CLEARED", "Previous verification was interrupted", null))
            pendingVerifyPromise = promise

            TruecallerLauncherHolder.resultErrorCallback = { e ->
                pendingVerifyPromise?.reject(CodedException("RESULT_ERROR", e.message ?: "Error handling activity result", e))
                clearPendingState()
            }

            activity.runOnUiThread {
                try {
                    val tcSdk = TcSdk.getInstance()

                    tcSdk.setOAuthState(BigInteger(130, SecureRandom()).toString(32))

                    val scopes = options.scopes
                        ?.toTypedArray()
                        ?.takeIf { it.isNotEmpty() }
                        ?: DEFAULT_SCOPES
                    tcSdk.setOAuthScopes(scopes)

                    val verifier = CodeVerifierUtil.generateRandomCodeVerifier()
                    if (verifier == null) {
                        rejectPending(CodedException("PKCE_FAILED", "Failed to generate code verifier", null))
                        return@runOnUiThread
                    }
                    codeVerifier = verifier

                    val challenge = CodeVerifierUtil.getCodeChallenge(verifier)
                    if (challenge == null) {
                        rejectPending(CodedException("PKCE_FAILED", "Failed to generate code challenge", null))
                        return@runOnUiThread
                    }
                    tcSdk.setCodeChallenge(challenge)

                    when (themeOption) {
                        "dark" -> tcSdk.setTheme(OAuthThemeOptions.DARK)
                        "light" -> tcSdk.setTheme(OAuthThemeOptions.LIGHT)
                    }

                    tcSdk.getAuthorizationCode(activity, launcher)
                } catch (e: Exception) {
                    Log.e(TAG, "Error starting verification flow", e)
                    rejectPending(CodedException("VERIFICATION_FAILED", e.message ?: "Failed to start verification", e))
                }
            }
        }

        Function("clear") {
            cleanup("SDK was cleared")
        }

        OnDestroy {
            cleanup("Module was destroyed")
        }
    }

    // --- Helpers ---

    private fun requireActivity(promise: Promise): FragmentActivity? {
        val activity = appContext.currentActivity as? FragmentActivity
        if (activity == null) {
            promise.reject(CodedException("NO_ACTIVITY", "No FragmentActivity available", null))
            return null
        }
        if (activity.isFinishing || activity.isDestroyed) {
            promise.reject(CodedException("ACTIVITY_DESTROYED", "Activity is finishing or destroyed", null))
            return null
        }
        return activity
    }

    private fun rejectPending(error: CodedException) {
        pendingVerifyPromise?.reject(error)
        clearPendingState()
    }

    private fun clearPendingState() {
        pendingVerifyPromise = null
        TruecallerLauncherHolder.resultErrorCallback = null
    }

    private fun cleanup(reason: String) {
        try {
            if (isInitialized) {
                TcSdk.clear()
                isInitialized = false
            }
            pendingVerifyPromise?.reject(CodedException("CLEARED", reason, null))
            clearPendingState()
            codeVerifier = null
            themeOption = null
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup", e)
        }
    }

    private fun createOAuthCallback(): TcOAuthCallback {
        return object : TcOAuthCallback {
            override fun onSuccess(tcOAuthData: TcOAuthData) {
                val promise = pendingVerifyPromise ?: return
                val verifier = codeVerifier
                if (verifier == null) {
                    rejectPending(CodedException("PKCE_FAILED", "Code verifier is missing", null))
                    return
                }
                promise.resolve(
                    bundleOf(
                        "authorizationCode" to tcOAuthData.authorizationCode,
                        "scopesGranted" to ArrayList(tcOAuthData.scopesGranted.toList()),
                        "codeVerifier" to verifier
                    )
                )
                clearPendingState()
            }

            override fun onFailure(tcOAuthError: TcOAuthError) {
                val promise = pendingVerifyPromise ?: return
                promise.reject(
                    CodedException(
                        mapErrorCode(tcOAuthError.errorCode),
                        tcOAuthError.errorMessage ?: "Truecaller verification failed",
                        null
                    )
                )
                clearPendingState()
            }

            override fun onVerificationRequired(tcOAuthError: TcOAuthError?) {
                val promise = pendingVerifyPromise ?: return
                promise.reject(
                    CodedException(
                        "VERIFICATION_REQUIRED",
                        tcOAuthError?.errorMessage ?: "Additional verification required",
                        null
                    )
                )
                clearPendingState()
            }
        }
    }

    private fun mapErrorCode(errorCode: Int): String = when (errorCode) {
        1 -> "NETWORK_FAILURE"
        2 -> "USER_CANCELLED"
        3 -> "VERIFICATION_REQUIRED"
        4 -> "MISSING_CLIENT_ID"
        5 -> "NOT_INSTALLED"
        10 -> "SDK_ERROR"
        11 -> "USER_NOT_SIGNED_IN"
        13 -> "USER_DISMISSED"
        14 -> "USER_PRESSED_BACK"
        16 -> "SDK_TOO_OLD"
        else -> "UNKNOWN_ERROR"
    }

    private fun buildSdkOptions(
        activity: FragmentActivity,
        callback: TcOAuthCallback,
        options: InitOptions
    ): TcSdkOptions {
        val builder = TcSdkOptions.Builder(activity, callback)

        options.consentMode?.let { mode ->
            try {
                when (mode) {
                    "popup" -> builder.consentMode(TcSdkOptions.CONSENT_MODE_POPUP)
                    "bottomsheet" -> builder.consentMode(TcSdkOptions.CONSENT_MODE_BOTTOMSHEET)
                }
            } catch (e: Exception) { Log.e(TAG, "Error setting consentMode", e) }
        }

        options.buttonColor?.let { color ->
            try { builder.buttonColor(Color.parseColor(color)) }
            catch (e: Exception) { Log.e(TAG, "Invalid buttonColor: $color", e) }
        }

        options.buttonTextColor?.let { color ->
            try { builder.buttonTextColor(Color.parseColor(color)) }
            catch (e: Exception) { Log.e(TAG, "Invalid buttonTextColor: $color", e) }
        }

        options.buttonShape?.let { shape ->
            when (shape) {
                "rounded" -> builder.buttonShapeOptions(TcSdkOptions.BUTTON_SHAPE_ROUNDED)
                "rectangle" -> builder.buttonShapeOptions(TcSdkOptions.BUTTON_SHAPE_RECTANGLE)
            }
        }

        options.ctaTextPrefix?.let { cta ->
            when (cta) {
                "continue" -> builder.ctaText(TcSdkOptions.CTA_TEXT_CONTINUE)
                "proceed" -> builder.ctaText(TcSdkOptions.CTA_TEXT_PROCEED)
                "accept" -> builder.ctaText(TcSdkOptions.CTA_TEXT_ACCEPT)
                "confirm" -> builder.ctaText(TcSdkOptions.CTA_TEXT_COFIRM)
            }
        }

        options.footerType?.let { footer ->
            when (footer) {
                "continue" -> builder.footerType(TcSdkOptions.FOOTER_TYPE_CONTINUE)
                "anotherMethod" -> builder.footerType(TcSdkOptions.FOOTER_TYPE_ANOTHER_METHOD)
                "manually" -> builder.footerType(TcSdkOptions.FOOTER_TYPE_MANUALLY)
                "later" -> builder.footerType(TcSdkOptions.FOOTER_TYPE_LATER)
            }
        }

        options.heading?.let { heading ->
            when (heading) {
                "logInTo" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_LOG_IN_TO)
                "signUpWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_SIGNUP_WITH)
                "signInTo" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_SIGN_IN_TO)
                "verifyNumberWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_VERIFY_NUMBER_WITH)
                "registerWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_REGISTER_WITH)
                "getStartedWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_GET_STARTED_WITH)
                "proceedWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_PROCEED_WITH)
                "verifyWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_VERIFY_WITH)
                "verifyProfileWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_VERIFY_PROFILE_WITH)
                "verifyYourProfileWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_VERIFY_YOUR_PROFILE_WITH)
                "verifyPhoneNoWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_VERIFY_PHONE_NO_WITH)
                "verifyYourNoWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_VERIFY_YOUR_NO_WITH)
                "continueWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_CONTINUE_WITH)
                "completeOrderWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_COMPLETE_ORDER_WITH)
                "placeOrderWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_PLACE_ORDER_WITH)
                "completeBookingWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_COMPLETE_BOOKING_WITH)
                "checkoutWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_CHECKOUT_WITH)
                "manageDetailsWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_MANAGE_DETAILS_WITH)
                "manageYourDetailsWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_MANAGE_YOUR_DETAILS_WITH)
                "loginToWithOneTap" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_LOGIN_TO_WITH_ONE_TAP)
                "subscribeTo" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_SUBSCRIBE_TO)
                "getUpdatesFrom" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_GET_UPDATES_FROM)
                "continueReadingOn" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_CONTINUE_READING_ON)
                "getNewUpdatesFrom" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_GET_NEW_UPDATES_FROM)
                "loginSignupWith" -> builder.consentTitleOption(TcSdkOptions.SDK_CONSENT_HEADING_LOGIN_SIGNUP_WITH)
            }
        }

        options.sdkOption?.let { opt ->
            when (opt) {
                "verifyTcUsersOnly" -> builder.sdkOptions(TcSdkOptions.OPTION_VERIFY_ONLY_TC_USERS)
            }
        }

        return builder.build()
    }
}
