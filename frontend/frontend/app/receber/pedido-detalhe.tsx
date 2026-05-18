import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, Pencil, PackageOpen, X } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";

type OrderItem = { product_id: string; name: string; quantity: number };
type Order = {
  id: string;
  store: string;
  store_label: string;
  items: OrderItem[];
  status: string;
  created_by_name?: string | null;
  created_at: string;
  adjustment_note?: string | null;
};

export default function PedidoDetalhe() {
  const { orderId, store, label } = useLocalSearchParams<{
    orderId: string;
    store?: string;
    label?: string;
  }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [pendingItems, setPendingItems] = useState<OrderItem[] | null>(null);
  const [pendingNote, setPendingNote] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Order[]>("/orders", {
        params: { store, status: "em_via" },
      });
      const found = data.find((o) => o.id === orderId) || null;
      setOrder(found);
      setPendingItems(null);
      setPendingNote("");
      setError(found ? null : "Pedido não encontrado ou já confirmado.");
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [orderId, store]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const receiveOrder = async (items?: OrderItem[], note?: string) => {
    if (!order) return;
    setActing(true);
    try {
      const finalItems = items || pendingItems;
      const finalNote = note ?? pendingNote;

      const body = finalItems
        ? {
            items: finalItems.map((it) => ({
              ...it,
              quantity: Number.isFinite(Number(it.quantity)) ? Number(it.quantity) : 0,
            })),
            adjustment_note: finalNote?.trim() || undefined,
          }
        : {};

      await api.post(`/orders/${order.id}/receive`, body);
      setEditOpen(false);
      Alert.alert("Pronto", "Pedido confirmado e enviado para entregue.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setActing(false);
    }
  };

  const openEdit = () => {
    if (!order) return;
    setEditedItems((pendingItems || order.items).map((it) => ({ ...it })));
    setAdjustmentNote(pendingNote || "");
    setEditOpen(true);
  };

  const changeQty = (productId: string, value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    const quantity = onlyNumbers === "" ? 0 : Number(onlyNumbers);
    setEditedItems((prev) =>
      prev.map((it) => (it.product_id === productId ? { ...it, quantity } : it))
    );
  };

  const saveAdjustmentOnly = () => {
    if (!order) return;
    const normalizedItems = editedItems.map((it) => ({
      ...it,
      quantity: Number.isFinite(Number(it.quantity)) ? Number(it.quantity) : 0,
    }));

    setPendingItems(normalizedItems);
    setPendingNote(adjustmentNote);

    // Atualiza a lista na tela para você continuar conferindo sem enviar ainda.
    setOrder((prev) => prev ? { ...prev, items: normalizedItems, adjustment_note: adjustmentNote } : prev);
    setEditOpen(false);
  };

  const totalItems = (pendingItems || order?.items || []).reduce((acc, it) => acc + it.quantity, 0);

  const toggleChecked = (productId: string) => {
    setCheckedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Detalhes"
        subtitle={label ? `Loja: ${label}` : ""}
        color={colors.gold}
      />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 32 }} />
      ) : error || !order ? (
        <View style={styles.empty}>
          <PackageOpen size={44} color={colors.textDisabled} />
          <Text style={styles.emptyText}>{error || "Pedido não encontrado"}</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Pedido</Text>
                  <Text style={styles.storeName}>{order.store_label || order.store}</Text>
                  <Text style={styles.meta}>
                    {order.created_by_name ? `${order.created_by_name} · ` : ""}
                    {formatDate(order.created_at)}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>EM VIA</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Produtos</Text>

              {pendingItems ? (
                <Text style={styles.pendingNotice}>
                  Alteração salva nesta tela. Confira tudo e depois toque em Confirmar.
                </Text>
              ) : null}

              {(pendingItems || order.items).map((item) => {
                const checked = !!checkedItems[item.product_id];

                return (
                  <TouchableOpacity
                    key={item.product_id}
                    style={[styles.productRow, checked && styles.productRowChecked]}
                    activeOpacity={0.82}
                    onPress={() => toggleChecked(item.product_id)}
                  >
                    <View style={[styles.checkCircle, checked && styles.checkCircleOn]}>
                      {checked ? <Check size={18} color={colors.inverse} /> : null}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, checked && styles.productNameChecked]}>
                        {item.name}
                      </Text>
                      <Text style={styles.productMeta}>
                        {checked ? "Produto separado" : "Toque para marcar como separado"}
                      </Text>
                    </View>

                    <View style={styles.productRight}>
                      <Text style={styles.qty}>x{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.editIconButton}
                        activeOpacity={0.75}
                        onPress={() => {
                          setEditedItems([{ ...item }]);
                          setAdjustmentNote(pendingNote || "");
                          setEditOpen(true);
                        }}
                      >
                        <Pencil size={22} color={colors.gold} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total de itens</Text>
                <Text style={styles.totalValue}>{totalItems}</Text>
              </View>

              <Text style={styles.sectionTitle}>Observação</Text>
              <Text style={styles.note}>{order.adjustment_note || "Sem observações"}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.85}>
              <Pencil size={18} color={colors.gold} />
              <Text style={styles.editText}>Alterar pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, acting && { opacity: 0.6 }]}
              onPress={() => receiveOrder()}
              disabled={acting}
              activeOpacity={0.85}
            >
              {acting ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <>
                  <Check size={18} color={colors.inverse} />
                  <Text style={styles.confirmText}>{pendingItems ? "Enviar alterações" : "Confirmar"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Alterar pedido</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMsg}>
              Ajuste a quantidade real disponível. Se não tiver o produto, deixe 0.
            </Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {editedItems.map((it) => (
                <View key={it.product_id} style={styles.editRow}>
                  <Text style={styles.editItemName}>{it.name}</Text>
                  <TextInput
                    value={String(it.quantity)}
                    onChangeText={(v) => changeQty(it.product_id, v)}
                    keyboardType="number-pad"
                    style={styles.qtyInput}
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              ))}

              <Text style={styles.obsLabel}>Observação</Text>
              <TextInput
                value={adjustmentNote}
                onChangeText={setAdjustmentNote}
                style={styles.noteInput}
                placeholder="Ex: tinha pouca quantidade no estoque"
                placeholderTextColor={colors.textDisabled}
                multiline
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.modalConfirm}
              onPress={saveAdjustmentOnly}
              activeOpacity={0.85}
            >
              <Text style={styles.modalConfirmText}>Salvar alteração e continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingTop: 0, paddingBottom: 120 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1.4,
    borderColor: colors.goldBorder,
    padding: spacing.lg,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "900" },
  storeName: { color: colors.gold, fontSize: 18, fontWeight: "900", marginTop: 2 },
  meta: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },
  tag: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: { color: colors.gold, fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
  sectionTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", marginBottom: 12 },
  pendingNotice: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
    lineHeight: 21,
  },
  productRow: {
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  productRowChecked: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldSoft,
  },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.goldBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkCircleOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  productName: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  productMeta: { color: colors.textSecondary, fontSize: 14, marginTop: 3 },
  productRight: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginLeft: 10,
  },
  editIconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  qty: { color: colors.gold, fontSize: 24, fontWeight: "900", marginLeft: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  totalLabel: { color: colors.textSecondary, fontSize: 18, fontWeight: "800" },
  totalValue: { color: colors.gold, fontSize: 26, fontWeight: "900" },
  note: { color: colors.textSecondary, fontSize: 17, lineHeight: 24 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    paddingBottom: 26,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: "row",
    gap: spacing.sm,
  },
  editBtn: {
    flex: 1,
    height: 58,
    borderRadius: radius.button,
    borderWidth: 1.4,
    borderColor: colors.goldBorder,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  editText: { color: colors.gold, fontSize: 17, fontWeight: "900" },
  confirmBtn: {
    flex: 1,
    height: 58,
    borderRadius: radius.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  confirmText: { color: colors.inverse, fontSize: 18, fontWeight: "900" },
  empty: { alignItems: "center", justifyContent: "center", flex: 1, padding: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: 17, textAlign: "center", marginTop: 10 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: spacing.lg,
  },
  modalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "900" },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalMsg: { color: colors.textSecondary, fontSize: 15, marginTop: 8, marginBottom: spacing.md },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  editItemName: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: "800" },
  qtyInput: {
    width: 76,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    color: colors.textPrimary,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
  },
  obsLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: "900", marginTop: 8, marginBottom: 8 },
  noteInput: {
    minHeight: 86,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    backgroundColor: colors.inputBg,
    padding: spacing.md,
    textAlignVertical: "top",
    fontSize: 15,
  },
  modalConfirm: {
    marginTop: spacing.md,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { color: colors.inverse, fontSize: 18, fontWeight: "900" },
});
