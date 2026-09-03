// pages/ContestPoolScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  const { gameId, gameVariation, gameName, gameReward } = route.params || {};

  const [pools, setPools] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);
  
  const isFocused = useIsFocused();
  const timerRef = useRef(null);

  const gameIdToVariation = {
    1: 'V1', // Single Card
    5: 'V2', // Pair Selection
    2: 'V3', // Trio Game
    3: 'V4', // Last Digit Sum
    4: 'V5', // Lucky Draw
  };
  const variation = gameVariation || gameIdToVariation[gameId] || 'V1';

  // Medal images
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

  const fetchPoolsData = async () => {
    try {
      const balRes = await apiService.getWalletBalance().catch(() => ({ balance: 0 }));
      setBalance(balRes.balance || 0);

      const data = await apiService.getRounds(variation);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((round, idx) => {
          const multiplier = round.reward_info?.multiplier || 10;
          const entry = round.entry_fee || 100;
          const winPrize = round.win_prize || entry * multiplier;
          const remSecs = typeof round.remaining_seconds === 'number' ? round.remaining_seconds : 60;

          return {
            id: round.id,
            poolId: round.pool_id || round.pool,
            slotNumber: round.slot_number || 1,
            name: round.pool_name || `${gameName || 'Contest'} - Slot #${round.slot_number || 1}`,
            entryFee: entry,
            winningPrize: winPrize,
            maxSlots: round.max_slots || 100,
            filledSlots: round.slots_filled || 0,
            remainingSeconds: remSecs,
            rewardMultiplier: `${multiplier}x`,
            medal: getMedalImage(idx),
          };
        });

        setPools(mapped);
        if (mapped[0]?.remainingSeconds) {
          setSecondsLeft(Math.max(1, mapped[0].remainingSeconds));
        }
      }
    } catch (err) {
      console.log('Error fetching contest pools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setIsLoading(true);
      fetchPoolsData();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [variation, isFocused]);

  // Reverse 1-minute countdown timer (Dream11 style)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer reached 0! Refresh to get newly spawned upper slot pool
          fetchPoolsData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [variation]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleJoinPool = async (pool) => {
    console.log('Joining pool:', pool.name, 'Slot:', pool.slotNumber);
    
    const screenParams = { 
      roundId: pool.id, 
      entryFee: pool.entryFee, 
      winningPrize: pool.winningPrize,
      reward: pool.rewardMultiplier,
      slotNumber: pool.slotNumber,
    };

    if (pool.poolId) {
      try {
        await apiService.joinPool(pool.poolId);
      } catch (err) {
        const errorMsg = err.message || '';
        if (!errorMsg.includes('already joined')) {
          Alert.alert('Contest Notice', errorMsg || 'Unable to join pool');
          return;
        }
      }
    }

    if (variation === 'V1' || gameId === 1) {
      navigation.navigate('SingleCard', screenParams);
    } else if (variation === 'V2' || gameId === 5) {
      navigation.navigate('PairSelection', screenParams);
    } else if (variation === 'V3' || gameId === 2) {
      navigation.navigate('TrioGame', screenParams);
    } else if (variation === 'V4' || gameId === 3) {
      navigation.navigate('LastDigitSum', screenParams);
    } else if (variation === 'V5' || gameId === 4) {
      navigation.navigate('LuckyDraw', screenParams);
    } else {
      navigation.navigate('SingleCard', screenParams);
    }
  };

  const renderPoolRow = ({ item, index }) => {
    const isHighlighted = index === 0;
    const fillPercent = Math.min(100, Math.round((item.filledSlots / Math.max(1, item.maxSlots)) * 100));

    return (
      <View style={[styles.poolCardContainer, isHighlighted && styles.cardHighlighted]}>
        {/* Top Header: Slot Tag & Live Expiration Countdown */}
        <View style={styles.cardTopRow}>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>SLOT #{item.slotNumber}</Text>
          </View>

          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={13} color={secondsLeft < 15 ? '#FF4444' : '#FFD700'} />
            <Text style={[styles.timerBadgeText, secondsLeft < 15 && styles.timerUrgent]}>
              {formatTimer(secondsLeft)} Left
            </Text>
          </View>
        </View>

        {/* Prize Pool & Entry Fee Row */}
        <View style={styles.mainInfoRow}>
          <View style={styles.prizeSection}>
            <Text style={styles.prizeLabel}>WIN PRIZE</Text>
            <Text style={styles.prizeValue}>₹{Number(item.winningPrize).toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleJoinPool(item)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00C853', '#007E33']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.entryFeeBtn}
            >
              <Text style={styles.entryFeeBtnText}>ENTRY ₹{item.entryFee}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Progress Bar for Spots */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${fillPercent}%` }]} />
          </View>
          <View style={styles.spotsRow}>
            <Text style={styles.spotsFilledText}>{item.filledSlots} joined</Text>
            <Text style={styles.spotsTotalText}>{item.maxSlots} spots total</Text>
          </View>
        </View>

        {/* Card Footer: Multiplier & Guaranteed tag */}
        <View style={styles.cardFooterRow}>
          <View style={styles.footerTag}>
            <FontAwesome name="trophy" size={11} color="#FFD700" />
            <Text style={styles.footerTagText}>Max Multiplier: {item.rewardMultiplier}</Text>
          </View>
          <Text style={styles.guaranteedText}>⚡ Auto-Next Slot</Text>
        </View>
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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

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

          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.walletBtnText}>₹{Number(balance).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Large Card Container */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['rgba(78, 8, 8, 0.75)', 'rgba(30, 3, 3, 0.95)']}
            style={styles.cardContent}
          >
            {/* Centered Contest Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLine} />
              <Text style={styles.cardTitle}>{gameName || 'CONTEST POOLS'}</Text>
              <View style={styles.headerLine} />
            </View>

            {/* List Content */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
            ) : pools.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Preparing next contest slot...</Text>
              </View>
            ) : (
              <FlatList
                data={pools}
                renderItem={renderPoolRow}
                keyExtractor={(item) => item.id.toString()}
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
    height: 30,
  },
  chainSvg: {
    position: 'absolute',
    top: 0,
  },
  chainStar: {
    position: 'absolute',
    top: 9,
  },
  walletBtn: {
    backgroundColor: '#EAA015',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF5C2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  walletBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerLine: {
    height: 1,
    width: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.6)',
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginHorizontal: 10,
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ── Dream11 Style Contest Card ──
  poolCardContainer: {
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 12,
    marginBottom: 12,
  },
  cardHighlighted: {
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444444',
  },
  slotBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  timerBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  timerUrgent: {
    color: '#FF4444',
  },
  mainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prizeSection: {
    flex: 1,
  },
  prizeLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  prizeValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  entryFeeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  entryFeeBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF9900',
    borderRadius: 3,
  },
  spotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spotsFilledText: {
    color: '#FFA800',
    fontSize: 10,
    fontWeight: '700',
  },
  spotsTotalText: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  footerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerTagText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: '600',
  },
  guaranteedText: {
    color: '#00C853',
    fontSize: 10,
    fontWeight: '800',
  },
});
