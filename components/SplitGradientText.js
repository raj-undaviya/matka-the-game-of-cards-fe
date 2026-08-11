import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplitGradientText({
  leftText = '₹5,4',
  rightText = '50',
  leftColors = ['#fce8a8', '#c98f2e'],
  rightColors = ['#fce8a8', '#c98f2e'],
  fontSize = 56,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {/* Left Segment: Gold Gradient */}
      <MaskedView
        maskElement={
          <Text style={[styles.textBase, { fontSize }]}>
            {leftText}
          </Text>
        }
      >
        <Text style={[styles.textBase, { fontSize, color: '#c98f2e' }]}>
          {leftText}
        </Text>
        <LinearGradient
          colors={leftColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MaskedView>

      {/* Right Segment: Silver/White Gradient */}
      <MaskedView
        maskElement={
          <Text style={[styles.textBase, { fontSize }]}>
            {rightText}
          </Text>
        }
      >
        <Text style={[styles.textBase, { fontSize, color: '#c98f2e' }]}>
          {rightText}
        </Text>
        <LinearGradient
          colors={rightColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: {
    fontWeight: '900',
    color: '#c98f2e',
    backgroundColor: 'transparent',
  },
});
