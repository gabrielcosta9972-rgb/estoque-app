import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

type Product = { id: string; name: string; category: string };

export default function PedirProdutos() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { items, addOrUpdate, totalCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Product[]>("/products", { params: { category } });
        setProducts(data);
      } catch (e) {
        setError(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const cartMap = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => (m[i.product_id] = i.quantity));
    return m;
  }, [items]);

  const updateQty = (p: Product, delta: number) => {
    const current = cartMap[p.id] || 0;
    const next = Math.max(0, current + delta);
    addOrUpdate({ product_id: p.id, name: p.name, quantity: next });
  };

  return (
    <SafeAreaView style={styles.safe} testID="pedir-produtos-screen">
      <ScreenHeader title={String(category || "Produtos")} subtitle="Selecione e ajuste a quantidade" color={colors.purple} />
      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const qty = cartMap[item.id] || 0;
            const selected = qty > 0;
            return (
              <View style={[styles.row, selected && styles.rowSelected]} testID={`product-row-${item.id}`}>
                <View style={[styles.checkBox, selected && styles.checkBoxOn]}>
                  {selected ? <Check size={16} color={colors.inverse} /> : null}
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    testID={`product-${item.id}-decrement`}
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                    onPress={() => updateQty(item, -1)}
                    disabled={qty === 0}
                  >
                    <Minus size={16} color={qty === 0 ? colors.textDisabled : colors.purple} />
                  </TouchableOpacity>
                  <Text style={styles.qty} testID={`product-${item.id}-qty`}>
                    {qty}
                  </Text>
                  <TouchableOpacity
                    testID={`product-${item.id}-increment`}
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item, 1)}
                  >
                    <Plus size={16} color={colors.purple} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto nesta categoria</Text>}
        />
      )}

      {totalCount > 0 ? (
        <TouchableOpacity
          testID="goto-cart-fab-produtos"
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  rowSelected: { borderColor: colors.purpleBorder, backgroundColor: colors.purpleSoft },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  checkBoxOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  name: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginRight: spacing.sm },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: { borderColor: colors.borderLight, backgroundColor: colors.inputBg },
  qty: {
    minWidth: 32,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 32 },
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: colors.inverse, fontWeight: "700", fontSize: 16, marginLeft: 8, letterSpacing: 0.3 },
});
