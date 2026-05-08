import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

export default function PedirCategorias() {
  const router = useRouter();
  const { storeLabel, totalCount } = useCart();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<string[]>("/categories");
        setCategories(data);
      } catch (e) {
        setError(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe} testID="pedir-categorias-screen">
      <ScreenHeader
        title="Categorias"
        subtitle={storeLabel ? `Loja: ${storeLabel}` : "Selecione um setor"}
        color={colors.blue}
      />
      {loading ? (
        <ActivityIndicator color={colors.blue} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.grid}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                testID={`category-${c}`}
                style={styles.tile}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/pedir/produtos", params: { category: c } })}
              >
                <Text style={styles.tileLabel}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {totalCount > 0 ? (
        <TouchableOpacity
          testID="goto-cart-fab-categorias"
          style={styles.fab}
          onPress={() => router.push("/pedir/carrinho")}
          activeOpacity={0.9}
        >
          <ShoppingCart size={20} color={colors.inverse} />
          <Text style={styles.fabText}>Carrinho ({totalCount})</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, paddingTop: spacing.sm, paddingBottom: 120 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.purpleBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  tileLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.purple,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.orange,
    minHeight: 56,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: colors.inverse, fontWeight: "700", fontSize: 16, marginLeft: 8, letterSpacing: 0.3 },
});
