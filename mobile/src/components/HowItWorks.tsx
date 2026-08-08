import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

const steps = [
  {
    n: "01",
    title: "Capture",
    body: "Drop in a raw update — a shipped feature, a milestone, a lesson.",
  },
  {
    n: "02",
    title: "Draft",
    body: "The copilot shapes it into a first version for your preview list.",
  },
  {
    n: "03",
    title: "Send",
    body: "You send it to your own small audience. You're always in control.",
  },
  {
    n: "04",
    title: "Report back",
    body: "Tell it how it landed, in plain words — replies, signups, silence.",
  },
  {
    n: "05",
    title: "Graduate",
    body: "When you say it's ready, it's reshaped for X, LinkedIn, and beyond.",
    featured: true,
  },
];

export function HowItWorks() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>HOW IT WORKS</Text>
      <Text style={styles.h2}>
        Preview it in the small room before opening night.
      </Text>
      <Text style={styles.lead}>
        Every story gets tested on people who already know you, so you learn
        what works before it hits a cold, public audience.
      </Text>

      <View style={styles.grid}>
        {steps.map((step) => (
          <View
            key={step.n}
            style={[styles.card, step.featured && styles.cardFeatured]}
          >
            <Text style={[styles.n, step.featured && styles.nFeatured]}>
              {step.n}
            </Text>
            <Text style={[styles.title, step.featured && styles.titleFeatured]}>
              {step.title}
            </Text>
            <Text style={[styles.body, step.featured && styles.bodyFeatured]}>
              {step.body}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    section: {
      paddingVertical: 48,
      paddingHorizontal: 20,
      gap: 12,
    },
    eyebrow: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11.5,
      letterSpacing: 1.2,
      color: colors.textMuted3,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: 26,
      lineHeight: 30,
      letterSpacing: -0.4,
      color: colors.deepInk,
      marginTop: 4,
    },
    lead: {
      fontFamily: fonts.body,
      fontSize: 15.5,
      lineHeight: 24,
      color: colors.textMuted,
      marginBottom: 16,
    },
    grid: {
      gap: 14,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      borderRadius: 16,
      padding: 20,
      gap: 8,
    },
    cardFeatured: {
      backgroundColor: colors.indigo,
      borderColor: colors.indigo,
    },
    n: {
      fontFamily: fonts.display,
      fontSize: 13,
      color: colors.indigo,
    },
    nFeatured: {
      color: "#C9C3FF",
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 17,
      letterSpacing: -0.2,
      color: colors.deepInk,
    },
    titleFeatured: {
      color: "#FFFFFF",
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textMuted2,
    },
    bodyFeatured: {
      color: "#DCD8FB",
    },
  });
}
