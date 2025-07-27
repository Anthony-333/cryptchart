import { useCoinStore } from "@/store/coinStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { Ionicons } from "@expo/vector-icons";
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
  TextInput,
  TouchableOpacity,
  View
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
  const { buyCoin, sellCoin, holdings } = usePortfolioStore();

  const coinImageUrl =
    imageUrl?.toString() ||
    `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/32/${id
      ?.toString()
      .toLowerCase()}.png`;
  const [selectedPoint, setSelectedPoint] = useState<GraphPoint | null>(null);
  const [chartData, setChartData] = useState<GraphPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("24H");
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [priceInput, setPriceInput] = useState('0');
  const [amountInput, setAmountInput] = useState('0.1');

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

  const handleBuy = async () => {
    const coinId = id?.toString() || "";
    const quantity = 0.1; // Default quantity, you can make this configurable
    const success = await buyCoin(
      coinId,
      coinName,
      coinTicker,
      coinImageUrl,
      quantity,
      currentPrice
    );

    if (success) {
      alert(`Successfully bought ${quantity} ${coinTicker}`);
    } else {
      alert("Insufficient funds");
    }
  };

  const handleSell = async () => {
    const coinId = id?.toString() || "";
    const holding = holdings.find((h) => h.id === coinId);

    if (!holding) {
      alert("You don't own this coin");
      return;
    }

    const quantity = Math.min(0.1, holding.quantity); // Sell 0.1 or all if less
    const success = await sellCoin(coinId, quantity, currentPrice);

    if (success) {
      alert(`Successfully sold ${quantity} ${coinTicker}`);
    } else {
      alert("Insufficient holdings");
    }
  };

  useEffect(() => {
    setPriceInput(currentPrice.toString());
  }, [currentPrice]);

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

      {/* Trading Interface */}
      <View style={styles.tradingInterface}>
        {/* Buy/Sell Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleLeft,
              orderType === 'buy' && styles.toggleActive,
            ]}
            onPress={() => setOrderType('buy')}
          >
            <Text style={[
              styles.toggleText,
              orderType === 'buy' && styles.toggleActiveText,
            ]}>
              Buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleRight,
              orderType === 'sell' && styles.toggleActiveSell,
            ]}
            onPress={() => setOrderType('sell')}
          >
            <Text style={[
              styles.toggleText,
              orderType === 'sell' && styles.toggleActiveText,
            ]}>
              Sell
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Price (USDT)</Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.adjustButton}>
              <Text style={styles.adjustButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.priceInput}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="numeric"
              placeholder="0.0000"
            />
            <TouchableOpacity style={styles.adjustButton}>
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Amount ({coinTicker})</Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.adjustButton}>
              <Text style={styles.adjustButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="numeric"
              placeholder="0.0000"
            />
            <TouchableOpacity style={styles.adjustButton}>
              <Text style={styles.adjustButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Percentage Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderFill} />
            <View style={styles.sliderThumb} />
          </View>
          <View style={styles.percentageLabels}>
            <Text style={styles.percentageText}>0%</Text>
            <Text style={styles.percentageText}>25%</Text>
            <Text style={styles.percentageText}>50%</Text>
            <Text style={styles.percentageText}>75%</Text>
            <Text style={styles.percentageText}>100%</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total (USDT)</Text>
          <Text style={styles.totalValue}>
            {(parseFloat(priceInput || '0') * parseFloat(amountInput || '0')).toFixed(4)}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionRow}>
            <View style={styles.checkbox} />
            <Text style={styles.optionText}>TP/SL</Text>
          </View>
          <View style={styles.optionRow}>
            <View style={styles.checkbox} />
            <Text style={styles.optionText}>Iceberg</Text>
          </View>
        </View>

        {/* Available Balance */}
        <View style={styles.balanceInfo}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Avbl</Text>
            <Text style={styles.balanceValue}>0.03179004 USDT</Text>
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Max {orderType === 'buy' ? 'Buy' : 'Sell'}</Text>
            <Text style={styles.balanceValue}>0.18 {coinTicker}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Est. Fee</Text>
            <Text style={styles.balanceValue}>-- {coinTicker}</Text>
          </View>
        </View>
      </View>

      {/* Trading Section */}
      <View style={styles.tradingSection}>
        <TouchableOpacity 
          style={[
            styles.tradeButton,
            orderType === 'buy' ? styles.buyButton : styles.sellButton
          ]} 
          onPress={orderType === 'buy' ? handleBuy : handleSell}
        >
          <Text style={styles.tradeButtonText}>
            {orderType === 'buy' ? 'Buy' : 'Sell'} {coinTicker}
          </Text>
        </TouchableOpacity>
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
    paddingVertical: 10,
  },
  chart: {
    height: 250,
    width: width - 32,
  },
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  tradingSection: {
    flexDirection: "row",
    gap: 12,
    margin: 16,
    marginBottom: 20,
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#00C851",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sellButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  sellButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tradingInterface: {
    backgroundColor: "#f8f9fa",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  toggleLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toggleRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleActive: {
    backgroundColor: "#00C851",
  },
  toggleActiveSell: {
    backgroundColor: "#FF3B30",
  },
  toggleText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleActiveText: {
    color: "#fff",
  },
  orderTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 20,
  },
  orderTypeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderTypeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    marginBottom: 8,
  },
  inputLabel: {
    color: "#666",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  adjustButton: {
    padding: 8,
  },
  adjustButtonText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    color: "#333",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 12,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    position: "relative",
    marginBottom: 8,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 4,
    width: "25%",
    backgroundColor: "#00C851",
    borderRadius: 2,
  },
  sliderThumb: {
    position: "absolute",
    left: "25%",
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: "#00C851",
    borderRadius: 6,
    transform: [{ translateX: -6 }],
  },
  percentageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  percentageText: {
    color: "#666",
    fontSize: 12,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginBottom: 20,
  },
  totalLabel: {
    color: "#666",
    fontSize: 16,
  },
  totalValue: {
    color: "#333",
    fontSize: 18,
    fontWeight: "600",
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 2,
  },
  optionText: {
    color: "#333",
    fontSize: 14,
  },
  balanceInfo: {
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    color: "#666",
    fontSize: 14,
    flex: 1,
  },
  balanceValue: {
    color: "#333",
    fontSize: 14,
    flex: 2,
    textAlign: "right",
  },
  addButton: {
    width: 20,
    height: 20,
    backgroundColor: "#FFD700",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  addButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
  },
  tradeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  tradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
