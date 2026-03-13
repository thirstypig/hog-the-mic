import Svg, { Path, Circle, Rect, type SvgProps } from "react-native-svg";

/**
 * KTV Singer logo — a stylized microphone with sound waves.
 * Single-color vector, defaults to white (#fafafa).
 */
export function KtvLogo({
  size = 64,
  color = "#fafafa",
  ...props
}: { size?: number; color?: string } & Omit<SvgProps, "width" | "height">) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      {...props}
    >
      {/* Mic head (rounded rectangle) */}
      <Rect x="22" y="6" width="20" height="28" rx="10" stroke={color} strokeWidth="3" />

      {/* Mic grille lines */}
      <Path d="M27 14h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M27 18h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M27 22h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M27 26h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

      {/* Mic cradle arc */}
      <Path
        d="M16 28c0 8.837 7.163 16 16 16s16-7.163 16-16"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Mic stand */}
      <Path d="M32 44v10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Path d="M24 54h16" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* Sound wave left */}
      <Path
        d="M10 18c-2 4-2 8 0 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M5 14c-3.5 7-3.5 14 0 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Sound wave right */}
      <Path
        d="M54 18c2 4 2 8 0 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M59 14c3.5 7 3.5 14 0 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
