import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";
import { fonts, radii, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function Hero() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>FOR INDIE SAAS FOUNDERS</Text>
      <Text style={styles.h1}>Shipping got easy. Getting noticed didn&apos;t.</Text>
      <Text style={styles.lead}>
        Misuq is a marketing copilot that drafts your build-in-public
        updates, tests them on your own small audience first, and only
        takes the winners wider. You approve everything. Nothing posts on
        its own.
      </Text>
      <View style={styles.buttons}>
        <Button title="Draft my first update" variant="primary" />
        <Button title="See how it works" variant="secondary" />
      </View>
      <Text style={styles.finePrint}>
        No card required · No auto-posting, ever · Founder-paced
      </Text>

      {/* hero chat visual */}
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CAPTURE</Text>
        <Text style={styles.prompt}>What&apos;d you ship or learn?</Text>
        <View style={styles.inputBox}>
          <Text style={styles.inputText}>
            Shipped one-click CSV export. Two beta users had asked for it.
          </Text>
        </View>
        <View style={styles.chatWrap}>
          <View style={styles.agentBubble}>
            <Text style={styles.agentBubbleText}>
              Nice — that&apos;s a &ldquo;someone asked, I built it&rdquo;
              story. Draft ready for your list?
            </Text>
          </View>
          <View style={styles.chips}>
            <View style={styles.chipFilled}>
              <Text style={styles.chipFilledText}>Draft it</Text>
            </View>
            <View style={styles.chipOutline}>
              <Text style={styles.chipOutlineText}>Add context</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      paddingTop: 28,
      paddingBottom: 40,
      gap: 22,
    },
    badge: {
      alignSelf: "flex-start",
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      letterSpacing: 1,
      color: colors.textMuted3,
      borderWidth: 1,
      borderColor: colors.borderBadge,
      borderRadius: radii.pill,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    h1: {
      fontFamily: fonts.display,
      fontSize: 36,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: colors.deepInk,
    },
    lead: {
      fontFamily: fonts.body,
      fontSize: 16.5,
      lineHeight: 26,
      color: colors.textMuted,
    },
    buttons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    finePrint: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: colors.textMuted3,
    },
    card: {
      marginTop: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      borderRadius: 20,
      padding: 22,
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 3,
    },
    eyebrow: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      letterSpacing: 1,
      color: colors.textMuted3,
      marginBottom: 16,
    },
    prompt: {
      fontFamily: fonts.displayMedium,
      fontSize: 20,
      letterSpacing: -0.3,
      color: colors.deepInk,
      marginBottom: 16,
    },
    inputBox: {
      borderWidth: 1,
      borderColor: colors.indigo,
      borderRadius: radii.input,
      padding: 14,
      minHeight: 68,
    },
    inputText: {
      fontFamily: fonts.body,
      fontSize: 14.5,
      lineHeight: 21,
      color: colors.deepInk,
    },
    chatWrap: {
      marginTop: 18,
      gap: 12,
    },
    agentBubble: {
      alignSelf: "flex-start",
      maxWidth: "92%",
      backgroundColor: colors.contextFill,
      borderWidth: 1,
      borderColor: colors.contextBorder,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      borderBottomRightRadius: 14,
      borderBottomLeftRadius: 4,
      paddingVertical: 11,
      paddingHorizontal: 15,
    },
    agentBubbleText: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.deepInk,
    },
    chips: {
      flexDirection: "row",
      gap: 9,
    },
    chipFilled: {
      backgroundColor: colors.indigo,
      borderRadius: radii.pill,
      paddingVertical: 6,
      paddingHorizontal: 13,
    },
    chipFilledText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12.5,
      color: colors.onIndigo,
    },
    chipOutline: {
      borderWidth: 1,
      borderColor: colors.borderInput,
      borderRadius: radii.pill,
      paddingVertical: 6,
      paddingHorizontal: 13,
    },
    chipOutlineText: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: colors.textMuted2,
    },
  });
}
