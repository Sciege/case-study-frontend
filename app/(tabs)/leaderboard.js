import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { COLORS, SIZES } from '../../components/Theme';
import { Trophy, Medal, User } from 'lucide-react-native';
import { getLeaderboard } from '../../services/api';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRankings = async () => {
    try {
      const res = await getLeaderboard();
      setRankings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchRankings();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item, index }) => {
    const isTop3 = index < 3;
    const colors = [COLORS.secondary, '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

    return (
      <View style={[styles.rankingItem, index === 0 && styles.topRank]}>
        <View style={styles.leftContainer}>
          <View style={[styles.rankBadge, isTop3 && { backgroundColor: index === 0 ? COLORS.secondary : '#eee' }]}>
            {index === 0 ? (
              <Trophy size={16} color={COLORS.primary} />
            ) : (
              <Text style={[styles.rankText, isTop3 && { color: COLORS.primary }]}>{index + 1}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.studentId}>{item.studentId}</Text>
            {index === 0 && <Text style={styles.topLabel}>Path Master</Text>}
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.totalScore}</Text>
          <Text style={styles.ptsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.leaderboardHeader}>
        <Medal color={COLORS.secondary} size={32} />
        <Text style={styles.headerTitle}>All-Time Rankings</Text>
      </View>

      <FlatList
        data={rankings}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No rankings available yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  leaderboardHeader: {
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  listContent: {
    padding: SIZES.padding,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  topRank: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
    elevation: 3,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.lightText,
  },
  studentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  topLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  ptsLabel: {
    fontSize: 10,
    color: COLORS.lightText,
  },
  empty: {
    padding: SIZES.padding * 2,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.lightText,
  }
});
