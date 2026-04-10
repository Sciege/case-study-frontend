import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { BarChart, LineChart } from "react-native-chart-kit";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  ChevronLeft,
  Calendar,
  MapPin,
  Target,
} from "lucide-react-native";
import { COLORS, SIZES } from "../../components/Theme";
import {
  getNodeStats,
  getUserStats,
  getDailyActivity,
} from "../../services/api";

const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth - SIZES.padding * 2 - 30; // Accounting for section padding

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nodeStats, setNodeStats] = useState([]);
  const [userStats, setUserStats] = useState({
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    totalUsers: 0,
  });
  const [dailyActivity, setDailyActivity] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!refreshing) setLoading(true);
    try {
      const [nodes, users, daily] = await Promise.all([
        getNodeStats().catch(() => ({ data: [] })),
        getUserStats().catch(() => ({ data: {} })),
        getDailyActivity().catch(() => ({ data: [] })),
      ]);

      setNodeStats(nodes.data || []);
      setUserStats({
        avgScore: users.data?.avgScore || 0,
        maxScore: users.data?.maxScore || 0,
        minScore: users.data?.minScore || 0,
        totalUsers: users.data?.totalUsers || 0,
      });
      setDailyActivity(daily.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(211, 47, 47, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.primary,
    },
    fillShadowGradient: COLORS.primary,
    fillShadowGradientOpacity: 0.1,
  };

  const renderSummaryCard = (title, value, sub, Icon, color) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.cardTextContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color: color }]}>
          {typeof value === "number" ? Math.round(value) : value}
        </Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
    </View>
  );

  const nodeLabels = nodeStats.slice(0, 5).map((n) => {
    const name = n.nodeName || n._id || "Unknown";
    return name.length > 10 ? name.substring(0, 8) + ".." : name;
  });

  const nodeDataValues = nodeStats.slice(0, 5).map((n) => n.totalScans || 0);

  const nodeChartData = {
    labels: nodeLabels.length > 0 ? nodeLabels : ["No Data"],
    datasets: [
      {
        data: nodeDataValues.length > 0 ? nodeDataValues : [0],
      },
    ],
  };

  const activityLabels = dailyActivity.slice(-7).map((d) => {
    const parts = d._id.split("-");
    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d._id;
  });

  const activityValues = dailyActivity.slice(-7).map((d) => d.scanCount || 0);

  const activityData = {
    labels: activityLabels.length > 0 ? activityLabels : ["-"],
    datasets: [
      {
        data: activityValues.length > 0 ? activityValues : [0],
      },
    ],
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Stack.Screen
        options={{
          headerTitle: "Visual Analytics",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Insights</Text>
          <Text style={styles.headerSubtitle}>
            Real-time activity and performance metrics.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          {renderSummaryCard(
            "Average",
            userStats.avgScore,
            "Points/User",
            TrendingUp,
            "#2196F3",
          )}
          {renderSummaryCard(
            "Highest",
            userStats.maxScore,
            "Max Points",
            Award,
            "#FF9800",
          )}
          {renderSummaryCard(
            "Lowest",
            userStats.minScore,
            "Min Points",
            Target,
            COLORS.primary,
          )}
          {renderSummaryCard(
            "Players",
            userStats.totalUsers,
            "Active Users",
            Users,
            "#4CAF50",
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Node Popularity</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Most visited QR locations in the system.
          </Text>
          {nodeStats.length > 0 ? (
            <BarChart
              data={nodeChartData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero={true}
              withInnerLines={false}
              showValuesOnTopOfBars={true}
              segments={
                Math.max(...nodeDataValues) > 0 &&
                Math.max(...nodeDataValues) < 5
                  ? Math.max(...nodeDataValues)
                  : 5
              }
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No scan history available.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Daily participation over the last week.
          </Text>
          {dailyActivity.length > 0 ? (
            <LineChart
              data={activityData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              fromZero={true}
              segments={
                Math.max(...activityValues) > 0 &&
                Math.max(...activityValues) < 5
                  ? Math.max(...activityValues)
                  : 5
              }
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No recent activity found.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.lightText,
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 10,
    color: COLORS.lightText,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  cardSub: {
    fontSize: 9,
    color: COLORS.lightText,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding,
    marginVertical: 10,
    padding: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 8,
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: "center",
  },
  noData: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    borderStyle: "dashed",
  },
  noDataText: {
    color: COLORS.lightText,
    fontSize: 13,
  },
});
