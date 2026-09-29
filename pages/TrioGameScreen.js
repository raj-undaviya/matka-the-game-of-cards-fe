import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 70) / 5;

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const suits = ['♠', '♥', '♦', '♣'];

export default function TrioGameScreen({ route, navigation }) {
  const {
    roundId: initialRoundId,
    poolId,
    entryFee = 200,
    winningPrize = 10000,
    reward = '32x',
    roundNumber = 1,
    totalRounds = 10,
    slotNumber = 1,
    isDailyMega = false,
    country = 'India',
    poolName,
    poolType,
  } = route.params || {};

  const [currentRound, setCurrentRound] = useState(Number(roundNumber) || 1);
  const [activeRoundId, setActiveRoundId] = useState(initialRoundId);
  const [selectedCards, setSelectedCards] = useState([]);
  const [timer, setTimer] = useState(10);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch wallet balance
    apiService.getWalletBalance()
      .then(res => setBalance(res.balance || res.current_balance || 0))
      .catch(err => console.log('Error fetching balance:', err));

    // Resolve active round from pool leaderboard
    if (poolId) {
      apiService.getPoolLeaderboard(poolId)
        .then(res => {
          if (res && res.active_round_id) {
            setActiveRoundId(res.active_round_id);
          }
        })
        .catch(err => console.log('Error fetching pool round:', err));
    }
  }, [poolId, initialRoundId, currentRound]);

  // 10-second countdown timer per round
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle 10-second timer timeout
  useEffect(() => {
    if (timer === 0) {
      if (selectedCards.length === 3) {
        handlePlaceBet();
      } else {
        if (currentRound < Number(totalRounds)) {
          const nextR = currentRound + 1;
          setCurrentRound(nextR);
          setSelectedCards([]);
          setTimer(10);
        } else {
          Alert.alert(
            'Tournament Completed',
            'All rounds completed! Returning to Contest Pools.',
            [{ text: 'OK', onPress: () => navigation.navigate('ContestPool', { gameVariation: 'V3', gameId: 2 }) }]
          );
        }
      }
    }
  }, [timer]);

  const handleCardSelect = (card) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, card]);
    } else {
      Alert.alert('Limit Reached', 'You can only select 3 cards for a Trio combination');
    }
  };

  const isTriple = selectedCards.length === 3 && new Set(selectedCards).size === 1;
  const currentMultiplier = isTriple ? '50x' : (reward || '32x');

  const handlePlaceBet = async () => {
    if (loading) return;
    if (selectedCards.length !== 3) {
      Alert.alert('Invalid Selection', 'Please select exactly 3 cards for Trio');
      return;
    }

    setLoading(true);
    try {
      let rId = activeRoundId;
      if ((!rId || rId === poolId) && poolId) {
        try {
          const lb = await apiService.getPoolLeaderboard(poolId);
          if (lb && lb.active_round_id) {
            rId = lb.active_round_id;
            setActiveRoundId(rId);
          }
        } catch (e) {
          console.log('Error fetching leaderboard for round:', e);
        }
      }

      if (!rId) {
        const rounds = await apiService.getRounds('V3');
        if (rounds && rounds.length > 0) {
          rId = rounds[0].id;
          setActiveRoundId(rId);
        }
      }

      const targetId = rId || poolId;
      if (!targetId) {
        Alert.alert('Error', 'Unable to find an active round. Please try again.');
        setLoading(false);
        return;
      }

      const numList = selectedCards.map(c => c === 'A' ? 1 : Number(c));
      const res = await apiService.placeBet(targetId, numList, entryFee);
      const finalRoundId = res?.round || res?.round_id || rId || targetId;

      navigation.replace('LiveGame', {
        gameType: 'trio',
        roundId: finalRoundId,
        poolId,
        selectedCards: selectedCards.join(','),
        entryFee,
        reward: currentMultiplier,
        winningPrize,
        roundNumber: currentRound,
        totalRounds,
        slotNumber,
        isDailyMega,
        country,
        poolName,
        poolType,
      });
    } catch (err) {
      const errMsg = err.message || 'Failed to place bet';
      if (errMsg.includes('already placed')) {
        navigation.replace('LiveGame', {
          gameType: 'trio',
          roundId: activeRoundId || poolId,
          poolId,
          selectedCards: selectedCards.join(','),
          entryFee,
          reward: currentMultiplier,
          winningPrize,
          roundNumber: currentRound,
          totalRounds,
          slotNumber,
          isDailyMega,
          country,
          poolName,
          poolType,
        });
      } else {
        Alert.alert('Bet Notice', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#5a0000', '#120000']} style={styles.mainBackground}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* ── Top Header Row (Matches ContestPoolScreen) ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.chainDecorContainer}>
            <Svg height="30" width="140" viewBox="0 0 140 30" style={styles.chainSvg}>
              <Path
                d="M 5,0 Q 70,28 135,0"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <Circle cx="70" cy="14" r="2.5" fill="#D4AF37" />
            </Svg>
            <View style={styles.chainStar}>
              <FontAwesome name="star" size={13} color="#FFF5C2" />
            </View>
          </View>

          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.85}
          >
            <Text style={styles.walletBtnText}>₹{Number(balance).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Main Frame (Gold Border Frame matching ContestPool) ── */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['rgba(78, 8, 8, 0.85)', 'rgba(30, 3, 3, 0.95)']}
            style={styles.cardContent}
          >
            {/* Centered Contest Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLine} />
              <Text style={styles.cardTitle}>
                {isDailyMega ? '⭐ DAILY MEGA POOL' : (poolName || 'TRIO GAME')}
              </Text>
              <View style={styles.headerLine} />
            </View>

            {/* Badges Bar */}
            <View style={styles.badgesRow}>
              <View style={[styles.slotBadge, isDailyMega && styles.megaSlotBadge]}>
                <Text style={styles.slotBadgeText}>
                  {isDailyMega ? 'MEGA POOL 1' : (poolName?.includes('Hourly') ? poolName.toUpperCase() : `POOL 3 • SLOT #${slotNumber}`)}
                </Text>
              </View>

              <View style={styles.roundBadge}>
                <Text style={styles.roundBadgeText}>
                  {`ROUND ${currentRound}/${totalRounds}`}
                </Text>
              </View>

              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={13} color={timer < 4 ? '#FF4444' : '#FFD700'} />
                <Text style={[styles.timerBadgeText, timer < 4 && styles.timerUrgent]}>
                  {timer}s Left
                </Text>
              </View>
            </View>

            {/* Sub-instruction */}
            <View style={styles.instructionWrap}>
              <Text style={styles.instructionTitle}>Pick 3 Cards (Trio Set)</Text>
              <Text style={styles.instructionSub}>
                {selectedCards.length === 0 && 'Select 3 cards to form your trio combination'}
                {selectedCards.length === 1 && `Card 1: [ ${selectedCards[0]} ] — Pick 2 more`}
                {selectedCards.length === 2 && `Cards: [ ${selectedCards[0]}, ${selectedCards[1]} ] — Pick 1 more`}
                {selectedCards.length === 3 && `Selected Trio: [ ${selectedCards.join(', ')} ]`}
              </Text>
            </View>

            {/* Cards Grid */}
            <View style={styles.cardsContainer}>
              {cards.map((card, index) => {
                const isSelected = selectedCards.includes(card);
                const selectIndex = selectedCards.indexOf(card);
                const suit = suits[index % 4];
                const isRed = suit === '♥' || suit === '♦';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cardItem,
                      isSelected && styles.cardItemSelected,
                      { width: CARD_SIZE, height: CARD_SIZE * 1.38 },
                    ]}
                    onPress={() => handleCardSelect(card)}
                    activeOpacity={0.75}
                  >
                    <LinearGradient
                      colors={isSelected ? ['#FFD700', '#FFA000', '#D4AF37'] : ['#ffffff', '#f4f4f4']}
                      style={styles.cardInner}
                    >
                      {isSelected && (
                        <View style={styles.selectionIndexBadge}>
                          <Text style={styles.selectionIndexText}>{selectIndex + 1}</Text>
                        </View>
                      )}
                      <Text style={[
                        styles.cardValue,
                        { color: isSelected ? '#000000' : (isRed ? '#C20005' : '#111827') }
                      ]}>
                        {card}
                      </Text>
                      <Text style={[
                        styles.cardSuit,
                        { color: isSelected ? '#000000' : (isRed ? '#C20005' : '#111827') }
                      ]}>
                        {suit}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pool Prize Strip */}
            <View style={styles.prizeStrip}>
              <View style={styles.prizeStripItem}>
                <Text style={styles.prizeStripLabel}>ENTRY FEE</Text>
                <Text style={styles.prizeStripValue}>₹{entryFee}</Text>
              </View>
              <View style={styles.prizeStripDivider} />
              <View style={styles.prizeStripItem}>
                <Text style={styles.prizeStripLabel}>WIN PRIZE</Text>
                <Text style={[styles.prizeStripValue, { color: '#FFD700' }]}>
                  ₹{Number(winningPrize).toLocaleString()}
                </Text>
              </View>
              <View style={styles.prizeStripDivider} />
              <View style={styles.prizeStripItem}>
                <Text style={styles.prizeStripLabel}>MULTIPLIER</Text>
                <Text style={[styles.prizeStripValue, { color: '#00C853' }]}>{currentMultiplier}</Text>
              </View>
            </View>

            {/* Bottom Place Bet CTA Button */}
            <TouchableOpacity
              style={[styles.placeBetBtn, selectedCards.length !== 3 && styles.disabledBtn]}
              onPress={handlePlaceBet}
              disabled={selectedCards.length !== 3 || loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={selectedCards.length === 3 ? ['#00C853', '#007E33'] : ['#475569', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.placeBetGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.placeBetBtnText}>
                    {selectedCards.length === 3
                      ? `PLACE BET · ${selectedCards.join(' & ')} (ROUND ${currentRound}/${totalRounds})`
                      : `SELECT ${3 - selectedCards.length} MORE CARD${3 - selectedCards.length > 1 ? 'S' : ''}`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
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
    top: 8,
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
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
  megaSlotBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  slotBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  roundBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  roundBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
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
  instructionWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  instructionSub: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
  cardItem: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  cardItemSelected: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  cardInner: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectionIndexBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#000',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndexText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  cardSuit: {
    fontSize: 16,
    marginTop: -2,
  },
  prizeStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginVertical: 6,
  },
  prizeStripItem: {
    alignItems: 'center',
  },
  prizeStripLabel: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  prizeStripValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  prizeStripDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#333333',
  },
  placeBetBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledBtn: {
    shadowOpacity: 0,
    elevation: 0,
  },
  placeBetGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBetBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});