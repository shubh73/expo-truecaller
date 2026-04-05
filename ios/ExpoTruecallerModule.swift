import ExpoModulesCore
import TrueSDK

public class ExpoTruecallerModule: Module, TCTrueSDKDelegate {
  private var profilePromise: Promise?
  private var isInitialized = false

  public func definition() -> ModuleDefinition {
    Name("ExpoTruecaller")

    AsyncFunction("initialize") { (promise: Promise) in
      let appKey = Bundle.main.object(forInfoDictionaryKey: "TruecallerAppKey") as? String ?? ""
      let appLink = Bundle.main.object(forInfoDictionaryKey: "TruecallerAppLink") as? String ?? ""

      guard !appKey.isEmpty else {
        promise.reject("INIT_FAILED", "TruecallerAppKey not found in Info.plist. Configure it via the expo-truecaller config plugin.")
        return
      }

      guard !appLink.isEmpty else {
        promise.reject("INIT_FAILED", "TruecallerAppLink not found in Info.plist. Configure it via the expo-truecaller config plugin.")
        return
      }

      let manager = TCTrueSDK.sharedManager()
      manager.setup(withAppKey: appKey, appLink: appLink)
      manager.delegate = self
      self.isInitialized = true

      promise.resolve([
        "initialized": true,
        "isUsable": manager.isSupported()
      ])
    }.runOnQueue(.main)

    AsyncFunction("requestProfile") { (promise: Promise) in
      guard self.isInitialized else {
        promise.reject("NOT_INITIALIZED", "Call initialize() first")
        return
      }

      let manager = TCTrueSDK.sharedManager()

      guard manager.isSupported() else {
        promise.reject("IOS_NOT_SUPPORTED", "Truecaller is not installed on this device")
        return
      }

      self.profilePromise?.reject("CLEARED", "Previous request was interrupted")
      self.profilePromise = promise

      manager.requestTrueProfile()
    }.runOnQueue(.main)

    Function("isSupported") { () -> Bool in
      guard self.isInitialized else { return false }
      return TCTrueSDK.sharedManager().isSupported()
    }

    Function("clear") {
      self.profilePromise?.reject("CLEARED", "SDK was cleared")
      self.profilePromise = nil
      self.isInitialized = false
    }

    OnDestroy {
      self.profilePromise?.reject("CLEARED", "Module was destroyed")
      self.profilePromise = nil
      self.isInitialized = false
    }
  }

  // MARK: - TCTrueSDKDelegate

  public func didReceive(_ profile: TCTrueProfile) {
    guard let promise = profilePromise else { return }

    var gender: String? = nil
    switch profile.gender {
    case .male:  gender = "male"
    case .female: gender = "female"
    default: break
    }

    promise.resolve([
      "firstName": profile.firstName as Any,
      "lastName": profile.lastName as Any,
      "phoneNumber": profile.phoneNumber as Any,
      "countryCode": profile.countryCode as Any,
      "email": profile.email as Any,
      "gender": gender as Any,
      "avatarUrl": profile.avatarURL as Any,
      "city": profile.city as Any,
      "isVerified": profile.isVerified
    ])
    profilePromise = nil
  }

  public func didFailToReceiveTrueProfileWithError(_ error: TCError) {
    guard let promise = profilePromise else { return }
    promise.reject(mapIOSErrorCode(error.code), error.localizedDescription)
    profilePromise = nil
  }

  private func mapIOSErrorCode(_ code: Int) -> String {
    switch code {
    case 1:  return "IOS_APP_KEY_MISSING"
    case 2:  return "IOS_APP_LINK_MISSING"
    case 3:  return "IOS_USER_CANCELLED"
    case 4:  return "IOS_USER_NOT_SIGNED_IN"
    case 5:  return "IOS_SDK_TOO_OLD"
    case 8:  return "NOT_INSTALLED"
    case 9:  return "NETWORK_FAILURE"
    case 10: return "SDK_ERROR"
    default: return "UNKNOWN_ERROR"
    }
  }
}
