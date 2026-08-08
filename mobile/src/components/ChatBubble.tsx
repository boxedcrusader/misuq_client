import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, type ColorPalette } from "../lib/tokens";
import { useColors } from "../lib/theme";

type Props = {
  text: string;
  align: "left" | "right";
};

export function ChatBubble({ text, align }: Props) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isRight = align === "right";

  return (
    <View
      style={[
        styles.bubble,
        isRight ? styles.right : styles.left,
        { alignSelf: isRight ? "flex-end" : "flex-start" },
      ]}
    >
      <Text style={[styles.text, isRight ? styles.textRight : styles.textLeft]}>
        {text}
      </Text>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    bubble: {
      maxWidth: "85%",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    left: {
      backgroundColor: colors.contextFill,
      borderWidth: 1,
      borderColor: colors.contextBorder,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      borderBottomRightRadius: 14,
      borderBottomLeftRadius: 4,
    },
    right: {
      backgroundColor: colors.indigo,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 4,
    },
    text: {
      fontFamily: fonts.body,
      fontSize: 14.5,
      lineHeight: 21,
    },
    textLeft: {
      color: colors.deepInk,
    },
    textRight: {
      color: colors.onDarkHeading,
    },
  });
}
