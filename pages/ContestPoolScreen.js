// pages/ContestPoolScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiService } from '../services/apiService';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ContestPoolScreen({ route, navigation }) {
  const { gameId } = route.params || {};

  const [pools, setPools] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const isFocused = useIsFocused();

  const gameIdToVariation = {
    1: 'V1', // Single Card
    5: 'V2', // Pair Selection
    2: 'V3', // Trio Game
    3: 'V4', // Last Digit Sum
    4: 'V5', // Lucky Draw
  };
  const variation = gameIdToVariation[gameId] || 'V1';

  // Get medal image based on index to create visual diversity
  const getMedalImage = (index) => {
    const medals = [
      require('../assets/images/medal_single.png'),
      require('../assets/images/medal_pair.png'),
      require('../assets/images/medal_trio.png'),
      require('../assets/images/medal_sum.png'),
      require('../assets/images/medal_jackpot.png'),
    ];
    return medals[index % medals.length];
  };

  useEffect(() => {
    if (isFocused) {
      // Load user wallet balance
      apiService.getWalletBalance()
        .then(res => setBalance(res.balance))
        .catch(err => console.log('Error fetching balance:', err));
        
      // Fetch open rounds for selected variation
      setIsLoading(true);
      apiService.getRounds(variation)
        .then(data => {
          const generateBadgeCode = (name) => {
            if (!name) return 'ARENA';
            return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
          };

          const mapped = data.map((round, idx) => {
            const multiplier = round.reward_info?.multiplier || 10;
            
            return {
              id: round.id,
              poolId: round.pool_id || round.pool, // Map the pool ID dynamically
              name: round.pool_name || 'Standard Arena', // Dynamic name from backend
              badgeCode: generateBadgeCode(round.pool_name || 'ARENA'), // Dynamic badge code
              entryFee: round.entry_fee,
              winningPrize: round.entry_fee * multiplier,
              maxSlots: round.max_slots,
              filledSlots: round.slots_filled,
              medal: getMedalImage(idx),
            };
          });
          setPools(mapped);
        })
        .catch(err => console.log('Error fetching rounds:', err))
        .finally(() => setIsLoading(false));
    }
  }, [variation, isFocused]);

  const handleJoinPool = async (pool) => {
    console.log('Joining pool:', pool.name, 'for gameId:', gameId);
    
    const screenParams = { 
      roundId: pool.id, 
      entryFee: pool.entryFee, 
      winningPrize: pool.winningPrize,
      reward: `${pool.winningPrize / pool.entryFee}x`
    };

    if (pool.poolId) {
      try {
        await apiService.joinPool(pool.poolId);
      } catch (err) {
        const errorMsg = err.message || '';
        // If they already joined, it's safe to proceed to navigation
        if (!errorMsg.includes('already joined')) {
          Alert.alert('Join Pool Error', errorMsg || 'Failed to join pool');
          return;
        }
      }
    }

    if (gameId === 1) {
      navigation.navigate('SingleCard', screenParams);
    } else if (gameId === 5) {
      navigation.navigate('PairSelection', screenParams);
    } else if (gameId === 2) {
      navigation.navigate('TrioGame', screenParams);
    } else if (gameId === 3) {
      navigation.navigate('LastDigitSum', screenParams);
    } else if (gameId === 4) {
      navigation.navigate('LuckyDraw', screenParams);
    } else {
      navigation.navigate('SingleCard', screenParams);
    }
  };

  const renderPoolRow = ({ item, index }) => {
    const isHighlighted = index === 0;

    // Button colors/gradients mapping
    let gradientColors = ['#27B342', '#0C5418']; // default green
    let buttonText = 'JOIN';
    let textStyle = styles.joinBtnText;

    if (isHighlighted) {
      gradientColors = ['#EAA015', '#C57E0A']; // gold for highlighted button
      buttonText = `₹${item.entryFee}`;
      textStyle = styles.goldBtnText;
    } else if (index === 1) {
      gradientColors = ['#1F85DE', '#0A3B75']; // blue for join
    }

    return (
      <View style={[styles.poolRowContainer, isHighlighted && styles.rowHighlighted]}>
        {/* Left Side: Badge block */}
        <View style={styles.badgeContainer}>
          <Image source={item.medal} style={styles.medalImage} />
          <Text style={styles.badgeCodeText}>{item.badgeCode}</Text>
          {/* Gold star decoration in top-right of badge */}
          <View style={styles.badgeStar}>
            <FontAwesome name="star" size={8} color="#FFD700" />
          </View>
        </View>

        {/* Middle Section: Text & Coins/Slots info */}
        <View style={styles.infoContainer}>
          <Text style={styles.poolName}>{item.name}</Text>
          <View style={styles.subInfoRow}>
            <MaterialCommunityIcons name="circle-double" size={12} color="#FFA800" />
            <View style={styles.dotSeparator} />
            <Text style={styles.slotsText}>
              {item.filledSlots} / {item.maxSlots}
            </Text>
          </View>
        </View>

        {/* Right Section: Interactive Gradient Button */}
        <TouchableOpacity
          onPress={() => handleJoinPool(item)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.actionBtn}
          >
            <Text style={textStyle}>{buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#5a0000', '#120000']}
      style={styles.mainBackground}
    >
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* Header Decor & Controls */}
        <View style={styles.headerRow}>
          {/* Left: Back button in dark red circle */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Center: Hanging chain with gold star */}
          <View style={styles.chainDecorContainer}>
            <Svg height="30" width="160" viewBox="0 0 160 30" style={styles.chainSvg}>
              <Path
                d="M 5,0 Q 80,30 155,0"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <Circle cx="80" cy="15" r="2.5" fill="#D4AF37" />
            </Svg>
            <View style={styles.chainStar}>
              <FontAwesome name="star" size={13} color="#FFF5C2" />
            </View>
          </View>

          {/* Right: Gold wallet pill */}
          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.walletBtnText}>₹{Number(balance).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Large Card Container matching TransactionHistory */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['rgba(78, 8, 8, 0.75)', 'rgba(30, 3, 3, 0.95)']}
            style={styles.cardContent}
          >
            {/* Centered Pool Trial Header with side lines */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLine} />
              <Text style={styles.cardTitle}>Pool Trial</Text>
              <View style={styles.headerLine} />
            </View>

            {/* List Content */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
            ) : pools.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No active arenas available</Text>
              </View>
            ) : (
              <FlatList
                data={pools}
                renderItem={renderPoolRow}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainBackground: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    marginTop: 8,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6c0606',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  chainDecorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 40,
    width: 160,
  },
  chainSvg: {
    position: 'absolute',
    top: 0,
  },
  chainStar: {
    position: 'absolute',
    top: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  walletBtn: {
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAA015',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#FFF5C2',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  walletBtnText: {
    color: '#FFF5C2',
    fontSize: 13,
    fontWeight: '900',
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  headerLine: {
    flex: 1,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginHorizontal: 16,
    letterSpacing: 0.6,
    textTransform: 'capitalize',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  poolRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowHighlighted: {
    borderColor: '#EBB828',
    borderWidth: 1.5,
  },
  badgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  medalImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  badgeCodeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  badgeStar: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  poolName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dotSeparator: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  slotsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtn: {
    width: 82,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  goldBtnText: {
    color: '#5E0004',
    fontSize: 13,
    fontWeight: '900',
  },
});
