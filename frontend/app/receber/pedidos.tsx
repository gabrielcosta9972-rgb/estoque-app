import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, PackageOpen, Pencil } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";
import { tapGestureHandlerProps } from "react-native-gesture-handler/lib/typescript/handlers/TapGestureHandler";

type OrderItem = { product_id: string; name: string; quantity: number };
type Order = {
  id: string;
  store: string;
  store_label: string;
  items: OrderItem[];
  status: string;
  created_by_name?: string | null;
  created_at: string;
};

export default function ReceberPedidos() {
  const { store, label } = useLocalSearchParams<{ store: string; label: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [adjustmentNote, setAdjustmentNote] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Order[]>("/orders", { params: { store, status: "em_via" } });
      setOrders(data);
      setError(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const receiveOrder = async (orderId: string, items?: OrderItem[], note?: string) => {
    setActingId(orderId);
    try {
      const body = items
        ? {
          items: items.map((it) => ({
            ...it,
            quantity: Number.isFinite(Number(it.quantity)) ? Number(it.quantity) : 0,
          })),
          adjustment_note: note?.trim() || undefined,
        }
        : {};

      await api.post(`/orders/${orderId}/receive`, body);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setEditingOrder(null);
      setEditedItems([]);
      setAdjustmentNote("");
      Alert.alert("Pronto", "Pedido enviado para ENTREGUE com os itens finais.");
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setActingId(null);
    }
  };

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setEditedItems(order.items.map((it) => ({ ...it })));
    setAdjustmentNote("");
  };

  const changeQty = (productId: string, value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    const quantity = onlyNumbers === "" ? 0 : Number(onlyNumbers);
    setEditedItems((prev) => prev.map((it) => it.product_id === productId ? { ...it, quantity } : it));
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <SafeAreaView style={styles.safe} testID="receber-pedidos-screen">
      <ScreenHeader title="Pedidos em via" subtitle={label ? `Loja: ${label}` : ""} color={colors.green} />
      {loading ? <ActivityIndicator color={colors.green} style={{ marginTop: 32 }} /> : error ? <Text style={styles.error}>{error}</Text> : orders.length === 0 ? (
        <View style={styles.empty}><PackageOpen size={48} color={colors.textDisabled} /><Text style={styles.emptyText}>Nenhum pedido em via</Text></View>
      ) : (
        <FlatList
          keyboardDismissMode="on-drag"
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.green} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              testID={`order-card-${item.id}`}
              activeOpacity={0.86}
              onPress={() =>
                router.push({
                  pathname: "/receber/pedido-detalhe",
                  params: {
                    orderId: item.id,
                    store: item.store,
                    label: item.store_label || item.store,
                  },
                } as any)
              }
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleLine}>
                    <Text style={styles.cardTitle}>Pedido</Text>
                    <Text style={styles.originBadge}>{item.store_label || item.store}</Text>
                  </View>
                  <Text style={styles.cardMeta}>{item.created_by_name ? `${item.created_by_name} · ` : ""}{formatDate(item.created_at)}</Text>
                </View>
                <View style={styles.tag}><Text style={styles.tagText}>EM VIA</Text></View>
              </View>
              <View style={styles.divider} />
              {item.items.map((it) => (
                <View key={it.product_id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={2}>{it.name}</Text>
                  <Text style={styles.itemQty}>x{it.quantity}</Text>
                </View>
              ))}

              <Text style={styles.tapHint}>Toque no pedido para ver detalhes</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/receber/pedido-detalhe",
                      params: {
                        orderId: item.id,
                        store: item.store,
                        label: item.store_label || item.store,
                      },
                    } as any)
                  }
                  activeOpacity={0.85}
                >
                  <Pencil size={18} color={colors.green} />
                  <Text style={styles.editText}>Detalhes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.receiveBtn, actingId === item.id && { opacity: 0.6 }]} onPress={() => receiveOrder(item.id)} disabled={actingId === item.id} activeOpacity={0.85}>
                  {actingId === item.id ? <ActivityIndicator color={colors.inverse} /> : <><Check size={18} color={colors.inverse} /><Text style={styles.receiveText}>Confirmar</Text></>}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!editingOrder} transparent animationType="slide" onRequestClose={() => setEditingOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar pedido antes de entregar</Text>
            <Text style={styles.modalMsg}>Coloque a quantidade que realmente tem no estoque. Se não tiver o produto, deixe 0.</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {editedItems.map((it) => (
                <View key={it.product_id} style={styles.editItemRow}>
                  <Text style={styles.editItemName}>{it.name}</Text>
                  <TextInput
                    style={styles.qtyInput}
                    value={String(it.quantity)}
                    keyboardType="number-pad"
                    onChangeText={(v) => changeQty(it.product_id, v)}
                  />
                </View>
              ))}
              <TextInput
                style={styles.noteInput}
                value={adjustmentNote}
                onChangeText={setAdjustmentNote}
                placeholder="Observação: pouco estoque, produto em falta..."
                placeholderTextColor={colors.textDisabled}
                multiline
              />
            </ScrollView>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingOrder(null)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => editingOrder && receiveOrder(editingOrder.id, editedItems, adjustmentNote)}
                disabled={!editingOrder || actingId === editingOrder.id}
              >
                <Text style={styles.saveText}>Enviar alterado</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.greenBorder, padding: spacing.md, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  originBadge: { color: colors.gold, fontSize: 20, fontWeight: "900" },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tag: { backgroundColor: colors.orangeSoft, borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.orangeBorder },
  tagText: { color: colors.orange, fontWeight: "700", fontSize: 11, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  itemName: { flex: 1, fontSize: 15, color: colors.textPrimary, marginRight: spacing.sm },
  itemQty: { fontSize: 15, fontWeight: "700", color: colors.purple },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  editBtn: { flex: 1, minHeight: 52, borderRadius: radius.button, borderWidth: 1, borderColor: colors.greenBorder, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  editText: { color: colors.green, fontWeight: "700", fontSize: 14, marginLeft: 6 },
  receiveBtn: { flex: 1, flexDirection: "row", backgroundColor: colors.green, minHeight: 52, borderRadius: radius.button, alignItems: "center", justifyContent: "center" },
  receiveText: { color: colors.inverse, fontWeight: "700", fontSize: 15, marginLeft: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: spacing.md },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: spacing.md },
  modalCard: { width: "100%", maxWidth: 520, backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing.xs },
  modalMsg: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  editItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingVertical: spacing.sm },
  editItemName: { flex: 1, color: colors.textPrimary, fontSize: 14, marginRight: spacing.sm },
  qtyInput: { width: 72, minHeight: 44, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.input, textAlign: "center", color: colors.textPrimary, fontWeight: "700" },
  noteInput: { minHeight: 80, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.input, padding: spacing.sm, marginTop: spacing.md, color: colors.textPrimary, textAlignVertical: "top" },
  modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { minHeight: 46, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radius.button, borderWidth: 1, borderColor: colors.borderStrong },
  cancelText: { color: colors.textPrimary, fontWeight: "600" },
  saveBtn: { minHeight: 46, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", borderRadius: radius.button, backgroundColor: colors.green },
  saveText: { color: colors.inverse, fontWeight: "700" },
  tapHint: { color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: 8 },
});
