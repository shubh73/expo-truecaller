import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withEntitlementsPlist,
  withInfoPlist,
} from "expo/config-plugins";

const pkg = require("../../package.json");

type TruecallerPluginConfig = {
  androidClientId: string;
  iosAppKey?: string;
  iosAppLink?: string;
};

function validateProps(props: TruecallerPluginConfig): void {
  if (!props.androidClientId || typeof props.androidClientId !== "string") {
    throw new Error(
      `expo-truecaller: "androidClientId" is required and must be a non-empty string.`
    );
  }
  if (props.iosAppKey && !props.iosAppLink) {
    throw new Error(
      `expo-truecaller: "iosAppLink" is required when "iosAppKey" is provided.`
    );
  }
  if (props.iosAppLink && !props.iosAppKey) {
    throw new Error(
      `expo-truecaller: "iosAppKey" is required when "iosAppLink" is provided.`
    );
  }
}

// --- Android ---

const withTruecallerAndroid: ConfigPlugin<TruecallerPluginConfig> = (
  config,
  { androidClientId }
) => {
  return withAndroidManifest(config, (config) => {
    const mainApp =
      AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    if (mainApp["meta-data"]) {
      mainApp["meta-data"] = mainApp["meta-data"].filter(
        (item) =>
          item.$?.["android:name"] !== "com.truecaller.android.sdk.ClientId"
      );
    }

    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApp,
      "com.truecaller.android.sdk.ClientId",
      androidClientId
    );

    return config;
  });
};

// --- iOS: Info.plist ---

const withTruecallerIOSPlist: ConfigPlugin<{
  iosAppKey: string;
  iosAppLink: string;
}> = (config, { iosAppKey, iosAppLink }) => {
  return withInfoPlist(config, (config) => {
    const plist = config.modResults;

    const schemes: string[] = plist.LSApplicationQueriesSchemes ?? [];
    if (!schemes.includes("truesdk")) schemes.push("truesdk");
    plist.LSApplicationQueriesSchemes = schemes;

    const urlScheme = `truecallersdk-${iosAppKey}`;
    const urlTypes: Array<{
      CFBundleURLSchemes: string[];
      CFBundleURLName?: string;
    }> = plist.CFBundleURLTypes ?? [];
    if (!urlTypes.some((t) => t.CFBundleURLSchemes?.includes(urlScheme))) {
      urlTypes.push({ CFBundleURLSchemes: [urlScheme] });
    }
    plist.CFBundleURLTypes = urlTypes;

    plist["TruecallerAppKey"] = iosAppKey;
    plist["TruecallerAppLink"] = iosAppLink;

    return config;
  });
};

// --- iOS: Associated Domains ---

const withTruecallerIOSAssociatedDomains: ConfigPlugin<{
  iosAppLink: string;
}> = (config, { iosAppLink }) => {
  return withEntitlementsPlist(config, (config) => {
    let domain: string;
    try {
      domain = new URL(iosAppLink).hostname;
    } catch {
      domain = iosAppLink.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    }

    const domains: string[] =
      (config.modResults["com.apple.developer.associated-domains"] as
        | string[]
        | undefined) ?? [];

    const entry = `applinks:${domain}`;
    if (!domains.includes(entry)) domains.push(entry);
    config.modResults["com.apple.developer.associated-domains"] = domains;

    return config;
  });
};

// --- Main ---
// Note: AppDelegate continueUserActivity forwarding is handled by
// TruecallerAppDelegateSubscriber (registered in expo-module.config.json),
// so no AppDelegate code injection is needed here.

const withTruecaller: ConfigPlugin<TruecallerPluginConfig> = (
  config,
  props
) => {
  validateProps(props);

  config = withTruecallerAndroid(config, props);

  if (props.iosAppKey && props.iosAppLink) {
    config = withTruecallerIOSPlist(config, {
      iosAppKey: props.iosAppKey,
      iosAppLink: props.iosAppLink,
    });
    config = withTruecallerIOSAssociatedDomains(config, {
      iosAppLink: props.iosAppLink,
    });
  }

  return config;
};

export default createRunOncePlugin(withTruecaller, pkg.name, pkg.version);
