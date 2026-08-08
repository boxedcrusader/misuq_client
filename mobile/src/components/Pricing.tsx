import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

const tiers = [
  {
    name: "Starter",
    price: "$19",
    description: "One email list, one wide channel. Unlimited drafts and staging.",
    cta: "Choose Starter",
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    description: "Three channels, plus voice and tone memory across your stories.",
    cta: "Choose Growth",
    featured: true,
    badge: "Popular",
  },
  {
    name: "Scale",
    price: "$99",
    description: "Unlimited channels and priority access to cross-founder insights.",
    cta: "Choose Scale",
    featured: false,
  },
];

export function Pricing() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>PRICING</Text>
      <Text style={styles.h2}>Flat tiers. No per-draft metering.</Text>
      <Text style={styles.lead}>
        The loop is meant to be slow and considered, so you&apos;re never
        charged to think.
      </Text>

      <View style={styles.grid}>
        {tiers.map((tier) => (
          <View
            key={tier.name}
            style={[styles.card, tier.featured && styles.cardFeatured]}
          >
            <View style={styles.headRow}>
              <Text style={[styles.name, tier.featured && styles.nameFeatured]}>
                {tier.name}
              </Text>
              {tier.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tier.badge}</Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.price, tier.featured && styles.priceFeatured]}>
                {tier.price}
              </Text>
              <Text
                style={[styles.perMo, tier.featured && styles.perMoFeatured]}
              >
                /mo
              </Text>
            </View>
            <Text
              style={[styles.description, tier.featured && styles.descriptionFeatured]}
            >
              {tier.description}
            </Text>
            <Pressable
              style={[styles.button, tier.featured && styles.buttonFeatured]}
            >
              <Text
                style={[
                  styles.buttonText,
                  tier.featured && styles.buttonTextFeatured,
                ]}
              >
                {tier.cta}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      paddingBottom: 52,
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
      gap: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      borderRadius: 18,
      padding: 24,
      gap: 16,
    },
    cardFeatured: {
      backgroundColor: colors.indigo,
      borderColor: colors.indigo,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    name: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: colors.deepInk,
    },
    nameFeatured: {
      color: "#FFFFFF",
    },
    badge: {
      backgroundColor: colors.onDarkHeading,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    badgeText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 10.5,
      letterSpacing: 0.8,
      color: colors.indigo,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
    },
    price: {
      fontFamily: fonts.display,
      fontSize: 34,
      letterSpacing: -0.4,
      color: colors.deepInk,
    },
    priceFeatured: {
      color: "#FFFFFF",
    },
    perMo: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted3,
    },
    perMoFeatured: {
      color: "#C9C3FF",
    },
    description: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textMuted2,
    },
    descriptionFeatured: {
      color: "#DCD8FB",
    },
    button: {
      borderWidth: 1,
      borderColor: colors.borderInput,
      borderRadius: 11,
      paddingVertical: 12,
      alignItems: "center",
    },
    buttonFeatured: {
      backgroundColor: colors.onIndigo,
      borderColor: colors.onIndigo,
    },
    buttonText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14.5,
      color: colors.deepInk,
    },
    buttonTextFeatured: {
      color: colors.indigo,
    },
  });
}
