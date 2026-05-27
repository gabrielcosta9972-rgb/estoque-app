import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Check, ClipboardList, Info, PackageOpen } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";

type OrderItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit?: "kg" | "un";
  quantity_text?: string;
};

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

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [kgValues, setKgValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const normalizeKgText = (value: string) => {
    const clean = value.replace(",", ".").replace(/[^0-9.]/g, "");
    const parts = clean.split(".");

    if (parts.length <= 2) return clean;

    return `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const kgTextToNumber = (value: string, fallback: number) => {
    const normalized = normalizeKgText(value);

    if (!normalized.trim()) return fallback;

    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Order[]>("/orders", {
        params: { store, status: "em_via" },
      });

      const found = data.find((o) => o.id === orderId) || null;

      setOrder(found);
      setError(found ? null : "Pedido não encontrado ou já confirmado.");
      setNote(found?.adjustment_note || "");

      if (found) {
        const initialKgValues: Record<string, string> = {};

        found.items.forEach((item) => {
          initialKgValues[item.product_id] = item.quantity_text || String(item.quantity);
        });

        setKgValues(initialKgValues);
        setCheckedItems({});
      }
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

  const toggleChecked = (productId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const changeKg = (productId: string, value: string) => {
    setKgValues((prev) => ({
      ...prev,
      [productId]: normalizeKgText(value),
    }));
  };

  const separatedCount = useMemo(() => {
    if (!order) return 0;
    return order.items.filter((item) => checkedItems[item.product_id]).length;
  }, [checkedItems, order]);

  const totalCount = order?.items.length || 0;
  const progress = totalCount > 0 ? Math.round((separatedCount / totalCount) * 100) : 0;

  const getFinalItems = () => {
    if (!order) return [];

    return order.items.map((item) => {
      const typedValue = kgValues[item.product_id] ?? String(item.quantity);

      return {
        ...item,
        quantity: kgTextToNumber(typedValue, item.quantity),
        quantity_text: typedValue,
        unit: item.unit ?? "un",
      };
    });
  };

  const receiveOrder = async () => {
    if (!order) return;

    setActing(true);

    try {
      const body = {
        items: getFinalItems(),
        adjustment_note: note.trim() || undefined,
      };

      await api.post(`/orders/${order.id}/receive`, body);

      Alert.alert("Pronto", "Pedido confirmado e enviado para entregue.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Erro", formatApiError(e));
    } finally {
      setActing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Pedido Detalhe"
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
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.iconBox}>
                  <ClipboardList size={30} color={colors.gold} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>Pedido</Text>
                  <Text style={styles.storeName}>{order.store_label || order.store}</Text>
                  <Text style={styles.meta}>
                    {order.created_by_name ? `${order.created_by_name} · ` : ""}
                    {formatDate(order.created_at)}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>EM VIA</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Info size={20} color={colors.gold} />
                <Text style={styles.infoText}>
                  Altere as quantidades e marque os itens que já foram separados.
                </Text>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "left" }]}>
                  PRODUTO
                </Text>
                <Text style={styles.tableHeaderText}>ORIGINAL</Text>
                <Text style={styles.tableHeaderText}>QTD.</Text>
              </View>

              {order.items.map((item) => {
                const checked = !!checkedItems[item.product_id];

                return (
                  <View
                    key={item.product_id}
                    style={[styles.productRow, checked && styles.productRowChecked]}
                  >
                    <TouchableOpacity
                      style={[styles.checkBox, checked && styles.checkBoxOn]}
                      onPress={() => toggleChecked(item.product_id)}
                      activeOpacity={0.85}
                    >
                      {checked ? <Check size={18} color={colors.inverse} /> : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.productInfo}
                      onPress={() => toggleChecked(item.product_id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.productMeta}>
                        {checked ? "Produto separado" : "Toque para marcar como separado"}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.originalQty}>x{item.quantity}{item.unit ?? "un"}</Text>

                    <View style={styles.kgInputWrap}>
                      <TextInput
                        value={kgValues[item.product_id] ?? ""}
                        onChangeText={(v) => changeKg(item.product_id, v)}
                        keyboardType="decimal-pad"
                        maxLength={7}
                        style={styles.kgInput}
                        placeholder="0"
                        placeholderTextColor={colors.textDisabled}
                      />
                      <Text style={styles.kgText}>{item.unit ?? "un"}</Text>
                    </View>
                  </View>
                );
              })}

              <View style={styles.progressBox}>
                <View style={styles.progressIcon}>
                  <PackageOpen size={24} color={colors.gold} />
                </View>

                <View style={{ width: 92 }}>
                  <Text style={styles.progressLabel}>Separados</Text>
                  <Text style={styles.progressValue}>
                    {separatedCount} / {totalCount}
                  </Text>
                  <Text style={styles.progressSub}>Itens separados</Text>
                </View>

                <View style={styles.progressLineBg}>
                  <View style={[styles.progressLineFill, { width: `${progress}%` }]} />
                </View>

                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>

              <TextInput
                value={note}
                onChangeText={setNote}
                style={styles.noteInput}
                placeholder="Observações (opcional)"
                placeholderTextColor={colors.textDisabled}
                multiline
              />

              <Text style={styles.securityText}>
                O pedido será enviado ao solicitante com as alterações.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, acting && { opacity: 0.65 }]}
              onPress={receiveOrder}
              disabled={acting}
              activeOpacity={0.85}
            >
              {acting ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <>
                  <Check size={20} color={colors.inverse} />
                  <Text style={styles.confirmText}>CONFIRMAR PEDIDO</Text>
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
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: colors.goldBorder,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  orderTitle: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "900",
  },
  storeName: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.goldSoft,
  },
  statusText: {
    color: colors.gold,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    width: 78,
    textAlign: "center",
  },
  productRow: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productRowChecked: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.goldSoft,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textDisabled,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  productMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  originalQty: {
    width: 38,
    color: colors.gold,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  kgInputWrap: {
    width: 82,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  kgInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    padding: 0,
    textAlign: "center",
  },
  kgText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 4,
  },
  progressBox: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  progressValue: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "900",
  },
  progressSub: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  progressLineBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressLineFill: {
    height: "100%",
    backgroundColor: colors.gold,
    borderRadius: 999,
  },
  progressPercent: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: "900",
    width: 42,
    textAlign: "right",
  },
  noteInput: {
    marginTop: spacing.md,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    backgroundColor: colors.inputBg,
    padding: spacing.md,
    textAlignVertical: "top",
    fontSize: 14,
  },
  securityText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.md,
  },
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
  },
  confirmBtn: {
    height: 58,
    borderRadius: radius.button,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  confirmText: {
    color: colors.inverse,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 17,
    textAlign: "center",
    marginTop: 10,
  },
});
