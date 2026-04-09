import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { COLORS, SIZES } from "../../components/Theme";
import {
  Users,
  MapPin,
  BarChart3,
  Settings,
  ChevronRight,
  Activity,
  Database,
  Download,
  Upload,
} from "lucide-react-native";
import { getNodes, getUsers, getBackup, restoreData } from "../../services/api";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ nodes: 0, players: 0 });
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [nodesRes, usersRes] = await Promise.all([getNodes(), getUsers()]);
      setStats({
        nodes: nodesRes.data.length,
        players: usersRes.data.length,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (isActionLoading) return;
    try {
      setIsActionLoading(true);
      const res = await getBackup();
      const jsonString = JSON.stringify(res.data, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pathquest_backup_${new Date().toISOString().split("T")[0]}.json`;
        link.click();
      } else {
        const fileUri = FileSystem.cacheDirectory + "backup.json";
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        await Sharing.shareAsync(fileUri);
      }
      Alert.alert("Success", "Backup created successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to create backup: " + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const performRestore = async () => {
    if (isActionLoading) return;
    try {
      setIsActionLoading(true);
      console.log("--- RESTORE PROCESS STARTED ---");

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      console.log("Picker Result:", result);

      if (result.canceled) {
        console.log("Restore Canceled by user");
        return;
      }

      const file = result.assets[0];
      console.log("File Selected:", file.name, "Size:", file.size);

      let content;
      if (Platform.OS === "web") {
        content = await file.file.text();
      } else {
        content = await FileSystem.readAsStringAsync(file.uri);
      }

      console.log(
        "File Content Read (First 100 chars):",
        content.substring(0, 100),
      );
      const backupData = JSON.parse(content);
      console.log("JSON Parsed Successfully. Sending to server...");

      const res = await restoreData(backupData);
      console.log("Server Raw Response:", res);
      console.log("Server Data:", res.data);

      const counts = res.data?.counts || {
        users: 0,
        nodes: 0,
        achievements: 0,
      };
      const { users: uCount, nodes: nCount, achievements: aCount } = counts;

      console.log("Extracted Counts:", { uCount, nCount, aCount });

      const successMsg = `System restored successfully!\n\n- ${uCount} Players\n- ${nCount} Nodes\n- ${aCount} Achievements`;

      if (Platform.OS === "web") {
        window.alert("SUCCESS\n" + successMsg);
      } else {
        Alert.alert("Success", successMsg);
      }

      fetchStats(); // Refresh stats
    } catch (err) {
      console.error("RESTORE FAILURE:", err);
      const errorMsg = err.response?.data?.details || err.message;
      Alert.alert(
        "Error",
        `Failed to restore: ${errorMsg}\nCheck browser console for details.`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestore = async () => {
    const msg = "WARNING: This will replace all current data. Continue?";

    if (Platform.OS === "web") {
      if (window.confirm(msg)) {
        performRestore();
      }
    } else {
      Alert.alert("Restore System", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Select Backup File", onPress: performRestore },
      ]);
    }
  };

  const MenuButton = ({ title, subtitle, icon: Icon, onPress, color }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Icon color={color} size={28} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight color="#CCC" size={20} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Admin Hub", headerLeft: () => null }} />

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Admin Control</Text>
        <Text style={styles.welcomeSubtitle}>PathQuest Management System</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Activity color={COLORS.primary} size={20} />
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 8 }}
            />
          ) : (
            <Text style={styles.statValue}>{stats.players}</Text>
          )}
          <Text style={styles.statLabel}>Active Players</Text>
        </View>
        <View style={styles.statCard}>
          <MapPin color={COLORS.primary} size={20} />
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 8 }}
            />
          ) : (
            <Text style={styles.statValue}>{stats.nodes}</Text>
          )}
          <Text style={styles.statLabel}>Total Nodes</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionHeader}>Management</Text>

        <MenuButton
          title="Manage Players"
          subtitle="Edit points, delete users, view history"
          icon={Users}
          color="#2196F3"
          onPress={() => router.push("/admin/players")}
        />

        <MenuButton
          title="Manage Nodes"
          subtitle="Add/edit locations and QR codes"
          icon={MapPin}
          color="#4CAF50"
          onPress={() => router.push("/admin/nodes")}
        />

        <MenuButton
          title="System Stats"
          subtitle="View leaderboard and scan analytics"
          icon={BarChart3}
          color="#FF9800"
          onPress={() => router.push("/(tabs)/leaderboard")}
        />
      </View>

      <View style={[styles.menuSection, { marginTop: 0 }]}>
        <Text style={styles.sectionHeader}>System Maintenance</Text>

        <MenuButton
          title="Export Backup"
          subtitle="Download all data as JSON"
          icon={Download}
          color="#9C27B0"
          onPress={handleBackup}
        />

        <MenuButton
          title="Restore System"
          subtitle="Import data from backup file"
          icon={Upload}
          color="#F44336"
          onPress={handleRestore}
        />
      </View>

      {isActionLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Processing...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.logoutText}>Exit Admin Mode</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeSection: {
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
    paddingBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: SIZES.padding,
    marginTop: -25,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    textTransform: "uppercase",
  },
  menuSection: {
    padding: SIZES.padding,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  menuButton: {
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.lightText,
    marginTop: 2,
  },
  logoutBtn: {
    margin: SIZES.padding,
    padding: 15,
    alignItems: "center",
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
