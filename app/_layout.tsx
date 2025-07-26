import { Stack } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <SafeAreaView style={{ paddingTop: insets.top }}>
        <Stack.Screen name="(tabs)" />
      </SafeAreaView>
    </Stack>
  );
}
