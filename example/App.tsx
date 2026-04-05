import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  initialize,
  clear,
  TruecallerError,
  TruecallerErrorCodes,
  type TruecallerInitResult,
} from "expo-truecaller";

type Status = "idle" | "loading" | "success" | "error";

export default function App() {
  const [initResult, setInitResult] = useState<TruecallerInitResult | null>(null);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleInit = useCallback(async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await initialize(
        Platform.OS === "android"
          ? {
              consentMode: "bottomsheet",
              buttonShape: "rounded",
              ctaTextPrefix: "continue",
              footerType: "anotherMethod",
              heading: "loginSignupWith",
            }
          : undefined
      );
      setInitResult(res);
      setStatus("success");
      setMessage(res.isUsable ? "Truecaller is available" : "Truecaller not available on this device");
    } catch (e: unknown) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handleVerify = useCallback(async () => {
    setStatus("loading");
    setMessage(null);
    setResult(null);
    try {
      if (Platform.OS === "ios") {
        const { requestProfile } = await import("expo-truecaller");
        const profile = await requestProfile();
        setResult({
          name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
          phone: `${profile.countryCode ?? ""} ${profile.phoneNumber ?? ""}`,
          email: profile.email ?? "—",
          verified: String(profile.isVerified),
        });
      } else {
        // Android returns OAuth credentials — exchange authorizationCode + codeVerifier
        // on your backend via POST https://oauth-account-noneu.truecaller.com/v1/token
        const { verifyUser } = await import("expo-truecaller");
        const auth = await verifyUser();
        setResult({
          authCode: auth.authorizationCode.slice(0, 24) + "...",
          scopes: auth.scopesGranted.join(", "),
          verifier: auth.codeVerifier.slice(0, 24) + "...",
        });
      }
      setStatus("success");
      setMessage("Verification successful");
    } catch (e: unknown) {
      if (e instanceof TruecallerError) {
        switch (e.code) {
          case TruecallerErrorCodes.USER_CANCELLED:
          case TruecallerErrorCodes.USER_PRESSED_BACK:
          case TruecallerErrorCodes.USER_DISMISSED:
          case TruecallerErrorCodes.IOS_USER_CANCELLED:
            setStatus("idle");
            setMessage("User cancelled — use your fallback flow");
            return;
          case TruecallerErrorCodes.NOT_INSTALLED:
          case TruecallerErrorCodes.NOT_AVAILABLE:
          case TruecallerErrorCodes.SDK_TOO_OLD:
          case TruecallerErrorCodes.IOS_NOT_SUPPORTED:
            setStatus("error");
            setMessage("Truecaller is not available on this device");
            return;
        }
      }
      setStatus("error");
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const handleClear = useCallback(() => {
    clear();
    setInitResult(null);
    setResult(null);
    setStatus("idle");
    setMessage(null);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>expo-truecaller</Text>
        <Text style={styles.subtitle}>Truecaller SDK for Expo</Text>

        <Card title="1. Initialize">
          <Button title="Initialize SDK" onPress={handleInit} />
          {initResult && (
            <Row label="isUsable" value={String(initResult.isUsable)} />
          )}
        </Card>

        <Card title="2. Verify User">
          <Button
            title={Platform.OS === "ios" ? "Request Profile" : "Verify with Truecaller"}
            onPress={handleVerify}
            disabled={!initResult?.isUsable}
          />
          {result &&
            Object.entries(result).map(([k, v]) => (
              <Row key={k} label={k} value={v} />
            ))}
        </Card>

        <Card title="3. Cleanup">
          <Button title="Clear SDK" onPress={handleClear} color="#888" />
        </Card>

        {status === "loading" && <ActivityIndicator style={styles.loader} />}
        {message && (
          <Text style={[styles.message, status === "error" && styles.errorText]}>
            {message}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  rowLabel: { fontSize: 13, color: "#888" },
  rowValue: {
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    maxWidth: "60%",
  },
  loader: { marginTop: 16 },
  message: { marginTop: 16, fontSize: 14, textAlign: "center", color: "#333" },
  errorText: { color: "#d32f2f" },
});
