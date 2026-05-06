import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors, spacing } from "../src/theme";

type Props = {
  title: string;
  subtitle?: string;
  color?: string;
  testID?: string;
};

export default function ScreenHeader({ title, subtitle, color = colors.textPrimary, testID }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row} testID={testID}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        testID="header-back-button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[styles.title, { color }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
