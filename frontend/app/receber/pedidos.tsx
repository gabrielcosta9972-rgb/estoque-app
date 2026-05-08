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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, PackageOpen } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";

type Order = {
  id: string;
  store: string;
  store_label: string;
  items: { product_id: string; name: string; quantity: number }[];
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

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Order[]>("/orders", {
        params: { store, status: "em_via" },
      });
      setOrders(data);
      setError(null);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onReceive = async (orderId: string) => {
    setActingId(orderId);
    try {
      await api.post(`/orders/${orderId}/receive`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="receber-pedidos-screen">
      <ScreenHeader
        title="Pedidos em via"
        subtitle={label ? `Loja: ${label}` : ""}
        color={colors.green}
      />
      {loading ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <PackageOpen size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>Nenhum pedido em via</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.green}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card} testID={`order-card-${item.id}`}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Pedido</Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>EM VIA</Text>
                </View>
              </View>
              <View style={styles.divider} />
              {item.items.map((it) => (
                <View key={it.product_id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.name}
                  </Text>
                  <Text style={styles.itemQty}>x{it.quantity}</Text>
                </View>
              ))}

              <TouchableOpacity
                testID={`order-receive-${item.id}`}
                style={[styles.receiveBtn, actingId === item.id && { opacity: 0.6 }]}
                onPress={() => onReceive(item.id)}
                disabled={actingId === item.id}
                activeOpacity={0.85}
              >
                {actingId === item.id ? (
                  <ActivityIndicator color={colors.inverse} />
                ) : (
                  <>
                    <Check size={18} color={colors.inverse} />
                    <Text style={styles.receiveText}>Confirmar Recebimento</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tag: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.tag,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  tagText: { color: colors.orange, fontWeight: "700", fontSize: 11, letterSpacing: 0.6 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  itemName: { flex: 1, fontSize: 15, color: colors.textPrimary, marginRight: spacing.sm },
  itemQty: { fontSize: 15, fontWeight: "700", color: colors.purple },
  receiveBtn: {
    flexDirection: "row",
    marginTop: spacing.md,
    backgroundColor: colors.green,
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  receiveText: { color: colors.inverse, fontWeight: "700", fontSize: 15, marginLeft: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: spacing.md },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
});
