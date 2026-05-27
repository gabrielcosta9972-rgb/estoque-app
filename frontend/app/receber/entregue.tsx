import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, AlertTriangle, Trash2 } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";

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

export default function EntregueScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Order[]>("/orders", { params: { status: "recebido" } });
      setOrders(data);
      setError(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch { return ""; }
  };

  const clearDelivered = () => {
    Alert.alert(
      "Limpar entregues",
      "Isso vai apagar todos os pedidos entregues do histórico compartilhado. Confirmar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              await api.delete("/history");
              setOrders([]);
            } catch (e) {
              Alert.alert("Erro", formatApiError(e));
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Order }) => {
    const changed = !!item.has_adjustments;

    return (
      <View style={[styles.card, changed ? styles.cardChanged : null]} testID={`entregue-item-${item.id}`}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.store_label}</Text>
            <Text style={styles.cardMeta}>
              {item.created_by_name ? `Pedido de ${item.created_by_name} · ` : ""}{formatDate(item.created_at)}
            </Text>
          </View>
          <View style={[styles.tag, changed ? styles.tagChanged : styles.tagOk]}>
            {changed ? <AlertTriangle size={14} color={colors.orange} /> : <CheckCircle2 size={14} color={colors.green} />}
            <Text style={[styles.tagText, changed ? { color: colors.orange } : { color: colors.green }]}>
              {changed ? "ALTERADO" : "ENTREGUE"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {item.items.map((it) => {
          const original = item.original_items?.find((o) => o.product_id === it.product_id);
          const itemChanged = original && original.quantity !== it.quantity;
          return (
            <View key={it.product_id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={2}>{it.name}</Text>
                {itemChanged ? (
                  <Text style={styles.itemOriginal}>Pedido original: {String(original.quantity).includes(".")
                    ? `${original.quantity}kg`
                    : `x${original.quantity}`}</Text>
                ) : null}
              </View>
              <Text style={[styles.itemQty, itemChanged ? styles.changedQty : null]}>
                {String(it.quantity).includes(".")
                  ? `${it.quantity}kg`
                  : `x${it.quantity}`}
</Text>
            </View>
          );
        })}

        {changed ? (
          <View style={styles.adjustmentBox}>
            <Text style={styles.adjustmentTitle}>Entregue com alteração</Text>
            <Text style={styles.adjustmentText}>Algum produto teve quantidade menor, acabou ou foi ajustado pelo estoque.</Text>
            {item.adjustment_note ? <Text style={styles.adjustmentNote}>{item.adjustment_note}</Text> : null}
          </View>
        ) : (
          <View style={styles.okBox}>
            <Text style={styles.okText}>Pedido entregue sem alteração.</Text>
          </View>
        )}

        {item.received_by_name ? (
          <Text style={styles.receivedInfo}>Enviado por {item.received_by_name} · {formatDate(item.received_at)}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} testID="entregue-screen">
      <ScreenHeader title="Entregue" subtitle="Pedidos confirmados pelo recebimento" />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.green} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={orders.length ? styles.list : styles.emptyWrap}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum pedido entregue</Text>
              <Text style={styles.emptyText}>Quando o recebimento confirmar um pedido, ele vai aparecer aqui.</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}

      {orders.length > 0 ? (
        <TouchableOpacity
          style={[styles.clearBtn, clearing && { opacity: 0.6 }]}
          onPress={clearDelivered}
          disabled={clearing}
          activeOpacity={0.85}
        >
          {clearing ? <ActivityIndicator color={colors.inverse} /> : <><Trash2 size={18} color={colors.inverse} /><Text style={styles.clearText}>Limpar entregues</Text></>}
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingBottom: 100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.danger, textAlign: "center", fontWeight: "700" },
  emptyWrap: { flexGrow: 1, padding: spacing.md, justifyContent: "center" },
  emptyCard: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.lg, alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  emptyText: { marginTop: spacing.sm, textAlign: "center", color: colors.textSecondary },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.md },
  cardChanged: { borderColor: colors.orangeBorder, backgroundColor: colors.orangeSoft },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  cardMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 12 },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 5 },
  tagOk: { backgroundColor: colors.greenSoft },
  tagChanged: { backgroundColor: colors.orangeSoft },
  tagText: { fontSize: 11, fontWeight: "900" },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  itemName: { flex: 1, color: colors.textPrimary, fontWeight: "600" },
  itemOriginal: { marginTop: 2, color: colors.orange, fontSize: 12, fontWeight: "700" },
  itemQty: { marginLeft: spacing.sm, color: colors.textPrimary, fontWeight: "900" },
  changedQty: { color: colors.orange },
  adjustmentBox: { marginTop: spacing.sm, borderRadius: radius.input, borderWidth: 1, borderColor: colors.orangeBorder, backgroundColor: colors.card, padding: spacing.sm },
  adjustmentTitle: { color: colors.orange, fontWeight: "900" },
  adjustmentText: { marginTop: 2, color: colors.textSecondary, fontSize: 12 },
  adjustmentNote: { marginTop: 6, color: colors.textPrimary, fontWeight: "600" },
  okBox: { marginTop: spacing.sm, borderRadius: radius.input, backgroundColor: colors.greenSoft, padding: spacing.sm },
  okText: { color: colors.green, fontWeight: "800" },
  receivedInfo: { marginTop: spacing.sm, fontSize: 12, color: colors.textSecondary },
  clearBtn: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md, height: 52, borderRadius: radius.button, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  clearText: { color: colors.inverse, fontWeight: "800" },
});
