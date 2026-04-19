import { useMemo, useState } from "react";
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

type ScenarioId = "availability" | "init" | "verify" | "concurrency";
type ScenarioStatus = "idle" | "running" | "pass" | "fail";

type LogEntry = {
  id: number;
  timestamp: string;
  level: "info" | "pass" | "fail";
  message: string;
};

type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "availability",
    title: "Availability",
    description: "initializeAsync().isUsable returns boolean.",
  },
  {
    id: "init",
    title: "Initialize",
    description: "SDK initializes successfully.",
  },
  {
    id: "verify",
    title: Platform.OS === "ios" ? "Request Profile" : "Verify User",
    description:
      Platform.OS === "ios"
        ? "Request Truecaller profile. Passes on success or user cancel."
        : "OAuth verification flow. Passes on success or user cancel.",
  },
  {
    id: "concurrency",
    title: "Concurrent requests",
    description:
      "Second call rejects with ERR_ALREADY_IN_PROGRESS while first stays active.",
  },
];

const STATUS_CONFIG: Record<
  ScenarioStatus,
  { label: string; color: string; bg: string }
> = {
  idle: { label: "Not run", color: "#6b7280", bg: "#f3f4f6" },
  running: { label: "Running", color: "#1d4ed8", bg: "#dbeafe" },
  pass: { label: "Pass", color: "#166534", bg: "#dcfce7" },
  fail: { label: "Fail", color: "#991b1b", bg: "#fee2e2" },
};

const initOptions =
  Platform.OS === "android"
    ? {
        consentMode: "bottomsheet" as const,
        heading: "loginSignupWith" as const,
      }
    : undefined;

export function ValidationScreen({ onBack }: { onBack: () => void }) {
  const [statuses, setStatuses] = useState<Record<ScenarioId, ScenarioStatus>>(
    () => ({
      availability: "idle",
      init: "idle",
      verify: "idle",
      concurrency: "idle",
    }),
  );
  const [notes, setNotes] = useState<Record<ScenarioId, string>>(() => ({
    availability: "",
    init: "",
    verify: "",
    concurrency: "",
  }));
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const anyRunning = useMemo(
    () => Object.values(statuses).some((s) => s === "running"),
    [statuses],
  );

  const update = (id: ScenarioId, status: ScenarioStatus, note: string) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    setNotes((prev) => ({ ...prev, [id]: note }));
  };

  const log = (level: LogEntry["level"], message: string) => {
    setLogs((prev) =>
      [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          timestamp: new Date().toLocaleTimeString(),
          level,
          message,
        },
        ...prev,
      ].slice(0, 80),
    );
  };

  const run = async (id: ScenarioId) => {
    if (id === "availability") {
      update("availability", "running", "");
      log("info", "Checking availability via initializeAsync()...");
      try {
        const res = await initializeAsync(initOptions);
        update("availability", "pass", `isUsable → ${res.isUsable}`);
        log("pass", `isUsable → ${res.isUsable}`);
        clear();
      } catch (e) {
        const err = e as Error & { code: string };
        update("availability", "fail", `${err.code}: ${err.message}`);
        log("fail", `${err.code}: ${err.message}`);
      }
    } else if (id === "init") {
      update("init", "running", "");
      log("info", "Calling initializeAsync()...");
      try {
        const res = await initializeAsync(initOptions);
        update(
          "init",
          "pass",
          `initialized=${res.initialized}, isUsable=${res.isUsable}`,
        );
        log("pass", `initialized=${res.initialized}, isUsable=${res.isUsable}`);
      } catch (e) {
        const err = e as Error & { code: string };
        update("init", "fail", `${err.code}: ${err.message}`);
        log("fail", `${err.code}: ${err.message}`);
      }
    } else if (id === "verify") {
      update("verify", "running", "Waiting for user action...");
      log("info", "Starting verify/profile flow...");
      try {
        if (Platform.OS === "ios") {
          const profile = await requestProfileAsync();
          update("verify", "pass", `${profile.firstName} ${profile.lastName}`);
          log("pass", `Profile: ${profile.firstName} ${profile.lastName}`);
        } else {
          const auth = await verifyUserAsync();
          update(
            "verify",
            "pass",
            `Auth code: ${auth.authorizationCode.slice(0, 16)}...`,
          );
          log("pass", `Auth code: ${auth.authorizationCode.slice(0, 16)}...`);
        }
      } catch (e) {
        const err = e as Error & { code: string };
        if (
          err.code === TruecallerErrorCodes.USER_CANCELLED ||
          err.code === TruecallerErrorCodes.USER_PRESSED_BACK ||
          err.code === TruecallerErrorCodes.USER_DISMISSED
        ) {
          update("verify", "pass", `User cancelled (${err.code})`);
          log("pass", `User cancelled (${err.code})`);
        } else {
          update("verify", "fail", `${err.code}: ${err.message}`);
          log("fail", `${err.code}: ${err.message}`);
        }
      }
    } else if (id === "concurrency") {
      update("concurrency", "running", "Testing overlap...");
      log("info", "Starting concurrent requests...");

      try {
        await initializeAsync(initOptions);
      } catch {
        update("concurrency", "fail", "Failed to initialize");
        log("fail", "Failed to initialize for concurrency test");
        return;
      }

      const first =
        Platform.OS === "ios" ? requestProfileAsync() : verifyUserAsync();
      let secondError: { code: string; message: string } | null = null;

      try {
        if (Platform.OS === "ios") {
          await requestProfileAsync();
        } else {
          await verifyUserAsync();
        }
      } catch (e) {
        secondError = e as { code: string; message: string };
      }

      if (secondError?.code === TruecallerErrorCodes.ALREADY_IN_PROGRESS) {
        const note = `Second call rejected with ${TruecallerErrorCodes.ALREADY_IN_PROGRESS}`;
        update("concurrency", "pass", note);
        log("pass", note);
      } else {
        const note = secondError
          ? `Second call got ${secondError.code} instead of ${TruecallerErrorCodes.ALREADY_IN_PROGRESS}`
          : "Second call did not throw";
        update("concurrency", "fail", note);
        log("fail", note);
      }

      await first.catch(() => {});
      clear();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Validation Matrix</Text>
          <Text style={styles.subtitle}>
            {Platform.OS} {Platform.Version}
          </Text>
        </View>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      {SCENARIOS.map((scenario) => {
        const status = statuses[scenario.id];
        const note = notes[scenario.id];
        const config = STATUS_CONFIG[status];

        return (
          <View key={scenario.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{scenario.title}</Text>
                <Text
                  style={[
                    styles.badge,
                    { color: config.color, backgroundColor: config.bg },
                  ]}
                >
                  {config.label}
                </Text>
              </View>
              <Text style={styles.cardDescription}>{scenario.description}</Text>
              {note !== "" && <Text style={styles.note}>{note}</Text>}
            </View>
            <Pressable
              style={[styles.runButton, anyRunning && styles.runButtonDisabled]}
              onPress={() => run(scenario.id)}
              disabled={anyRunning}
            >
              <Text style={styles.runButtonText}>Run</Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.logSection}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Event log</Text>
          {logs.length > 0 && (
            <Pressable onPress={() => setLogs([])}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>
        {logs.length === 0 ? (
          <Text style={styles.emptyLog}>Run a scenario to see events.</Text>
        ) : (
          logs.map((entry) => (
            <Text
              key={entry.id}
              style={[
                styles.logLine,
                entry.level === "pass" && styles.logPass,
                entry.level === "fail" && styles.logFail,
              ]}
            >
              {entry.timestamp} {entry.message}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  cardTop: {
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  cardDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  note: {
    fontSize: 13,
    color: "#374151",
    marginTop: 2,
  },
  runButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  runButtonDisabled: {
    opacity: 0.4,
  },
  runButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  logSection: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
    marginTop: 4,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  emptyLog: {
    fontSize: 13,
    color: "#9ca3af",
  },
  logLine: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  logPass: {
    color: "#166534",
  },
  logFail: {
    color: "#991b1b",
  },
});
