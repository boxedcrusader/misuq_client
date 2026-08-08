import { useMemo, useRef } from "react";
import { Animated, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import { Nav } from "../components/Nav";
import { Hero } from "../components/Hero";
import { Problem } from "../components/Problem";
import { HowItWorks } from "../components/HowItWorks";
import { ReportBack } from "../components/ReportBack";
import { Pricing } from "../components/Pricing";
import { ClosingCta } from "../components/ClosingCta";
import { Footer } from "../components/Footer";
import { Reveal } from "../components/Reveal";
import { spacing, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

export function LandingScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { height: viewportHeight } = useWindowDimensions();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight} style={styles.paddedX}>
          <Nav />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight} style={styles.paddedX}>
          <Hero />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight}>
          <Problem />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight}>
          <HowItWorks />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight}>
          <ReportBack />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight}>
          <Pricing />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight}>
          <ClosingCta />
        </Reveal>
        <Reveal scrollY={scrollY} viewportHeight={viewportHeight}>
          <Footer />
        </Reveal>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.ground,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.ground,
    },
    content: {
      paddingBottom: 12,
    },
    paddedX: {
      paddingHorizontal: spacing.pageX,
    },
  });
}
