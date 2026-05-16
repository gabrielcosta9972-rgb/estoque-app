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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { useAuth } from "../src/auth";
import { colors, spacing, radius } from "../src/theme";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!phone.trim() || !password) {
      setError("Preencha telefone e senha");
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
      router.replace("/home");
    } catch (e: any) {
      setError(e.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="login-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <Image
              source={require("../assets/images/marikota-logo-clean.png")}
              style={styles.logoImage}
            />
            <Text style={styles.title}>Estoque</Text>
            <Text style={styles.subtitle}>Marikota</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              testID="login-phone-input"
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
              testID="login-password-input"
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <Text style={styles.error} testID="login-error">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="login-submit-button"
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <Text style={styles.primaryBtnText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <Link href="/register" asChild>
              <TouchableOpacity style={styles.secondaryBtn} testID="goto-register">
                <Text style={styles.secondaryBtnText}>Criar nova conta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.md, justifyContent: "center" },
  logoBox: { alignItems: "center", marginBottom: spacing.xl },
  logoImage: {
    width: 285,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 2,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.gold, marginTop: 4, fontWeight: "600" },
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
  secondaryBtn: {
    marginTop: spacing.sm,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: colors.blue, fontWeight: "600", fontSize: 14 },
});
