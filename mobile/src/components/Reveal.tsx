import { useState } from "react";
import { Animated, LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";

type RevealProps = {
  children: React.ReactNode;
  scrollY: Animated.Value;
  viewportHeight: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
};

export function Reveal({ children, scrollY, viewportHeight, style, distance = 32 }: RevealProps) {
  const [sectionY, setSectionY] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    if (sectionY === null) {
      setSectionY(e.nativeEvent.layout.y);
    }
  };

  if (sectionY === null) {
    return (
      <Animated.View style={[style, { opacity: 0 }]} onLayout={handleLayout}>
        {children}
      </Animated.View>
    );
  }

  const revealStart = sectionY - viewportHeight * 0.85;
  const revealEnd = sectionY - viewportHeight * 0.6;

  const opacity = scrollY.interpolate({
    inputRange: [revealStart, revealEnd],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const translateY = scrollY.interpolate({
    inputRange: [revealStart, revealEnd],
    outputRange: [distance, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
}
