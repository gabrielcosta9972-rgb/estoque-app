import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { ArrowLeft, ShoppingCart, PackageOpen, Check } from "lucide-react-native";
import { useAuth } from "../src/auth";
import { colors, spacing, radius } from "../src/theme";

type Role = "pedir" | "receber";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!role) {
      setError("Escolha um tipo de conta");
      return;
    }
    if (!name.trim() || !phone.trim() || !password) {
      setError("Preencha todos os campos");
      return;
    }
    if (password.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(name, phone, password, role);
      router.replace("/home");
    } catch (e: any) {
      setError(e.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="register-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.back} testID="register-back">
              <ArrowLeft size={22} color={colors.textPrimary} />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
          </Link>

          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Escolha o tipo de conta para começar</Text>

          <View style={styles.roleRow}>
            <TouchableOpacity
              testID="role-pedir"
              style={[styles.roleCard, role === "pedir" && styles.roleCardOn]}
              activeOpacity={0.85}
              onPress={() => setRole("pedir")}
            >
              <View style={[styles.roleIcon, role === "pedir" && { backgroundColor: colors.blue }]}>
                <ShoppingCart size={22} color={role === "pedir" ? colors.inverse : colors.blue} />
              </View>
              <Text style={[styles.roleTitle, role === "pedir" && { color: colors.blue }]}>Vou PEDIR</Text>
              <Text style={styles.roleDesc}>Solicito produtos</Text>
              {role === "pedir" ? (
                <View style={styles.roleCheck}>
                  <Check size={14} color={colors.inverse} />
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              testID="role-receber"
              style={[styles.roleCard, role === "receber" && styles.roleCardOnGreen]}
              activeOpacity={0.85}
              onPress={() => setRole("receber")}
            >
              <View style={[styles.roleIcon, role === "receber" && { backgroundColor: colors.green }]}>
                <PackageOpen size={22} color={role === "receber" ? colors.inverse : colors.green} />
              </View>
              <Text style={[styles.roleTitle, role === "receber" && { color: colors.green }]}>Vou RECEBER</Text>
              <Text style={styles.roleDesc}>Confirmo entregas</Text>
              {role === "receber" ? (
                <View style={[styles.roleCheck, { backgroundColor: colors.green }]}>
                  <Check size={14} color={colors.inverse} />
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              testID="register-name-input"
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={colors.textDisabled}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              testID="register-phone-input"
              style={styles.input}
              placeholder="(11) 99999-9999"
              placeholderTextColor={colors.textDisabled}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
            <Text style={styles.label}>Senha</Text>
            <TextInput
              testID="register-password-input"
              style={styles.input}
              placeholder="Mínimo 4 caracteres"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <Text style={styles.error} testID="register-error">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="register-submit-button"
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <Text style={styles.primaryBtnText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.md },
  back: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.md },
  backText: { color: colors.textPrimary, fontSize: 16, marginLeft: 6, fontWeight: "500" },
  title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  roleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  roleCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.card,
    padding: spacing.md,
    minHeight: 130,
    alignItems: "flex-start",
  },
  roleCardOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  roleCardOnGreen: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  roleTitle: { fontSize: 14, fontWeight: "800", color: colors.textPrimary, letterSpacing: 0.5 },
  roleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    fontSize: 16,
    color: colors.textPrimary,
  },
  error: { color: colors.danger, marginTop: spacing.sm, fontSize: 14 },
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.blue,
    minHeight: 56,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.inverse, fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },
});
