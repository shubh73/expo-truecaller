import ExpoModulesCore
import TrueSDK

public class TruecallerAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return TCTrueSDK.sharedManager().application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
}
