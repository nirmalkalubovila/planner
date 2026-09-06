import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

/** Drop-in stand-in for expo-linear-gradient, built on react-native-svg.
 *
 * react-native-svg is already a dependency (circular-progress draws with
 * it), and it already ships an RNSVGLinearGradient view manager — so
 * pulling in expo-linear-gradient would have added a second native module,
 * and a second reason every dev build has to be regenerated, for something
 * the app can already draw. Same props as expo's version (`colors`,
 * `start`, `end`, `locations`, `style`, children) so call sites read the
 * same either way.
 */

interface LinearGradientProps {
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: readonly number[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** SVG stops take color and alpha separately, so `rgba()` inputs have to be
 * split apart rather than passed through as one string. */
function parseColor(input: string): { color: string; opacity: number } {
  if (input === 'transparent') return { color: '#000000', opacity: 0 };

  const match = input.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i
  );
  if (match) {
    const [, r, g, b, a] = match;
    return { color: `rgb(${r}, ${g}, ${b})`, opacity: a === undefined ? 1 : Number(a) };
  }

  return { color: input, opacity: 1 };
}

export function LinearGradient({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  locations,
  style,
  children,
}: LinearGradientProps) {
  // Gradient ids share a namespace per SVG document; useId keeps two
  // gradients on screen from resolving to each other's fill.
  const gradientId = `grad-${useId().replace(/:/g, '')}`;

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgLinearGradient id={gradientId} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            {colors.map((raw, i) => {
              const { color, opacity } = parseColor(raw);
              const offset = locations?.[i] ?? i / Math.max(1, colors.length - 1);
              return (
                <Stop key={i} offset={offset} stopColor={color} stopOpacity={opacity} />
              );
            })}
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      {children}
    </View>
  );
}
