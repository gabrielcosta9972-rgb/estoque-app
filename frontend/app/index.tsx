import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";
import { colors } from "../src/theme";
import { registerForPushNotificationsAsync } from "../utils/notifications";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/home");
    else router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    async function registerForPushNotifications() {
      const token = await registerForPushNotificationsAsync();
      console.log("TOKEN DO CELULAR:", token);
      }
      registerForPushNotifications();

      
    },
  []);

  return (
    <View style={styles.container} testID="boot-screen">
      <ActivityIndicator size="large" color={colors.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
});
