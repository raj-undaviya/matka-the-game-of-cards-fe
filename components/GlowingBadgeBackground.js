import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const GLOW_SIZE = 120;
const BADGE_SIZE = 120;

export default function GlowingBadgeBackground({ children }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for radial glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 0.95],
  });

  return (
    <View style={styles.container}>
      {/* Radial Glow Layer */}
      <Animated.View
        style={[
          styles.glowWrapper,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        <Svg height={GLOW_SIZE} width={GLOW_SIZE}>
          <Defs>
            <RadialGradient
              id="radialGlow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#ffcc66" stopOpacity="1.0" />
              <Stop offset="30%" stopColor="#e0841aff" stopOpacity="0.65" />
              <Stop offset="70%" stopColor="#e16c12ff" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#ffcc66" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#radialGlow)" />
        </Svg>
      </Animated.View>

      {/* Centered Children Logo Badge */}
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrapper: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  childrenContainer: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
});
