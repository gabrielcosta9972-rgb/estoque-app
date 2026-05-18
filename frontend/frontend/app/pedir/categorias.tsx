import React, { useEffect, useState } from "react";
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {  ShoppingCart } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

const IconForCategory = ({ category }: { category: string }) => {
  const c = category.toLowerCase();
  let iconName: React.ComponentProps<typeof Ionicons>["name"] = "bag-outline";

  if (c.includes("merce")) iconName = "cart-outline";
  else if (c.includes("resfri")) iconName = "fast-food-outline";
  else if (c.includes("limp")) iconName = "sparkles-outline";
  else if (c.includes("embal")) iconName = "cube-outline";
  else if (c.includes("hort")) iconName = "leaf-outline";
  else if (c.includes("beb")) iconName = "water-outline";
  else if (c.includes("doce")) iconName = "ice-cream-outline";
  else if (c.includes("outro")) iconName = "ellipsis-horizontal-outline";

  return <Ionicons name={iconName} size={36} color={colors.gold} />;
};

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
        subtitle={storeLabel ? `Loja: ${storeLabel}` : "Selecione uma categoria"}
        color={colors.gold}
      />
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`category-${item}`}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/pedir/produtos", params: { category: item } })}
            >
              <View style={styles.iconCircle}><IconForCategory category={item} /></View>
              <Text style={styles.label}>{item}</Text>
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
  column: { gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.2,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(255,196,0,0.05)",
    marginBottom: 18,
  },
  label: { fontSize: 17, fontWeight: "800", color: colors.textPrimary, textAlign: "center", marginBottom: 8 },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.gold,
    minHeight: 56,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: colors.inverse, fontWeight: "800", fontSize: 16, marginLeft: 8, letterSpacing: 0.3 },
});
