import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function Nav() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Logo size={26} />
        <Text style={styles.wordmark}>Misuq</Text>
      </View>
      <View style={styles.actions}>
        <ThemeToggle />
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Start free</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    wordmark: {
      fontFamily: fonts.display,
      fontSize: 17,
      color: colors.deepInk,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    cta: {
      backgroundColor: colors.indigo,
      borderRadius: 10,
      paddingVertical: 9,
      paddingHorizontal: 16,
    },
    ctaText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13.5,
      color: colors.onIndigo,
    },
  });
}
