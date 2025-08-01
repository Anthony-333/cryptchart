import { FlashList } from "@shopify/flash-list";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCoinStore } from "../../store/coinStore";
import CryptoCard from "../components/CryptoCard";

export default function Home() {
  const {
    coins,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchCoins,
    fetchMoreCoins,
  } = useCoinStore();

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const renderItem = ({ item }: { item: (typeof coins)[0] }) => (
    <CryptoCard crypto={item} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loadingMore) {
      fetchMoreCoins();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading coins...</Text>
      </View>
    );
  }

  if (error && coins.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View>
        <Text style={{fontSize: 24, fontWeight: "bold", paddingHorizontal: 16, paddingVertical: 5}}>Home</Text>
      </View>

      <FlashList
        data={coins}
        renderItem={renderItem}
        estimatedItemSize={50}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onRefresh={fetchCoins}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  listContainer: {
    padding: 16,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
});

