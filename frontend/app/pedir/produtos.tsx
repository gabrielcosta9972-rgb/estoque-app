import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Minus, Plus, ShoppingCart, Check, Search, X } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

type Product = { id: string; name: string; category: string; unit?: "kg" | "un" };

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function PedirProdutos() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { items, addOrUpdate, totalCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!category) {
      router.replace("/pedir/categorias");
      return;
    }

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
  }, [category, router]);

  const cartMap = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => (m[i.product_id] = i.quantity));
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return products;
    return products.filter((p) => normalize(p.name).includes(q));
  }, [products, query]);

  const updateQty = (p: Product, delta: number) => {
    const current = cartMap[p.id] || 0;
    const next = Math.max(0, current + delta);
    addOrUpdate({ product_id: p.id, name: p.name, quantity: next, unit: p.unit ?? "un" });
  };

  return (
    <SafeAreaView style={styles.safe} testID="pedir-produtos-screen">
      <ScreenHeader title={String(category || "Produtos")} subtitle="Selecione e ajuste a quantidade" color={colors.gold} />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            testID="search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar produto..."
            placeholderTextColor={colors.textDisabled}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity
              testID="search-clear"
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          keyboardDismissMode="on-drag"
          data={filtered}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
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
                    <Minus size={16} color={qty === 0 ? colors.textDisabled : colors.gold} />
                  </TouchableOpacity>
                  <Text style={styles.qty} testID={`product-${item.id}-qty`}>
                    {qty}
                  </Text>
                  <TouchableOpacity
                    testID={`product-${item.id}-increment`}
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item, 1)}
                  >
                    <Plus size={16} color={colors.gold} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query ? "Nenhum produto encontrado para essa busca" : "Nenhum produto nesta categoria"}
            </Text>
          }
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
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 8,
  },
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
  rowSelected: { borderColor: colors.goldBorder, backgroundColor: colors.goldSoft },
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
  checkBoxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  name: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginRight: spacing.sm },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.goldBorder,
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
