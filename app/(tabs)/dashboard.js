import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { COLORS, SIZES } from '../../components/Theme';
import { Award, Clock, History, LogOut } from 'lucide-react-native';
import { getUser } from '../../services/api';
import { getSession, clearSession } from '../../services/auth';

export default function Dashboard() {
  const { studentId: paramId } = useLocalSearchParams();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    let id = paramId;
    if (!id) {
      id = await getSession();
    }
    
    if (!id) {
      router.replace('/');
      return;
    }

    setLoading(true);
    try {
      const res = await getUser(id);
      setUserData(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [paramId]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  if (loading) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Loading Dashboard...</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Stack.Screen options={{
        headerTitle: 'PathQuest Dashboard',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <LogOut color={COLORS.white} size={22} />
          </TouchableOpacity>
        )
      }} />
      <View style={styles.header}>
        <View style={styles.scoreCard}>
          <Award color={COLORS.secondary} size={48} />
          <Text style={styles.totalScoreLabel}>Current Score</Text>
          <Text style={styles.totalScoreValue}>{userData.totalScore}</Text>
        </View>

        <View style={styles.studentCard}>
          <Text style={styles.studentIdLabel}>Student ID</Text>
          <Text style={styles.studentIdValue}>{userData.studentId}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent History</Text>
      
      {userData.scanHistory && userData.scanHistory.length > 0 ? (
        [...userData.scanHistory].reverse().map((scan, index) => (
          <View key={index} style={styles.scanHistoryItem}>
            <View style={styles.scanPrimary}>
              <View style={styles.iconCircle}>
                <Clock color={COLORS.primary} size={20} />
              </View>
              <View>
                <Text style={styles.nodeName}>{scan.nodeName || scan.nodeId}</Text>
                <Text style={styles.timestamp}>{new Date(scan.timestamp).toLocaleDateString()} {new Date(scan.timestamp).toLocaleTimeString()}</Text>
              </View>
            </View>
            <View style={styles.pointBadge}>
              <Text style={styles.pointText}>+{scan.points}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <History color={COLORS.lightText} size={48} />
          <Text style={styles.emptyText}>No scans yet. Go start exploring!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  header: {
    marginBottom: SIZES.padding * 1.5,
  },
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius * 2,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  totalScoreLabel: {
    fontSize: 16,
    color: COLORS.lightText,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  totalScoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
  },
  studentCard: {
    paddingHorizontal: SIZES.padding,
  },
  studentIdLabel: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  studentIdValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.padding,
  },
  scanHistoryItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  scanPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  pointBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pointText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.primary,
  },
  emptyContainer: {
    paddingVertical: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.lightText,
    fontSize: 16,
    fontStyle: 'italic',
  }
});
