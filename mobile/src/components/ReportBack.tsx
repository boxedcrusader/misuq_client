import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatBubble } from "./ChatBubble";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function ReportBack() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>REPORT BACK</Text>
        <Text style={styles.h2}>
          It learns your voice from what actually landed.
        </Text>
        <Text style={styles.body}>
          No forms, no dashboards. Just tell the copilot how it went. Over
          time it remembers the angles and tone that work for your audience
          — and flags when the signal&apos;s too small to trust.
        </Text>

        <View style={styles.chat}>
          <ChatBubble align="left" text="How did the CSV update land?" />
          <ChatBubble
            align="right"
            text="Three replies, two signups. One said it was exactly what she needed."
          />
          <ChatBubble
            align="left"
            text="Small room, but a clear signal. Want to take this one to X?"
          />
          <View style={styles.confirmRow}>
            <View style={styles.checkTile}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.confirmText}>Graduated to a validated story</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      paddingBottom: 48,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      borderRadius: 24,
      padding: 24,
      gap: 18,
    },
    eyebrow: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11.5,
      letterSpacing: 1.2,
      color: colors.textMuted3,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 27,
      letterSpacing: -0.3,
      color: colors.deepInk,
      marginTop: -8,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 23,
      color: colors.textMuted,
      marginTop: -8,
    },
    chat: {
      gap: 10,
    },
    confirmRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 4,
    },
    checkTile: {
      width: 18,
      height: 18,
      borderRadius: 6,
      backgroundColor: colors.indigo,
      alignItems: "center",
      justifyContent: "center",
    },
    checkMark: {
      color: colors.onIndigo,
      fontSize: 11,
      fontWeight: "700",
    },
    confirmText: {
      fontFamily: fonts.displayMedium,
      fontSize: 13.5,
      color: colors.textMuted2,
    },
  });
}
