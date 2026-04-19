package expo.modules.truecaller

import expo.modules.kotlin.exception.CodedException

internal class NotInitializedException :
    CodedException("Call initializeAsync() before using this method")

internal class NoActivityException :
    CodedException("No foreground activity available")

internal class ActivityDestroyedException :
    CodedException("Activity is finishing or destroyed")

internal class LauncherNotRegisteredException :
    CodedException("ActivityResultLauncher not registered — this may indicate a lifecycle issue")

internal class NotAvailableException :
    CodedException("Truecaller is not installed or user is not logged in")

internal class AlreadyInProgressException :
    CodedException("A verification request is already in progress. Await the current request first.")

internal class PkceFailedException(cause: Throwable? = null) :
    CodedException("Failed to generate PKCE code verifier or challenge", cause)

internal class InitFailedException(cause: Throwable? = null) :
    CodedException("Failed to initialize Truecaller SDK", cause)

internal class ResultErrorException(cause: Throwable? = null) :
    CodedException("Error handling activity result", cause)

internal class VerificationFailedException(cause: Throwable? = null) :
    CodedException("Failed to start verification flow", cause)

internal class ClearedException :
    CodedException("SDK was cleared while a request was pending")

internal class VerificationRequiredException :
    CodedException("Additional verification required")

internal class MissingClientIdException :
    CodedException("Invalid partner credentials or client ID is missing")

internal class SdkErrorException :
    CodedException("Internal Truecaller SDK error")

internal class SdkTooOldException :
    CodedException("Truecaller SDK or device is not compatible")

internal class UserCancelledException :
    CodedException("User dismissed the consent screen")

internal class UserDismissedException :
    CodedException("User dismissed while loading")

internal class UserPressedBackException :
    CodedException("User pressed the footer button to dismiss")

internal class NotInstalledException :
    CodedException("Truecaller app is not installed")

internal class NetworkFailureException :
    CodedException("Network error occurred")

internal class UnknownErrorException :
    CodedException("An unknown Truecaller error occurred")

internal class ModuleDestroyedException :
    CodedException("Module was destroyed before result arrived")
