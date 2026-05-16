import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

type StoreItem = { id: string; label: string };

export default function PedirLojas() {
  const router = useRouter();
  const { setStore } = useCart();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<StoreItem[]>("/stores");
        setStores(data);
      } catch (e) {
        setError(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSelect = (s: StoreItem) => {
    if (s.label.toLowerCase() === "baeta") {
      router.push({
        pathname: "/pedir/baeta",
        params: { storeId: s.id, storeLabel: s.label },
      } as any);
      return;
    }
    setStore(s.id, s.label);
    router.push("/pedir/categorias");
  };

  return (
    <SafeAreaView style={styles.safe} testID="pedir-lojas-screen">
      <ScreenHeader title="Lojas" subtitle="Escolha a loja para pedir" color={colors.gold} />
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`store-${item.id}`}
              onPress={() => onSelect(item)}
              activeOpacity={0.8}
              style={styles.row}
            >
              <Text style={styles.label}>{item.label}</Text>
              <ChevronRight size={26} color={colors.gold} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingTop: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 82,
  },
  label: { flex: 1, fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
});
