import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFavoritesStore } from "../../store/favoritesStore";

export default function Favorites() {
  const { favorites, loading, loadFavorites } = useFavoritesStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() =>
        router.push(
          `/coin/${item.id}?name=${encodeURIComponent(
            item.name
          )}&ticker=${encodeURIComponent(
            item.ticker
          )}&imageUrl=${encodeURIComponent(item.imageUrl)}`
        )
      }
    >
      <View style={styles.coinInfo}>
        <Image source={{ uri: item.imageUrl }} style={styles.coinImage} />
        <View>
          <Text style={styles.coinName}>{item.name}</Text>
          <Text style={styles.coinTicker}>{item.ticker}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No favorites yet</Text>
        <Text style={styles.emptySubtext}>
          Tap the star icon on any coin to add it to favorites
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            paddingHorizontal: 16,
            paddingVertical: 5,
          }}
        >
          Favorites
        </Text>
      </View>
      <FlashList
        data={favorites}
        renderItem={renderItem}
        estimatedItemSize={70}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 8,
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinImage: {
    width: 32,
    height: 32,
  },
  coinName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  coinTicker: {
    fontSize: 14,
    color: "#666",
  },
});
