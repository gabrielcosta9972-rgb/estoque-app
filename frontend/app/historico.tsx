import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Trash2, ClipboardList } from "lucide-react-native";
import ScreenHeader from "../src/ScreenHeader";
import { api, formatApiError } from "../src/api";
import { useAuth } from "../src/auth";
import { colors, spacing, radius } from "../src/theme";

type OrderItem = { product_id: string; name: string; quantity: number };

type Order = {
  id: string;
  store: string;
  store_label: string;
  items: OrderItem[];
  original_items?: OrderItem[] | null;
  adjustment_note?: string | null;
  has_adjustments?: boolean;
  status: string;
  created_by_name?: string | null;
  received_by_name?: string | null;
  created_at: string;
  received_at?: string | null;
};

export default function Historico() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const isReceber = user?.role === "receber";

const compartilharWhatsApp = async (pedido: Order) => {
  try {
    const itens = pedido.items
      ?.map((item) =>
  `• ${item.name} ${
    String(item.quantity).includes(".")
      ? `${item.quantity}kg`
      : `x${item.quantity}`
  }`
)
      .join("\n");

    const mensagem = `
📦 Pedido Recebido

Loja: ${pedido.store_label}

Itens:
${itens}

📌 Status:
${pedido.has_adjustments ? "Pedido entregue com alteração" : "Pedido entregue"}

👤 Recebido por:
${pedido.received_by_name || "Não informado"}
`;

    await Share.share({
      message: mensagem,
    });
  } catch (error) {
    Alert.alert("Erro", "Não foi possível compartilhar.");
  }
};

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Order[]>("/history");
      setOrders(data);
      setError(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const doClear = async () => {
    setConfirmOpen(false);
    setClearing(true);
    try {
      const { data } = await api.delete<{ deleted: number }>("/history");
      if (Platform.OS === "web") {
        window.alert(`${data.deleted} pedido(s) removido(s) do histórico`);
      } else {
        Alert.alert("Pronto", `${data.deleted} pedido(s) removido(s) do histórico`);
      }
      load();
    } catch (e) {
      const msg = formatApiError(e);
      if (Platform.OS === "web") window.alert(`Erro: ${msg}`);
      else Alert.alert("Erro", msg);
    } finally {
      setClearing(false);
    }
  };

  const onClear = () => {
    const msg = isReceber
      ? "Isto vai apagar TODOS os pedidos já recebidos (compartilhado entre todos os recebedores). Confirmar?"
      : "Isto vai apagar todos os seus pedidos já recebidos. Os que ainda estão em via continuam. Confirmar?";

    if (Platform.OS === "web") {
      // No navegador, Alert.alert e Modal podem falhar; usa confirm() nativo do browser
      if (window.confirm(msg)) {
        doClear();
      }
      return;
    }
    // No mobile, usa o modal customizado
    setConfirmOpen(true);
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="historico-screen">
      <ScreenHeader
        title="Histórico"
        subtitle={isReceber ? "Pedidos recebidos (compartilhado)" : "Seus pedidos"}
        color={colors.textPrimary}
      />

      {loading ? (
        <ActivityIndicator color={colors.blue} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <ClipboardList size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>Nenhum pedido no histórico</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderItem={({ item }) => {
            const recebido = item.status === "recebido";
            return (
              <View style={styles.card} testID={`historico-item-${item.id}`}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.store_label}</Text>
                    <Text style={styles.cardMeta}>
                      {item.created_by_name ? `${item.created_by_name} · ` : ""}{formatDate(item.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.tag, recebido ? styles.tagOk : styles.tagPending]}>
                    <Text style={[styles.tagText, recebido ? { color: colors.green } : { color: colors.orange }]}>
                      {recebido ? "RECEBIDO" : "EM VIA"}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                {item.items.map((it) => {
                  const original = item.original_items?.find((o) => o.product_id === it.product_id);
                  const changed = original && original.quantity !== it.quantity;
                  return (
                    <View key={it.product_id} style={styles.itemRow}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {it.name}{changed ? ` (pedido: ${original.quantity})` : ""}
                      </Text>
                      <Text style={[styles.itemQty, changed ? styles.changedQty : null]}>{String(it.quantity).includes(".")
                            ? `${it.quantity}kg`
                            : `x${it.quantity}`}
                            </Text> 
                    </View>
                  );
                })}
                {item.has_adjustments ? (
                  <View style={styles.adjustmentBox}>
                    <Text style={styles.adjustmentTitle}>Pedido entregue com alteração</Text>
                    {item.adjustment_note ? <Text style={styles.adjustmentNote}>{item.adjustment_note}</Text> : null}
                  </View>
                ) : null}
                {recebido && item.received_by_name ? (
                  <Text style={styles.receivedInfo}>Recebido por {item.received_by_name} · {formatDate(item.received_at)}</Text>
                ) : null}
                {isReceber ? (
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => compartilharWhatsApp(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.shareBtnText}>Compartilhar no WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {orders.length > 0 ? (
        <TouchableOpacity
          testID="clear-history-btn"
          style={[styles.clearBtn, clearing && { opacity: 0.6 }]}
          onPress={onClear}
          disabled={clearing}
          activeOpacity={0.85}
        >
          {clearing ? (
            <ActivityIndicator color={colors.inverse} />
          ) : (
            <>
              <Trash2 size={18} color={colors.inverse} />
              <Text style={styles.clearText}>Limpar histórico</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Limpar histórico</Text>
            <Text style={styles.modalMsg}>
              {isReceber
                ? "Isto vai apagar TODOS os pedidos já recebidos (compartilhado entre todos os recebedores). Confirmar?"
                : "Isto vai apagar todos os seus pedidos já recebidos. Os que ainda estão em via continuam. Confirmar?"}
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                testID="cancel-clear-btn"
                style={styles.modalBtnCancel}
                onPress={() => setConfirmOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirm-clear-btn"
                style={styles.modalBtnDanger}
                onPress={doClear}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnDangerText}>Limpar</Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tag: { borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  tagOk: { backgroundColor: colors.greenSoft, borderColor: colors.greenBorder },
  tagPending: { backgroundColor: colors.orangeSoft, borderColor: colors.orangeBorder },
  tagText: { fontWeight: "700", fontSize: 11, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 14, color: colors.textPrimary, marginRight: spacing.sm },
  itemQty: { fontSize: 14, fontWeight: "700", color: colors.purple },
  changedQty: { color: colors.orange },
  adjustmentBox: { backgroundColor: colors.orangeSoft, borderColor: colors.orangeBorder, borderWidth: 1, borderRadius: radius.input, padding: spacing.sm, marginTop: spacing.sm },
  adjustmentTitle: { color: colors.orange, fontWeight: "800", fontSize: 12, marginBottom: 2 },
  adjustmentNote: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  receivedInfo: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: "italic" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: spacing.md },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
  clearBtn: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    minHeight: 52,
    borderRadius: radius.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  clearText: { color: colors.inverse, fontWeight: "700", fontSize: 15, marginLeft: 8, letterSpacing: 0.3 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing.sm },
  modalMsg: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  modalBtnCancel: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  modalBtnCancelText: { color: colors.textPrimary, fontWeight: "600", fontSize: 14 },
  modalBtnDanger: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.button,
    backgroundColor: colors.danger,
  },
  modalBtnDangerText: {
    color: colors.inverse,
    fontWeight: "700",
    fontSize: 14,
  },

  shareBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#25D366",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
},
  shareBtnText: {
    color: "#25D366",
    fontWeight: "800",
    fontSize: 16,
  },

  });
