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

export default function ScreenHeader({ title, subtitle, color = colors.gold, testID }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row} testID={testID}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        testID="header-back-button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={25} color={colors.gold} />
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
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1.2,
    borderColor: colors.borderStrong,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: "900", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
});
