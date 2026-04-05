import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../../components/Theme';
import { Users, MapPin, BarChart3, Settings, ChevronRight, Activity } from 'lucide-react-native';
import { getNodes, getUsers } from '../../services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ nodes: 0, players: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [nodesRes, usersRes] = await Promise.all([getNodes(), getUsers()]);
        setStats({
          nodes: nodesRes.data.length,
          players: usersRes.data.length
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const MenuButton = ({ title, subtitle, icon: Icon, onPress, color }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
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
      <Stack.Screen options={{ title: 'Admin Hub', headerLeft: () => null }} />
      
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Admin Control</Text>
        <Text style={styles.welcomeSubtitle}>PathQuest Management System</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Activity color={COLORS.primary} size={20} />
          <Text style={styles.statValue}>{stats.players}</Text>
          <Text style={styles.statLabel}>Active Players</Text>
        </View>
        <View style={styles.statCard}>
          <MapPin color={COLORS.primary} size={20} />
          <Text style={styles.statValue}>{stats.nodes}</Text>
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
          onPress={() => router.push('/admin/players')}
        />

        <MenuButton 
          title="Manage Nodes" 
          subtitle="Add/edit locations and QR codes"
          icon={MapPin}
          color="#4CAF50"
          onPress={() => router.push('/admin/nodes')}
        />

        <MenuButton 
          title="System Stats" 
          subtitle="View leaderboard and scan analytics"
          icon={BarChart3}
          color="#FF9800"
          onPress={() => router.push('/(tabs)/leaderboard')}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.logoutBtn}
        onPress={() => router.replace('/')}
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
    fontWeight: 'bold',
    color: COLORS.white,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    marginTop: -25,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.white,
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    textTransform: 'uppercase',
  },
  menuSection: {
    padding: SIZES.padding,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  menuButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
