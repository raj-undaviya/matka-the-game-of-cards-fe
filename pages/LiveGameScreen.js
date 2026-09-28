// pages/LiveGameScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

const MOCK_PLAYERS = [
  { id: 1, name: 'Rahul', angle: 270, bet: 100, emoji: '👦' },
  { id: 2, name: 'Priya', angle: 330, bet: 150, emoji: '👩' },
  { id: 3, name: 'Suresh', angle: 30, bet: 200, emoji: '👨' },
  { id: 4, name: 'Meena', angle: 90, bet: 100, emoji: '👱' },
  { id: 5, name: 'Arjun', angle: 150, bet: 175, emoji: '🧑' },
  { id: 6, name: 'You', angle: 210, bet: 0, isYou: true, emoji: '😎' },
];

const SUITS = ['♠', '♥', '♦', '♣'];

export default function LiveGameScreen({ route, navigation }) {
  const params = route.params || {};
  const {
    gameType = 'pair',
    roundId,
    poolId,
    selectedCard,
    selectedCards,
    selectedDigit,
    entryFee = 150,
    reward = '20x',
    winningPrize = 3000,
    roundNumber = 1,
    totalRounds = 10,
    slotNumber = 1,
    poolName = 'Tournament Pool',
  } = params;

  const userPick = selectedCard || selectedCards || selectedDigit || 'A';
  const userPickArray = selectedCards ? selectedCards.split(',') : [userPick];

  // Phases: 'countdown' (5s Reveal Countdown) -> 'revealing' (5s Card Hold Duration)
  const [phase, setPhase] = useState('countdown');
  const [countdown, setCountdown] = useState(5);
  const [holdCountdown, setHoldCountdown] = useState(5);
  const [drawnCardsList, setDrawnCardsList] = useState([]);
  const [drawnRawNumbers, setDrawnRawNumbers] = useState([]);
  const [didUserWin, setDidUserWin] = useState(false);
  const [balance, setBalance] = useState(0);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const hasNavigatedRef = useRef(false);

  // Initial balance & animation
  useEffect(() => {
    apiService.getWalletBalance()
      .then(res => setBalance(res.balance || res.current_balance || 0))
      .catch(err => console.log('Error balance:', err));

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  // Fetch / prepare winning drawn cards
  useEffect(() => {
    let isMounted = true;

    const prepareCards = (drawnRaw) => {
      const mappedCards = drawnRaw.map((n, idx) => {
        const cardVal = n === 1 ? 'A' : String(n);
        const suit = SUITS[idx % 4] || '♠';
        const isRed = suit === '♥' || suit === '♦';
        return { val: cardVal, num: n, suit, isRed, full: `${cardVal} ${suit}` };
      });

      if (isMounted) {
        setDrawnCardsList(mappedCards);
        setDrawnRawNumbers(drawnRaw);

        // Compute local win
        let didWin = false;
        if (gameType === 'single') {
          didWin = userPick === mappedCards[0]?.val;
        } else if (gameType === 'pair') {
          const pickedArr = selectedCards ? selectedCards.split(',') : [];
          const pickedNums = pickedArr.map(c => c === 'A' ? 1 : Number(c));
          if (drawnRaw.length >= 2 && pickedNums.length >= 2) {
            didWin = pickedNums[0] === drawnRaw[0] && pickedNums[1] === drawnRaw[1];
          } else {
            didWin = pickedArr[0] === mappedCards[0]?.val && pickedArr[1] === mappedCards[1]?.val;
          }
        } else if (gameType === 'trio') {
          const pickedArr = selectedCards ? selectedCards.split(',') : [];
          const pickedNums = pickedArr.map(c => c === 'A' ? 1 : Number(c));
          const allSame = (drawnRaw[0] === drawnRaw[1] && drawnRaw[1] === drawnRaw[2]);
          if (allSame) {
            didWin = pickedNums.every(n => n === drawnRaw[0]);
          } else {
            didWin = pickedNums.some(n => drawnRaw.includes(n));
          }
        } else if (gameType === 'lastDigitSum') {
          const sum = drawnRaw.reduce((a, b) => a + b, 0);
          const lastDigit = sum % 10;
          didWin = Number(selectedDigit) === lastDigit;
        } else if (gameType === 'jackpot') {
          didWin = userPick === mappedCards[0]?.val;
        }
        setDidUserWin(didWin);
      }
    };

    if (roundId) {
      apiService.getRoundDetail(roundId)
        .then((detail) => {
          if (!isMounted) return;
          const raw = Array.isArray(detail?.drawn_numbers) && detail.drawn_numbers.length > 0
            ? detail.drawn_numbers
            : (gameType === 'pair' ? [1, 7] : [7]);
          prepareCards(raw);
        })
        .catch(() => {
          if (!isMounted) return;
          prepareCards(gameType === 'pair' ? [1, 7] : [7]);
        });
    } else {
      prepareCards(gameType === 'pair' ? [1, 7] : [7]);
    }

    return () => {
      isMounted = false;
    };
  }, [roundId, gameType, userPick, selectedCards, selectedDigit]);

  // Stage 1: 5-Second Reveal Countdown (5s -> 0s)
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown <= 0) {
      setPhase('revealing');
      setHoldCountdown(5);
      Animated.spring(flipAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown, flipAnim]);

  // Stage 2: 5-Second Hold Duration (5s -> 0s) then Atomic Navigate to WinningScreen
  useEffect(() => {
    if (phase !== 'revealing') return;

    if (holdCountdown <= 0) {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        const currentCards = drawnCardsList.length > 0
          ? drawnCardsList
          : (gameType === 'pair' ? [
              { val: 'A', num: 1, suit: '♠', isRed: false, full: 'A ♠' },
              { val: '7', num: 7, suit: '♥', isRed: true, full: '7 ♥' }
            ] : [
              { val: '7', num: 7, suit: '♥', isRed: true, full: '7 ♥' }
            ]);
        const currentRaw = drawnRawNumbers.length > 0
          ? drawnRawNumbers
          : (gameType === 'pair' ? [1, 7] : [7]);

        navigation.replace('Winning', {
          gameType,
          reward,
          entryFee,
          winningPrize,
          drawnCards: currentCards.map(c => c.full),
          drawnNumbers: currentRaw,
          drawnCard: currentCards.map(c => c.full).join(' & '),
          userCards: userPickArray,
          userPick,
          won: String(didUserWin),
          roundId,
          poolId,
          roundNumber,
          totalRounds,
          slotNumber,
          poolName,
          accumulatedPoints: params.accumulatedPoints || 0,
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      setHoldCountdown((h) => h - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, holdCountdown, drawnCardsList, drawnRawNumbers, didUserWin, navigation, gameType, reward, entryFee, winningPrize, userPickArray, userPick, roundId, poolId, roundNumber, totalRounds, slotNumber, poolName, params]);

  const circleRadius = 125;
  const centerX = width / 2;
  const arenaCenter = 195;

  const isPairMode = gameType === 'pair' || userPickArray.length === 2;

  const statusText =
    phase === 'countdown'
      ? `REVEALING CARDS IN ${countdown}s…`
      : `⭐ WINNING CARDS REVEALED · HOLDING ${holdCountdown}s`;

  return (
    <LinearGradient colors={['#5a0000', '#120000']} style={styles.mainBackground}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* ── Top Header Row ── */}
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

        {/* ── Sub Header Status Bar ── */}
        <View style={styles.subHeaderBar}>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{poolName.toUpperCase()}</Text>
          </View>
          <View style={styles.roundBadge}>
            <Text style={styles.roundBadgeText}>ROUND {roundNumber} / {totalRounds}</Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={13} color="#FFD700" />
            <Text style={styles.timerBadgeText}>
              {phase === 'countdown' ? `${countdown}s` : `${holdCountdown}s`}
            </Text>
          </View>
        </View>

        <Text style={styles.statusText}>{statusText}</Text>

        {/* ── Casino Circular Arena ── */}
        <View style={[styles.arena, { height: arenaCenter * 2 }]}>
          {MOCK_PLAYERS.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const px = centerX + circleRadius * Math.cos(rad) - 28;
            const py = arenaCenter + circleRadius * Math.sin(rad) - 28;
            return (
              <View
                key={p.id}
                style={[
                  styles.playerAvatar,
                  p.isYou && styles.playerAvatarYou,
                  { position: 'absolute', left: px, top: py },
                ]}
              >
                <Text style={styles.avatarEmoji}>{p.emoji}</Text>
                {p.bet > 0 && (
                  <View style={styles.betBadge}>
                    <Text style={styles.betBadgeText}>₹{p.bet}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Center Card / Pair Cards Box */}
          <View style={[styles.centerCardsWrap, { top: arenaCenter - 65 }]}>
            {phase === 'revealing' && drawnCardsList.length >= 2 ? (
              // ── 2 REVEALED CARDS FOR PAIR SELECTION ──
              <View style={styles.pairCardsRow}>
                {drawnCardsList.slice(0, 2).map((c, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={['#ffffff', '#f4f4f4']}
                    style={[
                      styles.pairCardItem,
                      { borderColor: idx === 0 ? '#06B6D4' : '#FFD700' },
                    ]}
                  >
                    <View style={[
                      styles.cardTag,
                      { backgroundColor: idx === 0 ? '#0891b2' : '#b45309' }
                    ]}>
                      <Text style={styles.cardTagText}>{idx === 0 ? 'OPEN' : 'CLOSE'}</Text>
                    </View>
                    <Text style={[
                      styles.pairCardValue,
                      { color: c.isRed ? '#C20005' : '#0f172a' }
                    ]}>
                      {c.val}
                    </Text>
                    <Text style={[
                      styles.pairCardSuit,
                      { color: c.isRed ? '#C20005' : '#0f172a' }
                    ]}>
                      {c.suit}
                    </Text>
                  </LinearGradient>
                ))}
              </View>
            ) : phase === 'revealing' && drawnCardsList.length === 1 ? (
              // ── 1 REVEALED CARD FOR SINGLE CARD ──
              <LinearGradient colors={['#ffffff', '#f4f4f4']} style={styles.singleCardItem}>
                <Text style={[
                  styles.pairCardValue,
                  { color: drawnCardsList[0]?.isRed ? '#C20005' : '#0f172a' }
                ]}>
                  {drawnCardsList[0]?.val}
                </Text>
                <Text style={[
                  styles.pairCardSuit,
                  { color: drawnCardsList[0]?.isRed ? '#C20005' : '#0f172a' }
                ]}>
                  {drawnCardsList[0]?.suit}
                </Text>
              </LinearGradient>
            ) : (
              // ── UNREVEALED CASINO CARD BACK ──
              <LinearGradient colors={['#1c1917', '#0c0a09']} style={styles.unrevealedCard}>
                {phase === 'countdown' && (
                  <Text style={styles.countdownTitle}>REVEALING{'\n'}IN</Text>
                )}
                <Text style={styles.countdownNumber}>
                  {phase === 'countdown' ? `${countdown}` : '?'}
                </Text>
                {isPairMode && (
                  <Text style={styles.pairCardModeText}>2 CARDS PAIR</Text>
                )}
              </LinearGradient>
            )}
          </View>
        </View>

        {/* ── Bottom Bet Strip ── */}
        <View style={styles.betStripContainer}>
          <View style={styles.betStripItem}>
            <Text style={styles.betStripLabel}>YOUR PICK</Text>
            <Text style={styles.betStripValue}>{String(userPick).replace(',', ' & ')}</Text>
          </View>
          <View style={styles.betStripDivider} />
          <View style={styles.betStripItem}>
            <Text style={styles.betStripLabel}>BET ENTRY</Text>
            <Text style={[styles.betStripValue, { color: '#FFD700' }]}>₹{entryFee}</Text>
          </View>
          <View style={styles.betStripDivider} />
          <View style={styles.betStripItem}>
            <Text style={styles.betStripLabel}>REWARD</Text>
            <Text style={[styles.betStripValue, { color: '#00C853' }]}>{reward}</Text>
          </View>
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
    justifyContent: 'space-between',
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
  subHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
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
  statusText: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  arena: {
    width: '100%',
    position: 'relative',
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 10, 10, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  playerAvatarYou: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  betBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  betBadgeText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 9,
  },
  centerCardsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairCardsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairCardItem: {
    width: 78,
    height: 118,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  singleCardItem: {
    width: 90,
    height: 135,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    elevation: 8,
  },
  unrevealedCard: {
    width: 100,
    height: 140,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    elevation: 8,
  },
  cardTag: {
    position: 'absolute',
    top: 3,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  pairCardValue: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 6,
  },
  pairCardSuit: {
    fontSize: 22,
    marginTop: -2,
  },
  countdownTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  countdownNumber: {
    color: '#FFD700',
    fontSize: 44,
    fontWeight: '900',
  },
  pairCardModeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  betStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  betStripItem: {
    alignItems: 'center',
  },
  betStripLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  betStripValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  betStripDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#333333',
  },
});