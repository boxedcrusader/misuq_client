import { useMemo } from "react";
import { Pressable, Text, StyleSheet, PressableProps } from "react-native";
import { fonts, radii, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

type Variant = "primary" | "secondary" | "onDark";

type Props = PressableProps & {
  title: string;
  variant?: Variant;
};

export function Button({ title, variant = "primary", style, ...rest }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "onDark" && styles.onDark,
        pressed && { opacity: 0.85 },
        typeof style === "function" ? undefined : style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" && styles.textPrimary,
          variant === "secondary" && styles.textSecondary,
          variant === "onDark" && styles.textOnDark,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    base: {
      borderRadius: radii.button,
      paddingVertical: 14,
      paddingHorizontal: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: colors.indigo,
    },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.borderInput,
    },
    onDark: {
      backgroundColor: colors.onIndigo,
    },
    text: {
      fontFamily: fonts.bodyMedium,
      fontSize: 16,
    },
    textPrimary: {
      color: colors.onIndigo,
    },
    textSecondary: {
      color: colors.deepInk,
    },
    textOnDark: {
      color: colors.indigo,
    },
  });
}
