import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShoppingCart, PackageOpen, LogOut, User, Phone } from "lucide-react-native";
import { useAuth } from "../src/auth";
import { colors, spacing, radius } from "../src/theme";

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const formatPhone = (p: string) => {
    if (p.length === 11) return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
    if (p.length === 10) return `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
    return p;
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe} testID="home-screen">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Olá,</Text>
            <Text style={styles.name} testID="home-username">
              {user.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} testID="logout-btn">
            <LogOut size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <User size={18} color={colors.blue} />
            <Text style={styles.userText}>{user.name}</Text>
          </View>
          <View style={styles.userRow}>
            <Phone size={18} color={colors.blue} />
            <Text style={styles.userText}>{formatPhone(user.phone)}</Text>
          </View>
        </View>

        <Text style={styles.section}>Ação principal</Text>

        <TouchableOpacity
          testID="action-pedir"
          style={[styles.actionCard, { borderColor: colors.blueBorder, backgroundColor: colors.blueSoft }]}
          onPress={() => router.push("/pedir/lojas")}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.blue }]}>
            <ShoppingCart size={28} color={colors.inverse} />
          </View>
          <View style={styles.actionTexts}>
            <Text style={[styles.actionTitle, { color: colors.blue }]}>PEDIR</Text>
            <Text style={styles.actionDesc}>Solicitar produtos a uma loja</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID="action-receber"
          style={[styles.actionCard, { borderColor: colors.greenBorder, backgroundColor: colors.greenSoft }]}
          onPress={() => router.push("/receber/lojas")}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.green }]}>
            <PackageOpen size={28} color={colors.inverse} />
          </View>
          <View style={styles.actionTexts}>
            <Text style={[styles.actionTitle, { color: colors.green }]}>RECEBER</Text>
            <Text style={styles.actionDesc}>Confirmar entrega de pedidos</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  hello: { fontSize: 14, color: colors.textSecondary },
  name: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  userText: { marginLeft: spacing.sm, fontSize: 15, color: colors.textPrimary, fontWeight: "500" },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 110,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTexts: { marginLeft: spacing.md, flex: 1 },
  actionTitle: { fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  actionDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
});
