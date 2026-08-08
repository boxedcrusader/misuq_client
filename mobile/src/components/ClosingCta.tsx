import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function ClosingCta() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={styles.panel}>
        <Text style={styles.h2}>You built it. Let&apos;s get it noticed.</Text>
        <Text style={styles.body}>
          Start with one update. See a draft in minutes. Nothing goes out
          until you say so.
        </Text>
        <Button title="Draft my first update" variant="primary" style={styles.button} />
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      paddingBottom: 52,
    },
    panel: {
      backgroundColor: colors.ctaPanel,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      borderRadius: 24,
      paddingVertical: 44,
      paddingHorizontal: 24,
      alignItems: "center",
      gap: 16,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: 26,
      lineHeight: 31,
      letterSpacing: -0.4,
      color: colors.deepInk,
      textAlign: "center",
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15.5,
      lineHeight: 24,
      color: colors.textMuted,
      textAlign: "center",
    },
    button: {
      marginTop: 6,
    },
  });
}
