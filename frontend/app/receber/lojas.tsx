import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import ScreenHeader from "../../src/ScreenHeader";
import { api, formatApiError } from "../../src/api";
import { colors, spacing, radius } from "../../src/theme";

type StoreItem = { id: string; label: string };

export default function ReceberLojas() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: storesData }, { data: pending }] = await Promise.all([
          api.get<StoreItem[]>("/stores"),
          api.get<any[]>("/orders", { params: { status: "em_via" } }),
        ]);
        setStores(storesData);
        const c: Record<string, number> = {};
        pending.forEach((o) => {
          c[o.store] = (c[o.store] || 0) + 1;
          if (["Castelo", "Mesc", "Delivery",].includes(o.store)) {
            c["Baeta"] = (c["Baeta"] || 0) + 1;
          }
        });
        setCounts(c);
      } catch (e) {
        setError(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe} testID="receber-lojas-screen">
      <ScreenHeader title="Receber" subtitle="Selecione a loja para confirmar entregas" color={colors.green} />
      {loading ? (
        <ActivityIndicator color={colors.green} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0 }}
          renderItem={({ item }) => {
            const pending = counts[item.id] || 0;
            return (
              <TouchableOpacity
                testID={`receber-store-${item.id}`}
                onPress={() => router.push({ pathname: "/receber/pedidos", params: { store: item.id, label: item.label } })}
                activeOpacity={0.8}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.sub}>
                    {pending > 0 ? `${pending} pedido(s) em via` : "Sem pendências"}
                  </Text>
                </View>
                {pending > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pending}</Text>
                  </View>
                ) : null}
                <ChevronRight size={20} color={colors.textDisabled} />
              </TouchableOpacity>
            );
          }}
        />
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
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  label: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  badgeText: { color: colors.inverse, fontWeight: "700", fontSize: 13 },
  error: { color: colors.danger, padding: spacing.md, textAlign: "center" },
});
