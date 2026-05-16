import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import ScreenHeader from "../../src/ScreenHeader";
import { colors, spacing, radius } from "../../src/theme";
import { useCart } from "../../src/cart";

const lojas = [
  { id: "pizzaria", label: "Pizzaria" },
  { id: "copa", label: "Copa" },
  { id: "bar", label: "Bar" },
];

export default function Baeta() {
  const { setStore } = useCart();

  const onSelect = (loja: { id: string; label: string }) => {
    // Agora o backend aceita Pizzaria/Copa/Bar.
    // Então o pedido chega no recebimento com o nome correto.
    setStore(loja.id, loja.label);
    router.push("/pedir/categorias");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Baeta" subtitle="Escolha o setor para pedir" color={colors.gold} />

      <View style={styles.list}>
        {lojas.map((loja) => (
          <TouchableOpacity
            key={loja.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onSelect(loja)}
          >
            <Text style={styles.label}>{loja.label}</Text>
            <ChevronRight size={26} color={colors.gold} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 20, fontWeight: "900", color: colors.textPrimary },
});
