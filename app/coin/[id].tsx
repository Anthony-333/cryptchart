import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GraphPoint, LineGraph } from "react-native-graph";
import { fetchCoinHistory } from "../../services/coinApi";
import CustomSelectionDot from "../components/CustomSelectionDot";

const { width } = Dimensions.get("window");

const hapticFeedback = (type: "impactLight") => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function CoinDetails() {
  const { id, name, symbol, ticker } = useLocalSearchParams();
  const [selectedPoint, setSelectedPoint] = useState<GraphPoint | null>(null);
  const [chartData, setChartData] = useState<GraphPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("24H");

  const coinName = name?.toString() || "Bitcoin";
  const coinSymbol = symbol?.toString() || "₿";
  const coinTicker = ticker?.toString() || "BTC";

  const timeframes = ["1H", "24H", "1W", "1M", "6M", "1Y", "All"];

  useEffect(() => {
    loadChartData();
  }, [id, selectedTimeframe]);

  const getTimeRange = () => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      "1H": now - 1 * 60 * 60 * 1000,
      "24H": now - 24 * 60 * 60 * 1000,
      "1W": now - 7 * 24 * 60 * 60 * 1000,
      "1M": now - 30 * 24 * 60 * 60 * 1000,
      "6M": now - 180 * 24 * 60 * 60 * 1000,
      "1Y": now - 365 * 24 * 60 * 60 * 1000,
      All: now - 5 * 365 * 24 * 60 * 60 * 1000,
    };
    return { start: ranges[selectedTimeframe], end: now };
  };

  const loadChartData = async () => {
    try {
      setLoading(true);
      const { start, end } = getTimeRange();
      const coinCode = id?.toString().toUpperCase() || "BTC";

      const historyData = await fetchCoinHistory(coinCode, start, end);

      const formattedData = historyData.map((item) => ({
        value: item.rate || 0,
        date: new Date(item.date || Date.now()),
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error("Failed to load chart data:", error);
      // Fallback to dummy data
      setChartData([
        { value: 94273.18, date: new Date("2024-01-01") },
        { value: 96500, date: new Date("2024-01-02") },
        { value: 95200, date: new Date("2024-01-03") },
        { value: 97800, date: new Date("2024-01-04") },
        { value: 98509.75, date: new Date("2024-01-05") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = selectedPoint
    ? selectedPoint.value
    : chartData[chartData.length - 1]?.value || 98509.75;
  const currentDate = selectedPoint ? selectedPoint.date : new Date();

  const updatePriceTitle = (point: GraphPoint) => {
    setSelectedPoint(point);
  };

  const resetPriceTitle = () => {
    setSelectedPoint(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.coinSymbol}>{coinSymbol}</Text>
          <Text style={styles.coinName}>{coinName} ({coinTicker})</Text>
          <TouchableOpacity>
            <Ionicons name="star-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.exchangeButton}>
          <Text style={styles.exchangeText}>Exchange</Text>
        </TouchableOpacity>
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <Text style={styles.currentPrice}>
          ₹{currentPrice.toLocaleString()}
        </Text>
        <View style={styles.priceChange}>
          <Text style={styles.changeAmount}>+1700.254 (3.77%)</Text>
          <Text style={styles.usdPrice}>$96,679.35</Text>
        </View>
        {selectedPoint && (
          <Text style={styles.selectedDate}>
            {currentDate.toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {loading ? (
          <View
            style={[
              styles.chart,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Text>Loading chart...</Text>
          </View>
        ) : (
          <LineGraph
            points={chartData}
            animated={true}
            color="#4484B2"
            enablePanGesture={true}
            onGestureStart={() => hapticFeedback("impactLight")}
            onPointSelected={(p) => updatePriceTitle(p)}
            onGestureEnd={() => resetPriceTitle()}
            SelectionDot={CustomSelectionDot}
            style={styles.chart}
          />
        )}
      </View>

      {/* Timeframe Buttons */}
      <View style={styles.timeframeContainer}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.activeTimeframe,
            ]}
            onPress={() => setSelectedTimeframe(timeframe)}
          >
            <Text
              style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.activeTimeframeText,
              ]}
            >
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Holdings Section */}
      <View style={styles.holdingsSection}>
        <View style={styles.holdingsHeader}>
          <View style={styles.coinInfo}>
            <View style={styles.coinIcon}>
              <Text style={styles.coinIconText}>{coinSymbol}</Text>
            </View>
            <View>
              <Text style={styles.holdingsCoinName}>{coinName}</Text>
              <Text style={styles.holdingsAmount}>0.00 {coinTicker}</Text>
            </View>
          </View>
          <View style={styles.holdingsValue}>
            <Text style={styles.holdingsPrice}>₹0.00</Text>
            <Text style={styles.holdingsChange}>0.00%</Text>
          </View>
        </View>
      </View>

      {/* Transactions */}
      <TouchableOpacity style={styles.transactionsSection}>
        <Text style={styles.transactionsText}>Transactions</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coinSymbol: {
    fontSize: 24,
    fontWeight: "bold",
  },
  coinName: {
    fontSize: 18,
    fontWeight: "600",
  },
  exchangeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exchangeText: {
    color: "#fff",
    fontWeight: "600",
  },
  priceSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
  },
  priceChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  changeAmount: {
    fontSize: 16,
    color: "#00C851",
    fontWeight: "600",
  },
  usdPrice: {
    fontSize: 16,
    color: "#666",
  },
  selectedDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  chartContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  chart: {
    height: 250,
    width: width - 32,
  },
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 16,
    borderRadius: 12,
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTimeframe: {
    backgroundColor: "#007AFF",
  },
  timeframeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeTimeframeText: {
    color: "#fff",
  },
  holdingsSection: {
    margin: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  holdingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  coinIconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  holdingsCoinName: {
    fontSize: 16,
    fontWeight: "600",
  },
  holdingsAmount: {
    fontSize: 14,
    color: "#666",
  },
  holdingsValue: {
    alignItems: "flex-end",
  },
  holdingsPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  holdingsChange: {
    fontSize: 14,
    color: "#666",
  },
  transactionsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  transactionsText: {
    fontSize: 16,
    fontWeight: "600",
  },
});


