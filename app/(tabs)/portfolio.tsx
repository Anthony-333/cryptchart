import { FlashList } from "@shopify/flash-list";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCoinStore } from "../../store/coinStore";
import { usePortfolioStore } from "../../store/portfolioStore";

export default function Portfolio() {
  const {
    holdings,
    balance,
    loading,
    loadPortfolio,
    updateHoldingPrices,
    getTotalValue,
    getTotalProfitLoss,
  } = usePortfolioStore();
  const { coins } = useCoinStore();

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (coins.length > 0 && holdings.length > 0) {
      updateHoldingPrices(coins);
    }
  }, [coins, holdings.length]);

  const totalValue = getTotalValue();
  const { amount: profitLoss, percentage: profitLossPercentage } = getTotalProfitLoss();
  const isProfit = profitLoss >= 0;

  const renderHolding = ({ item }: { item: any }) => {
    const currentValue = item.quantity * item.currentPrice;
    const investedValue = item.quantity * item.averagePrice;
    const holdingProfitLoss = currentValue - investedValue;
    const holdingProfitLossPercentage = investedValue > 0 ? (holdingProfitLoss / investedValue) * 100 : 0;
    const isHoldingProfit = holdingProfitLoss >= 0;

    return (
      <View style={styles.holdingItem}>
        <View style={styles.holdingInfo}>
          <Image source={{ uri: item.imageUrl }} style={styles.coinImage} />
          <View>
            <Text style={styles.coinName}>{item.name}</Text>
            <Text style={styles.coinTicker}>{item.ticker}</Text>
            <Text style={styles.quantity}>{item.quantity.toFixed(4)} coins</Text>
          </View>
        </View>
        <View style={styles.holdingValue}>
          <Text style={styles.currentValue}>${currentValue.toFixed(2)}</Text>
          <Text style={[
            styles.profitLoss,
            { color: isHoldingProfit ? "#00C851" : "#FF3B30" }
          ]}>
            {isHoldingProfit ? "+" : ""}${holdingProfitLoss.toFixed(2)} ({isHoldingProfit ? "+" : ""}{holdingProfitLossPercentage.toFixed(2)}%)
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      
      {/* Portfolio Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.totalValue}>${totalValue.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Cash Balance</Text>
          <Text style={styles.balance}>${balance.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total P&L</Text>
          <Text style={[
            styles.profitLoss,
            { color: isProfit ? "#00C851" : "#FF3B30" }
          ]}>
            {isProfit ? "+" : ""}${profitLoss.toFixed(2)} ({isProfit ? "+" : ""}{profitLossPercentage.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* Holdings */}
      <View style={styles.holdingsSection}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        {holdings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No holdings yet</Text>
            <Text style={styles.emptySubtext}>Start trading to see your portfolio</Text>
          </View>
        ) : (
          <FlashList
            data={holdings}
            renderItem={renderHolding}
            estimatedItemSize={80}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  balance: {
    fontSize: 16,
    fontWeight: "600",
  },
  profitLoss: {
    fontSize: 16,
    fontWeight: "600",
  },
  holdingsSection: {
    flex: 1,
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  holdingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 8,
  },
  holdingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinImage: {
    width: 40,
    height: 40,
  },
  coinName: {
    fontSize: 16,
    fontWeight: "600",
  },
  coinTicker: {
    fontSize: 14,
    color: "#666",
  },
  quantity: {
    fontSize: 12,
    color: "#666",
  },
  holdingValue: {
    alignItems: "flex-end",
  },
  currentValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
});
