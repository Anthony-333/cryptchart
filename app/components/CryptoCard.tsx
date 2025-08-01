import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MiniChart from "./MiniChart";

const formatMarketCap = (marketCap: string | number): string => {
  if (typeof marketCap === 'string') {
    // If it's already formatted as string, return as is
    return marketCap;
  }
  
  const value = Number(marketCap);
  if (isNaN(value)) return 'N/A';
  
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(1)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

interface CryptoCardProps {
  crypto: {
    id: string;
    name: string;
    ticker: string;
    price: number;
    marketCap: number;
    change: number;
    icon: string;
    imageUrl?: string;
    color: string;
    chartData: number[];
  };
}

export default function CryptoCard({ crypto }: CryptoCardProps) {
  const isPositive = crypto.change > 0;

  const handlePress = () => {
    router.push(`/coin/${crypto.id}?name=${encodeURIComponent(crypto.name)}&symbol=${encodeURIComponent(crypto.icon)}&ticker=${encodeURIComponent(crypto.ticker)}`);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: crypto.imageUrl ? 'transparent' : crypto.color }]}>
          {crypto.imageUrl ? (
            <Image 
              source={{ uri: crypto.imageUrl }} 
              style={styles.coinImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.icon}>{crypto.icon}</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{crypto.name}</Text>
          <Text style={styles.ticker}>{crypto.ticker} • {formatMarketCap(crypto.marketCap)}</Text>
        </View>
      </View>

      <View style={styles.centerSection}>
        <MiniChart data={crypto.chartData} color={crypto.color} />
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.price}>${crypto.price?.toFixed(2) || "0.00"}</Text>
        <Text
          style={[styles.change, { color: isPositive ? "#34C759" : "#FF3B30" }]}
        >
          {isPositive ? "+" : ""}
          {crypto.change?.toFixed(2) || "0.00"}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  coinImage: {
    width: 32,
    height: 32,
  },
  icon: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  ticker: {
    fontSize: 12,
    color: "#8E8E93",
  },
  centerSection: {
    width: 60,
    height: 30,
    marginHorizontal: 12,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: "500",
  },
});






