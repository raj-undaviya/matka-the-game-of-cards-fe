import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Svg, { Defs, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

export default function WalletCard({
  id = 'deposit',
  gradientColors = ['#56c449', '#14721c'],
  label = 'TOTAL DEPOSIT',
  amount = '₹ 0',
  buttonText = 'DEPOSIT',
  onButtonPress,
  iconName = 'wallet',
  iconType = 'material',
  iconColor = '#fff',
  badgeBgColor = 'rgba(255, 255, 255, 0.18)',
  badgeBorderColor = 'rgba(255, 255, 255, 0.35)',
}) {
  const [dimensions, setDimensions] = useState(null);

  const handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  };

  const renderWaves = () => {
    if (!dimensions) return null;

    const { width: w, height: h } = dimensions;
    const bottomY = h + 10; // extend slightly below edges to crop cleanly

    // Dynamic wave coordinates calculated as percentages of measured size
    const wave1 = `M ${-0.1 * w} ${0.57 * h} Q ${0.25 * w} ${0.48 * h} ${0.56 * w} ${0.61 * h} T ${1.1 * w} ${0.55 * h} L ${1.1 * w} ${bottomY} L ${-0.1 * w} ${bottomY} Z`;
    const wave2 = `M ${-0.1 * w} ${0.66 * h} Q ${0.22 * w} ${0.59 * h} ${0.53 * w} ${0.73 * h} T ${1.1 * w} ${0.66 * h} L ${1.1 * w} ${bottomY} L ${-0.1 * w} ${bottomY} Z`;
    const wave3 = `M ${-0.1 * w} ${0.75 * h} Q ${0.19 * w} ${0.68 * h} ${0.5 * w} ${0.84 * h} T ${1.1 * w} ${0.77 * h} L ${1.1 * w} ${bottomY} L ${-0.1 * w} ${bottomY} Z`;

    return (
      <Svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFillObject}
      >
        <Path d={wave1} fill="rgba(255, 255, 255, 0.05)" />
        <Path d={wave2} fill="rgba(255, 255, 255, 0.06)" />
        <Path d={wave3} fill="rgba(255, 255, 255, 0.06)" />
      </Svg>
    );
  };

  return (
    <View style={styles.cardContainer} onLayout={handleLayout}>
      {/* Premium Linear Gradient Background (100% layout-stable on all devices) */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Proportional Wavy Overlay (rendered only after layout measurement) */}
      {renderWaves()}

      {/* Diamond Badge at Top-Center */}
      <View style={[styles.diamondBadge, { backgroundColor: badgeBgColor, borderColor: badgeBorderColor }]}>
        <View style={styles.diamondIconWrapper}>
          {iconType === 'material' ? (
            <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
          ) : (
            <FontAwesome name={iconName} size={16} color={iconColor} />
          )}
        </View>
      </View>

      {/* Content Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.cardLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.cardAmount}>{amount}</Text>
      </View>

      {/* Golden Action Button */}
      <TouchableOpacity
        style={styles.cardButton}
        onPress={onButtonPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#ffe17d', '#d67f00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.cardButtonText}>{buttonText.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 36,
    padding: 14,
    minHeight: 230,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  diamondBadge: {
    width: 36,
    height: 36,
    borderWidth: 1.2,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    zIndex: 2,
  },
  diamondIconWrapper: {
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    zIndex: 2,
    marginVertical: 4,
  },
  cardLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 15,
  },
  cardAmount: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  cardButton: {
    height: 46,
    width: '100%',
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  cardButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
