import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Trash2, Send, ShoppingCart } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { useCart } from "../../src/cart";
import { colors, spacing, radius } from "../../src/theme";

export default function Carrinho() {
  const router = useRouter();
  const { items, store, storeLabel, remove, clear, totalCount } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!store || items.length === 0) return;
    setSubmitting(true);
    try {
      await api.post("/orders", {
        store,
        items: items.map((i) => ({ product_id: i.product_id, name: i.name, quantity: i.quantity, unit: i.unit ?? "un" })),
      });
      clear();
      Alert.alert("Pedido enviado!", "Seu pedido está em via.", [
        { text: "OK", onPress: () => router.replace("/home") },
      ]);
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="carrinho-screen">
      <ScreenHeader
        title="Carrinho"
        subtitle={storeLabel ? `Loja: ${storeLabel}` : ""}
        color={colors.orange}
      />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <ShoppingCart size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>Carrinho vazio</Text>
          <TouchableOpacity
            testID="empty-go-back"
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Adicionar produtos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.product_id}
            contentContainerStyle={{ padding: spacing.md, paddingTop: 0, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <View style={styles.row} testID={`cart-item-${item.product_id}`}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>Quantidade: {item.quantity}{item.unit ?? "un"}</Text>
                </View>
                <TouchableOpacity
                  testID={`cart-remove-${item.product_id}`}
                  onPress={() => remove(item.product_id)}
                  style={styles.removeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.footer}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Total de itens</Text>
              <Text style={styles.summaryValue}>{totalCount}</Text>
            </View>
            <TouchableOpacity
              testID="confirm-order-btn"
              style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
              onPress={onConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <>
                  <Send size={18} color={colors.inverse} />
                  <Text style={styles.confirmText}>Confirmar Pedido</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
    borderColor: colors.orangeBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  name: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: spacing.md },
  backBtn: { marginTop: spacing.lg, padding: spacing.md },
  backText: { color: colors.orange, fontWeight: "600", fontSize: 15 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.md,
  },
  summary: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  confirmBtn: {
    flexDirection: "row",
    backgroundColor: colors.orange,
    minHeight: 56,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { color: colors.inverse, fontWeight: "700", fontSize: 16, marginLeft: 8, letterSpacing: 0.3 },
});
