import Svg, { Circle } from "react-native-svg";
import { useColors } from "../lib/theme";

export function Logo({ size = 30 }: { size?: number }) {
  const colors = useColors();

  return (
    <Svg width={size} height={size} viewBox="0 0 132 132" fill="none">
      <Circle cx={24} cy={96} r={10} fill={colors.logoSmall} />
      <Circle cx={66} cy={80} r={16} fill={colors.logoMid} />
      <Circle cx={112} cy={54} r={22} fill={colors.logoLarge} />
    </Svg>
  );
}
