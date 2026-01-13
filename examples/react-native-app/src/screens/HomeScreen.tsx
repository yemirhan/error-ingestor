import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ErrorIngestor, AppError } from "@error-ingestor/client";
import { fetchUser, fetchPosts } from "../services/api";
import { AppErrors, AppErrorCodes } from "../services/errors";

export function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const showResult = (message: string) => {
    setResult(message);
    setTimeout(() => setResult(null), 3000);
  };

  // Demo 1: Manual error capture
  const handleManualCapture = () => {
    const error = new AppError(
      AppErrorCodes.FEATURE_NOT_AVAILABLE,
      "Premium feature requires subscription"
    );

    ErrorIngestor.capture(error, {
      metadata: {
        screen: "HomeScreen",
        action: "manual-capture-demo",
      },
      tags: {
        severity: "low",
        demo: "true",
      },
    });

    showResult("Error captured manually!");
  };

  // Demo 2: API error with Result type
  const handleApiError = async () => {
    setLoading(true);
    const result = await fetchPosts({ simulateError: true });

    result
      .map((posts) => {
        showResult(`Loaded ${posts.length} posts`);
      })
      .mapErr((error) => {
        showResult(`Error: ${error.message}`);
      });

    setLoading(false);
  };

  // Demo 3: API timeout
  const handleTimeout = async () => {
    setLoading(true);
    const result = await fetchPosts({ simulateTimeout: true });

    result
      .map((posts) => {
        showResult(`Loaded ${posts.length} posts`);
      })
      .mapErr((error) => {
        showResult(`Timeout: ${error.message}`);
      });

    setLoading(false);
  };

  // Demo 4: Successful API call
  const handleSuccessfulApi = async () => {
    setLoading(true);
    const result = await fetchUser("1");

    result
      .map((user) => {
        showResult(`Loaded user: ${user.name}`);
      })
      .mapErr((error) => {
        showResult(`Error: ${error.message}`);
      });

    setLoading(false);
  };

  // Demo 5: Throw unhandled error (will be caught by ErrorBoundary)
  const handleCrash = () => {
    Alert.alert(
      "Crash Demo",
      "This will throw an error that will be caught by the ErrorBoundary. The app will show the error fallback screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Crash",
          style: "destructive",
          onPress: () => {
            throw new Error("Intentional crash for demo purposes");
          },
        },
      ]
    );
  };

  // Demo 6: Check queue size
  const handleCheckQueue = () => {
    const size = ErrorIngestor.getQueueSize();
    showResult(`Queue size: ${size} errors pending`);
  };

  // Demo 7: Force flush
  const handleFlush = async () => {
    setLoading(true);
    await ErrorIngestor.flush();
    showResult("Queue flushed!");
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Error Ingestor Demo</Text>
        <Text style={styles.subtitle}>
          Tap buttons to test different error scenarios
        </Text>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Capture</Text>
        <TouchableOpacity style={styles.button} onPress={handleManualCapture}>
          <Text style={styles.buttonText}>Capture Custom Error</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Errors (with Neverthrow)</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonWarning]}
          onPress={handleApiError}
        >
          <Text style={styles.buttonText}>Simulate API Error (500)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonWarning]}
          onPress={handleTimeout}
        >
          <Text style={styles.buttonText}>Simulate Timeout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSuccess]}
          onPress={handleSuccessfulApi}
        >
          <Text style={styles.buttonText}>Successful API Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ErrorBoundary Demo</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleCrash}
        >
          <Text style={styles.buttonText}>Throw Unhandled Error</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Queue Management</Text>
        <TouchableOpacity style={styles.button} onPress={handleCheckQueue}>
          <Text style={styles.buttonText}>Check Queue Size</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleFlush}>
          <Text style={styles.buttonText}>Force Flush</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Check your Error Ingestor dashboard to see captured errors
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  resultContainer: {
    backgroundColor: "#dbeafe",
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  resultText: {
    color: "#1e40af",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonWarning: {
    backgroundColor: "#f59e0b",
  },
  buttonDanger: {
    backgroundColor: "#ef4444",
  },
  buttonSuccess: {
    backgroundColor: "#10b981",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
});
