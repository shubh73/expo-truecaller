import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  initializeAsync,
  verifyUserAsync,
  requestProfileAsync,
  clear,
  TruecallerErrorCodes,
} from "expo-truecaller";

type Status =
  | { type: "idle" }
  | { type: "loading"; step: "init" | "verify" }
  | { type: "initialized"; isUsable: boolean }
  | { type: "success"; result: Record<string, string> }
  | { type: "cancelled" }
  | { type: "unavailable" }
  | { type: "error"; code: string; message: string };

export function DemoScreen({
  onShowValidation,
}: {
  onShowValidation: () => void;
}) {
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const isUsable = status.type === "initialized" && status.isUsable;

  const handleInit = async () => {
    setStatus({ type: "loading", step: "init" });
    try {
      const res = await initializeAsync(
        Platform.OS === "android"
          ? {
              consentMode: "bottomsheet",
              buttonShape: "rounded",
              ctaTextPrefix: "continue",
              footerType: "anotherMethod",
              heading: "loginSignupWith",
            }
          : undefined,
      );
      setStatus({ type: "initialized", isUsable: res.isUsable });
    } catch (e) {
      const err = e as Error & { code: string };
      setStatus({ type: "error", code: err.code, message: err.message });
    }
  };

  const handleVerify = async () => {
    setStatus({ type: "loading", step: "verify" });
    try {
      if (Platform.OS === "ios") {
        const profile = await requestProfileAsync();
        setStatus({
          type: "success",
          result: {
            name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
            phone: `${profile.countryCode ?? ""} ${profile.phoneNumber ?? ""}`,
            email: profile.email ?? "—",
            verified: String(profile.isVerified),
          },
        });
      } else {
        const auth = await verifyUserAsync();
        setStatus({
          type: "success",
          result: {
            authCode: auth.authorizationCode.slice(0, 24) + "...",
            scopes: auth.scopesGranted.join(", "),
            verifier: auth.codeVerifier.slice(0, 24) + "...",
          },
        });
      }
    } catch (e) {
      const err = e as Error & { code: string };
      switch (err.code) {
        case TruecallerErrorCodes.USER_CANCELLED:
        case TruecallerErrorCodes.USER_PRESSED_BACK:
        case TruecallerErrorCodes.USER_DISMISSED:
          setStatus({ type: "cancelled" });
          return;
        case TruecallerErrorCodes.NOT_INSTALLED:
        case TruecallerErrorCodes.NOT_AVAILABLE:
          setStatus({ type: "unavailable" });
          return;
        default:
          setStatus({ type: "error", code: err.code, message: err.message });
      }
    }
  };

  const handleClear = () => {
    clear();
    setStatus({ type: "idle" });
  };

  const isLoading = status.type === "loading";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>expo-truecaller</Text>
      <Text style={styles.description}>
        One-tap phone verification powered by the Truecaller SDK.
      </Text>

      <Pressable
        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
        onPress={handleInit}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {status.type === "loading" && status.step === "init"
            ? "Initializing..."
            : "Initialize SDK"}
        </Text>
      </Pressable>

      {status.type === "initialized" && (
        <View style={styles.statusCard}>
          <Text
            style={status.isUsable ? styles.statusSuccess : styles.statusMuted}
          >
            {status.isUsable
              ? "Truecaller is available"
              : "Truecaller not available on this device"}
          </Text>
        </View>
      )}

      <Pressable
        style={[
          styles.primaryButton,
          (!isUsable || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleVerify}
        disabled={!isUsable || isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {status.type === "loading" && status.step === "verify"
            ? "Verifying..."
            : Platform.OS === "ios"
              ? "Request Profile"
              : "Verify with Truecaller"}
        </Text>
      </Pressable>

      {status.type === "success" && (
        <View style={styles.statusCard}>
          {Object.entries(status.result).map(([k, v]) => (
            <View key={k} style={styles.resultRow}>
              <Text style={styles.resultLabel}>{k}</Text>
              <Text style={styles.resultValue} numberOfLines={1}>
                {v}
              </Text>
            </View>
          ))}
        </View>
      )}

      {status.type === "cancelled" && (
        <View style={styles.statusCard}>
          <Text style={styles.statusMuted}>
            User cancelled — use your fallback flow
          </Text>
        </View>
      )}

      {status.type === "unavailable" && (
        <View style={[styles.statusCard, styles.warningCard]}>
          <Text style={styles.statusWarning}>
            Truecaller is not available on this device
          </Text>
        </View>
      )}

      {status.type === "error" && (
        <View style={styles.errorCard}>
          <Text style={styles.statusError}>
            {status.code}: {status.message}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <Pressable style={styles.secondaryButton} onPress={handleClear}>
        <Text style={styles.secondaryButtonText}>Clear SDK</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable style={styles.linkButton} onPress={onShowValidation}>
        <Text style={styles.linkButtonText}>Open Validation Matrix</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  statusCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  warningCard: {
    backgroundColor: "#fef3c7",
  },
  statusSuccess: {
    fontSize: 15,
    color: "#166534",
    fontWeight: "600",
  },
  statusMuted: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusWarning: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 14,
  },
  statusError: {
    fontSize: 14,
    color: "#991b1b",
    fontWeight: "600",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resultLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  resultValue: {
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#111827",
    maxWidth: "60%",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
});
