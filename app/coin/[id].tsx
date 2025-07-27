import { useCoinStore } from "@/store/coinStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GraphPoint, LineGraph } from "react-native-graph";
import { fetchCoinHistory } from "../../services/coinApi";
import AxisLabel from "../components/AxisLabel";
import CustomSelectionDot from "../components/CustomSelectionDot";

const { width } = Dimensions.get("window");

const hapticFeedback = (type: "impactLight") => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const getMinMaxValues = (data: GraphPoint[]) => {
  if (data.length === 0)
    return { min: { x: 0, value: 0 }, max: { x: 0, value: 0 } };

  if (data.length === 1) {
    return {
      min: { x: 0, value: data[0].value },
      max: { x: width - 32, value: data[0].value },
    };
  }

  let minValue = data[0].value;
  let maxValue = data[0].value;
  let minIndex = 0;
  let maxIndex = 0;

  data.forEach((point, index) => {
    if (point.value < minValue) {
      minValue = point.value;
      minIndex = index;
    }
    if (point.value > maxValue) {
      maxValue = point.value;
      maxIndex = index;
    }
  });

  const chartWidth = width - 32;
  return {
    min: {
      x: (minIndex / (data.length - 1)) * chartWidth,
      value: minValue,
    },
    max: {
      x: (maxIndex / (data.length - 1)) * chartWidth,
      value: maxValue,
    },
  };
};

export default function CoinDetails() {
  const { id, name, symbol, ticker, imageUrl } = useLocalSearchParams();
  const { addToFavorites, removeFromFavorites, isFavorite, loadFavorites } =
    useFavoritesStore();
  const { coins } = useCoinStore();

  const coinImageUrl =
    imageUrl?.toString() ||
    `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/32/${id
      ?.toString()
      .toLowerCase()}.png`;
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
    loadFavorites();
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
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to calculate price change
  const getPriceChange = () => {
    if (chartData.length < 2) return { amount: 0, percentage: 0 };

    const currentPrice = chartData[chartData.length - 1]?.value || 0;
    const previousPrice = chartData[0]?.value || 0;

    const changeAmount = currentPrice - previousPrice;
    const changePercentage =
      previousPrice !== 0 ? (changeAmount / previousPrice) * 100 : 0;

    return { amount: changeAmount, percentage: changePercentage };
  };

  const currentPrice = selectedPoint
    ? selectedPoint.value
    : chartData[chartData.length - 1]?.value || 0;
  const currentDate = selectedPoint ? selectedPoint.date : new Date();
  const { amount: changeAmount, percentage: changePercentage } =
    getPriceChange();
  const isPositive = changeAmount >= 0;

  const updatePriceTitle = (point: GraphPoint) => {
    setSelectedPoint(point);
  };

  const resetPriceTitle = () => {
    setSelectedPoint(null);
  };

  const { min, max } = getMinMaxValues(chartData);

  const handleFavoriteToggle = async () => {
    const coinId = id?.toString() || "";
    const favoriteItem = {
      id: coinId,
      name: coinName,
      ticker: coinTicker,
      imageUrl: coinImageUrl,
    };

    if (isFavorite(coinId)) {
      await removeFromFavorites(coinId);
    } else {
      await addToFavorites(favoriteItem);
    }
  };

  const isCurrentlyFavorite = isFavorite(id?.toString() || "");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadChartData}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={{ uri: coinImageUrl }}
              style={styles.coinImage}
              resizeMode="contain"
            />
            <Text style={styles.coinName}>
              {coinName} ({coinTicker})
            </Text>
          </View>

          <View>
            <TouchableOpacity onPress={handleFavoriteToggle}>
              <Ionicons
                name={isCurrentlyFavorite ? "star" : "star-outline"}
                size={24}
                color={isCurrentlyFavorite ? "#FFD700" : "#000"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <Text style={styles.currentPrice}>
          ${currentPrice.toLocaleString()}
        </Text>
        <View style={styles.priceChange}>
          <Text
            style={[
              styles.changeAmount,
              { color: isPositive ? "#00C851" : "#FF3B30" },
            ]}
          >
            {isPositive ? "+" : ""}
            {changeAmount.toFixed(2)} ({isPositive ? "+" : ""}
            {changePercentage.toFixed(2)}%)
          </Text>
          <Text style={styles.usdPrice}>{selectedTimeframe}</Text>
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
        ) : chartData.length === 0 ? (
          <View
            style={[
              styles.chart,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Text style={styles.apiLimitText}>
              All API credits have been consumed. It will refresh at 12:00 AM
            </Text>
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
            TopAxisLabel={
              chartData.length > 0
                ? () => <AxisLabel x={max.x} value={max.value} />
                : undefined
            }
            BottomAxisLabel={
              chartData.length > 0
                ? () => <AxisLabel x={min.x} value={min.value} />
                : undefined
            }
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

      {/* Related Coins */}
      <View style={styles.relatedCoinsSection}>
        <Text style={styles.sectionTitle}>Related Coins</Text>
        <FlashList
          data={coins.slice(0, 10)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.relatedCoinItem}
              onPress={() =>
                router.push(
                  `/coin/${item.id}?name=${encodeURIComponent(
                    item.name
                  )}&ticker=${encodeURIComponent(
                    item.ticker
                  )}&imageUrl=${encodeURIComponent(item.imageUrl || "")}`
                )
              }
            >
              <View style={styles.coinInfo}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.relatedCoinImage}
                />
                <View>
                  <Text style={styles.relatedCoinName}>{item.name}</Text>
                  <Text style={styles.relatedCoinTicker}>{item.ticker}</Text>
                </View>
              </View>
              <View style={styles.relatedCoinPrice}>
                <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
                <Text
                  style={[
                    styles.changeText,
                    { color: item.change >= 0 ? "#00C851" : "#FF3B30" },
                  ]}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          )}
          estimatedItemSize={60}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        />
      </View>
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
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  coinImage: {
    width: 24,
    height: 24,
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
  apiLimitText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  positiveChange: {
    color: "#00C851",
  },
  negativeChange: {
    color: "#FF0000",
  },
  relatedCoinsSection: {
    margin: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  relatedCoinItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 8,
  },
  relatedCoinImage: {
    width: 32,
    height: 32,
  },
  relatedCoinName: {
    fontSize: 14,
    fontWeight: "600",
  },
  relatedCoinTicker: {
    fontSize: 12,
    color: "#666",
  },
  relatedCoinPrice: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  changeText: {
    fontSize: 12,
  },
});
