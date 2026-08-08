import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function Problem() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.statement}>
        AI made building cheap. So everyone&apos;s building. The scarce
        thing now is anyone noticing.
      </Text>
      <View style={styles.body}>
        <Text style={styles.paragraph}>
          You ship constantly. Marketing is the part that slips — you
          don&apos;t have a schedule, a strategy, or the hours to figure out
          what lands.
        </Text>
        <Text style={styles.paragraph}>
          Generic AI copy makes it worse. People can tell, and they punish
          it. What you need isn&apos;t more posts — it&apos;s knowing which
          ones are worth sending before you spend your audience on them.
        </Text>
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    section: {
      backgroundColor: colors.panel,
      paddingVertical: 48,
      paddingHorizontal: 20,
      gap: 28,
    },
    statement: {
      fontFamily: fonts.displayRegular,
      fontSize: 26,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: colors.onDarkHeading,
    },
    body: {
      gap: 16,
    },
    paragraph: {
      fontFamily: fonts.body,
      fontSize: 15.5,
      lineHeight: 25,
      color: colors.onDarkBody,
    },
  });
}
