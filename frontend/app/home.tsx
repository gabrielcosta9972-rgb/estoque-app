import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShoppingCart, PackageOpen, LogOut, User, Phone, ClipboardList, CheckCircle2, ChevronRight } from "lucide-react-native";
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>OLÁ,</Text>
            <Text style={styles.name} testID="home-username">
              {user.name} 👋
            </Text>
            <Text style={styles.welcome}>Bem-vindo de volta!</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} testID="logout-btn">
            <LogOut size={28} color={colors.gold} />
          </TouchableOpacity>
        </View>

        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.smallIcon}><User size={18} color={colors.gold} /></View>
            <Text style={styles.userText}>{user.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.userRow}>
            <View style={styles.smallIcon}><Phone size={18} color={colors.gold} /></View>
            <Text style={styles.userText}>{formatPhone(user.phone)}</Text>
          </View>
        </View>

        <Text style={styles.section}>AÇÃO PRINCIPAL</Text>

        {user.role === "pedir" ? (
          <TouchableOpacity
            testID="action-pedir"
            style={[styles.actionCard, styles.actionCardActive]}
            onPress={() => router.push("/pedir/lojas")}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <ShoppingCart size={34} color={colors.gold} />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>PEDIR</Text>
              <Text style={styles.actionDesc}>Solicitar produtos a uma loja</Text>
            </View>
            <View style={styles.chevronCircle}><ChevronRight size={30} color={colors.gold} /></View>
          </TouchableOpacity>
        ) : null}

        {user.role === "receber" ? (
          <TouchableOpacity
            testID="action-receber"
            style={[styles.actionCard, styles.actionCardActive]}
            onPress={() => router.push("/receber/lojas")}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <PackageOpen size={34} color={colors.gold} />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>RECEBER</Text>
              <Text style={styles.actionDesc}>Confirmar entrega de pedidos</Text>
            </View>
            <View style={styles.chevronCircle}><ChevronRight size={30} color={colors.gold} /></View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          testID="action-historico"
          style={styles.actionCard}
          onPress={() => router.push("/historico")}
          activeOpacity={0.85}
        >
          <View style={styles.iconBox}>
            <ClipboardList size={32} color={colors.gold} />
          </View>
          <View style={styles.actionTexts}>
            <Text style={styles.actionTitle}>HISTÓRICO</Text>
            <Text style={styles.actionDesc}>
              {user.role === "receber" ? "Pedidos recebidos" : "Seus pedidos anteriores"}
            </Text>
          </View>
          <View style={styles.chevronCircle}><ChevronRight size={30} color={colors.gold} /></View>
        </TouchableOpacity>

        {user.role === "pedir" ? (
          <TouchableOpacity
            testID="action-entregue"
            style={styles.actionCard}
            onPress={() => router.push("/receber/entregue")}
            activeOpacity={0.85}
          >
            <View style={styles.iconBox}>
              <CheckCircle2 size={32} color={colors.gold} />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>ENTREGUE</Text>
              <Text style={styles.actionDesc}>Pedidos entregues</Text>
            </View>
            <View style={styles.chevronCircle}><ChevronRight size={30} color={colors.gold} /></View>
          </TouchableOpacity>
        ) : null}

        <Image source={require("../assets/images/marikota-logo-clean.png")} style={styles.logoFooter} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  hello: { fontSize: 15, color: colors.gold, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "900", color: colors.textPrimary, letterSpacing: -0.7, marginTop: 2 },
  welcome: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.card,
    borderWidth: 1.4,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  userCard: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
  },
  userRow: { flexDirection: "row", alignItems: "center", minHeight: 42 },
  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginRight: 14,
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 5, marginLeft: 48 },
  userText: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "800",
    color: colors.gold,
    letterSpacing: 0.2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.1,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 16,
    minHeight: 112,
    backgroundColor: colors.card,
  },
  actionCardActive: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  iconBox: {
    width: 78,
    height: 78,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(255,196,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.24,
    shadowRadius: 12,
  },
  actionTexts: { marginLeft: 16, flex: 1 },
  actionTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 0.4, color: colors.textPrimary },
  actionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  chevronCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFooter: {
    width: 235,
    height: 105,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 14,
  },
});
