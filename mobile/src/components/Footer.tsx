import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Logo } from "./Logo";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function Footer() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.footer}>
      <View style={styles.brand}>
        <Logo size={22} />
        <Text style={styles.wordmark}>Misuq</Text>
      </View>
      <Text style={styles.tagline}>
        The marketing copilot for indie SaaS founders.
      </Text>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.borderHairline,
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: "center",
      gap: 10,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    wordmark: {
      fontFamily: fonts.display,
      fontSize: 14.5,
      color: colors.deepInk,
    },
    tagline: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted3,
      textAlign: "center",
    },
  });
}
