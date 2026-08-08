import { Pressable, StyleSheet } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useColors, useIsDark, setThemeOverride } from "../lib/theme";

export function ThemeToggle() {
  const isDark = useIsDark();
  const colors = useColors();

  const toggle = () => {
    setThemeOverride(isDark ? "light" : "dark");
  };

  return (
    <Pressable
      onPress={toggle}
      style={[styles.button, { borderColor: colors.borderInput }]}
      accessibilityRole="button"
      accessibilityLabel="Toggle theme"
    >
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        {isDark ? (
          <Path
            d="M14 9.3A6 6 0 1 1 6.7 2a4.6 4.6 0 0 0 7.3 7.3Z"
            fill={colors.textMuted}
          />
        ) : (
          <G stroke={colors.textMuted} strokeWidth={1.3} strokeLinecap="round">
            <Circle cx={8} cy={8} r={3.4} fill={colors.textMuted} stroke="none" />
            <Path d="M8 1.2v1.6M8 13.2v1.6M14.8 8h-1.6M2.8 8H1.2M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1M12.7 12.7l-1.1-1.1M4.4 4.4 3.3 3.3" />
          </G>
        )}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
