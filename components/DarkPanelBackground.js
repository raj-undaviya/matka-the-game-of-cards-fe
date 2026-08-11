import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DarkPanelBackground({ children, style, ...props }) {
  return (
    <View style={[styles.panelOuter, style]} {...props}>
      {/* Main diagonal gradient: medium-dark grey (#4a4a4a) to near-black (#0a0a0a) */}
      <LinearGradient
        colors={['#4a4a4a', '#0a0a0a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.panelGradient}
      >
        {/* Subtle noise/texture/opacity variation layer */}
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(0,0,0,0.25)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Subtle diagonal glow/highlight near top-right corner */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.3, y: 0.7 }}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Circular highlight overlay for extra soft radial glow effect near top-right */}
        <View style={styles.topRightGlowHighlight} pointerEvents="none" />

        {/* Soft inner shadow/glow simulating border inset */}
        <View style={styles.innerBorderGlow} pointerEvents="none" />
        <View style={styles.innerShadowOverlay} pointerEvents="none" />

        {/* Content */}
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  panelOuter: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d9a13a', // Thin gold/amber border
    overflow: 'hidden',
    // Premium dark panel shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  panelGradient: {
    borderRadius: 14.5,
    position: 'relative',
    overflow: 'hidden',
  },
  topRightGlowHighlight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  innerBorderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14.5,
  },
  innerShadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14.5,
  },
});
