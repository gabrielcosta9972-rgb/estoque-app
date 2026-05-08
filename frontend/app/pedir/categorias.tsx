import React, { useEffect, useState } from "react";
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, ShoppingCart } from "lucide-react-native";
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
        <FlatList
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`category-${item}`}
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: "/pedir/produtos", params: { category: item } })}
            >
              <Text style={styles.label}>{item}</Text>
              <ChevronRight size={20} color={colors.textDisabled} />
            </TouchableOpacity>
          )}
        />
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
  list: { padding: spacing.md, paddingTop: spacing.sm, paddingBottom: 120 },
  sep: { height: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 72,
  },
  label: { flex: 1, fontSize: 17, fontWeight: "600", color: colors.textPrimary, letterSpacing: 0.2 },
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
