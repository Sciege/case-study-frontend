import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, SIZES } from "../components/Theme";
import { LogIn } from "lucide-react-native";
import { getUser } from "../services/api";
import { ADMIN_SECRET_ID } from "../constants/Config";
import { saveSession, getSession } from "../services/auth";

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const savedId = await getSession();
      if (savedId) {
        if (savedId === ADMIN_SECRET_ID) {
          setStudentId(savedId);
        } else {
          router.replace(`/(tabs)/dashboard?studentId=${savedId}`);
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    if (!studentId.trim()) {
      Alert.alert("Error", "Please enter your Student ID");
      return;
    }

    setLoading(true);
    try {
      await saveSession(studentId.trim());

      // Check for Admin secret bypass
      if (studentId.trim() === ADMIN_SECRET_ID) {
        router.replace("/admin/dashboard");
        return;
      }

      // Check if user exists or create one
      await getUser(studentId.trim());
      router.replace(`/(tabs)/dashboard?studentId=${studentId.trim()}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>PathQuest</Text>
        <Text style={styles.subtitle}>
          Enter your Student ID to start exploring
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 2024-0001"
          value={studentId}
          onChangeText={setStudentId}
          placeholderTextColor={COLORS.lightText}
          autoFocus
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <LogIn color={COLORS.white} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>
            {loading ? "Connecting..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/admin/nodes")}>
          <Text style={styles.footerText}>PathQuest 2026</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.borderRadius * 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: "center",
    marginBottom: SIZES.padding * 1.5,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: SIZES.padding,
    color: COLORS.text,
  },
  button: {
    width: "100%",
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerText: {
    marginTop: SIZES.padding,
    color: COLORS.lightText,
    fontSize: 12,
  },
});
