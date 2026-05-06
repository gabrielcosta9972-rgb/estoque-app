import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Wheat, Refrigerator, SprayCan, Box, ChevronRight, ShoppingCart } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

const ICONS: Record<string, any> = {
  Secos: Wheat,
  Geladeira: Refrigerator,
  Limpeza: SprayCan,
  Embalagens: Box,
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
        subtitle={storeLabel ? `Loja: ${storeLabel}` : "Selecione um setor"}
        color={colors.blue}
      />
      {loading ? (
        <ActivityIndicator color={colors.blue} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {categories.map((c) => {
            const Icon = ICONS[c] || Box;
            return (
              <TouchableOpacity
                key={c}
                testID={`category-${c}`}
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/pedir/produtos", params: { category: c } })}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.purpleSoft }]}>
                  <Icon size={22} color={colors.purple} />
                </View>
                <Text style={styles.label}>{c}</Text>
                <ChevronRight size={20} color={colors.textDisabled} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {totalCount > 0 ? (
        <TouchableOpacity
          testID="goto-cart-fab"
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
  body: { padding: spacing.md, paddingTop: 0, paddingBottom: 100 },
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  label: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.textPrimary },
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: colors.inverse, fontWeight: "700", fontSize: 16, marginLeft: 8, letterSpacing: 0.3 },
});
