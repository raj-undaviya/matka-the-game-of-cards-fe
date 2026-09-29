// pages/WinningScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

const getAvatar = (id, name = '') => {
  const avatars = ['👳', '🧔', '👧', '👩‍🦰', '🧑', '👨', '🤠', '😎'];
  const seed = (String(id || '') + name).length;
  return avatars[seed % avatars.length];
};

export default function WinningScreen({ route, navigation }) {
  const params = route.params || {};
  const {
    gameType = 'pair',
    drawnCards = ['A ♠', '7 ♥'],
    drawnNumbers = [1, 7],
    userCards = ['A', '7'],
    userPick = 'A,7',
    won = 'false',
    entryFee = 150,
    reward = '30x',
    winningPrize = 3000,
    roundId,
    poolId,
    roundNumber = 10,
    totalRounds = 10,
    slotNumber = 1,
    accumulatedPoints = 150,
    poolName = 'Tournament Pool',
  } = params;

  const isWin = won === 'true' || won === true;
  const isFinalRound = Number(roundNumber) >= Number(totalRounds);

  const [leaderboard, setLeaderboard] = useState([]);
  const [topWinners, setTopWinners] = useState([]);
  const [userRank, setUserRank] = useState(1);
  const [userPoints, setUserPoints] = useState(Number(accumulatedPoints) || 150);
  const [balance, setBalance] = useState(0);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [nextRoundCountdown, setNextRoundCountdown] = useState(10);
  const [finalCountdown, setFinalCountdown] = useState(60);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;

  const navigateBackToPools = useCallback(() => {
    let defaultVar = 'V2';
    let defaultId = 5;
    if (gameType === 'single') { defaultVar = 'V1'; defaultId = 1; }
    else if (gameType === 'pair') { defaultVar = 'V2'; defaultId = 5; }
    else if (gameType === 'trio') { defaultVar = 'V3'; defaultId = 2; }
    else if (gameType === 'lastDigitSum') { defaultVar = 'V4'; defaultId = 3; }
    else if (gameType === 'jackpot') { defaultVar = 'V5'; defaultId = 4; }

    navigation.navigate('ContestPool', {
      gameVariation: params.gameVariation || defaultVar,
      gameId: params.gameId || defaultId,
    });
  }, [navigation, params, gameType]);

  const getCardSelectionScreen = useCallback(() => {
    if (gameType === 'single' || params.gameVariation === 'V1') return 'SingleCard';
    if (gameType === 'pair' || params.gameVariation === 'V2') return 'PairSelection';
    if (gameType === 'trio' || params.gameVariation === 'V3') return 'TrioGame';
    if (gameType === 'lastDigitSum' || params.gameVariation === 'V4') return 'LastDigitSum';
    if (gameType === 'jackpot' || params.gameVariation === 'V5') return 'LuckyDraw';
    return 'PairSelection';
  }, [gameType, params]);

  const proceedToNextRound = useCallback(() => {
    if (isFinalRound) return;
    const nextRoundNumber = Number(roundNumber) + 1;
    const targetScreen = getCardSelectionScreen();
    navigation.replace(targetScreen, {
      ...params,
      poolId,
      roundId: poolId,
      roundNumber: nextRoundNumber,
      totalRounds: Number(totalRounds) || 10,
      entryFee,
      winningPrize,
      reward,
      slotNumber,
      isDailyMega: params.isDailyMega,
      country: params.country,
      poolName,
      accumulatedPoints: userPoints,
    });
  }, [isFinalRound, roundNumber, totalRounds, getCardSelectionScreen, navigation, params, poolId, entryFee, winningPrize, reward, slotNumber, poolName, userPoints]);

  // 10-Second Auto-advance for Intermediate Rounds (Rounds 1 to 9)
  useEffect(() => {
    if (isFinalRound) return;
    if (nextRoundCountdown <= 0) {
      proceedToNextRound();
      return;
    }
    const t = setTimeout(() => {
      setNextRoundCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [isFinalRound, nextRoundCountdown, proceedToNextRound]);

  // 1-Minute (60s) Leaderboard Review Auto-Redirect on Final Round (Round 10)
  useEffect(() => {
    if (!isFinalRound) return;
    if (finalCountdown <= 0) {
      navigateBackToPools();
      return;
    }
    const t = setTimeout(() => {
      setFinalCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [isFinalRound, finalCountdown, navigateBackToPools]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(trophyAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    apiService.getWalletBalance()
      .then(res => setBalance(res.balance || res.current_balance || 0))
      .catch(err => console.log('Error balance:', err));

    if (poolId) {
      apiService.getPoolLeaderboard(poolId)
        .then(res => {
          if (res.leaderboard) setLeaderboard(res.leaderboard);
          if (res.top_winners) setTopWinners(res.top_winners);
          if (res.user_rank) setUserRank(res.user_rank);
          if (res.user_points) setUserPoints(res.user_points);
        })
        .catch(err => console.log('Error leaderboard:', err));
    }
  }, [poolId, scaleAnim, trophyAnim]);

  const formattedDrawnCards = (() => {
    if (Array.isArray(drawnCards) && drawnCards.length > 0) {
      return drawnCards.map((c, i) => {
        const parts = String(c).split(' ');
        const val = parts[0] || (drawnNumbers[i] === 1 ? 'A' : String(drawnNumbers[i] || '7'));
        const suit = parts[1] || ['♠', '♥', '♦', '♣'][i % 4];
        const isRed = suit === '♥' || suit === '♦';
        return { val, suit, isRed };
      });
    }
    return (drawnNumbers || [1, 7]).map((n, i) => {
      const val = n === 1 ? 'A' : String(n);
      const suit = ['♠', '♥', '♦', '♣'][i % 4];
      return { val, suit, isRed: suit === '♥' || suit === '♦' };
    });
  })();

  const trophyScale = trophyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [
    { id: 'u1', username: 'You', rank: userRank || 1, total_points: userPoints, is_you: true },
    { id: 'u2', username: 'Vikram_Ace', rank: 2, total_points: Math.max(0, userPoints - 50) },
    { id: 'u3', username: 'Pooja_Sharma', rank: 3, total_points: Math.max(0, userPoints - 100) },
    { id: 'u4', username: 'Rajesh_Matka', rank: 4, total_points: Math.max(0, userPoints - 150) },
    { id: 'u5', username: 'Anil_K', rank: 5, total_points: Math.max(0, userPoints - 200) },
  ];

  // Guaranteed Pinned User Row
  const userRankEntry = {
    username: 'You',
    rank: userRank || 1,
    total_points: userPoints,
    is_you: true,
  };

  return (
    <LinearGradient colors={['#5a0000', '#120000']} style={styles.mainBackground}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* ── Top Header Row ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={navigateBackToPools}
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

        {/* ── Auto-Redirect Countdown Bar ── */}
        {/* ── Main Frame ── */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['rgba(78, 8, 8, 0.85)', 'rgba(30, 3, 3, 0.95)']}
            style={styles.cardContent}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInside}>
              {/* Centered Contest Header */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLine} />
                <Text style={styles.cardTitle}>
                  {isFinalRound ? 'FINAL LEADERBOARD' : `ROUND ${roundNumber} RESULTS`}
                </Text>
                <View style={styles.headerLine} />
              </View>

              {/* Progress Badges */}
              <View style={styles.badgesRow}>
                <View style={styles.slotBadge}>
                  <Text style={styles.slotBadgeText}>{poolName.toUpperCase()}</Text>
                </View>
                <View style={styles.roundBadge}>
                  <Text style={styles.roundBadgeText}>
                    {isFinalRound ? '10 ROUNDS COMPLETED' : `ROUND ${roundNumber} OF ${totalRounds}`}
                  </Text>
                </View>
                <View style={[styles.resultBadge, isWin ? styles.resultBadgeWin : styles.resultBadgeLoss]}>
                  <Text style={styles.resultBadgeText}>{isWin ? '🏆 WINNER' : 'COMPLETED'}</Text>
                </View>
              </View>

              {/* Outcome Banner */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', marginVertical: 6 }}>
                <Animated.View
                  style={[
                    styles.trophyWrapper,
                    { transform: [{ scale: trophyScale }] },
                  ]}
                >
                  <Text style={styles.trophyEmoji}>{isWin ? '🏆' : '🎯'}</Text>
                </Animated.View>

                <Text style={styles.outcomeTitle}>
                  {isFinalRound
                    ? (userRank <= 3 ? '🎉 TOURNAMENT CHAMPION! 🎉' : 'TOURNAMENT COMPLETED')
                    : (isWin ? '🎉 ROUND WINNER! 🎉' : 'ROUND COMPLETED')}
                </Text>
                <Text style={styles.outcomeSub}>
                  {isFinalRound
                    ? (userRank <= 3
                        ? `You finished in Rank #${userRank}! Prizes credited to your wallet.`
                        : `You accumulated ${userPoints} PTS across 10 rounds.`)
                    : `You earned points in Round ${roundNumber}! Next round starts shortly.`}
                </Text>
              </Animated.View>

              {/* ── TWO WINNING CARDS SHOWCASE ── */}
              <View style={styles.winningCardsBox}>
                <Text style={styles.winningCardsTitle}>⭐ LAST ROUND WINNING CARDS ⭐</Text>

                <View style={styles.cardsPairRow}>
                  {formattedDrawnCards.slice(0, 2).map((c, i) => (
                    <View key={i} style={styles.cardCol}>
                      <LinearGradient
                        colors={['#ffffff', '#f4f4f4']}
                        style={[
                          styles.drawnCardItem,
                          { borderColor: i === 0 ? '#06B6D4' : '#FFD700' },
                        ]}
                      >
                        <View
                          style={[
                            styles.openCloseTag,
                            { backgroundColor: i === 0 ? '#0891b2' : '#b45309' },
                          ]}
                        >
                          <Text style={styles.openCloseTagText}>{i === 0 ? 'OPEN' : 'CLOSE'}</Text>
                        </View>
                        <Text
                          style={[
                            styles.drawnCardVal,
                            { color: c.isRed ? '#C20005' : '#111827' },
                          ]}
                        >
                          {c.val}
                        </Text>
                        <Text
                          style={[
                            styles.drawnCardSuit,
                            { color: c.isRed ? '#C20005' : '#111827' },
                          ]}
                        >
                          {c.suit}
                        </Text>
                      </LinearGradient>
                      <Text style={styles.cardColLabel}>
                        Card {i + 1}: {c.val} {c.suit}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Comparison Strip */}
                <View style={styles.compareStrip}>
                  <View>
                    <Text style={styles.compareLabel}>YOUR CARD PICK</Text>
                    <Text style={styles.compareValue}>
                      {Array.isArray(userCards)
                        ? userCards.join(' & ')
                        : String(userPick).replace(',', ' & ')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.matchBadge,
                      isWin ? styles.matchBadgeWin : styles.matchBadgeLoss,
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchBadgeText,
                        { color: isWin ? '#00E676' : '#FF6B6B' },
                      ]}
                    >
                      {isWin ? '✓ MATCHED' : 'COMPLETED'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Points / Prize Strip ── */}
              <View style={styles.prizeStrip}>
                <View style={styles.prizeStripItem}>
                  <Text style={styles.prizeStripLabel}>FINAL RANK</Text>
                  <Text style={[styles.prizeStripValue, { color: '#FFD700' }]}>
                    #{userRank || 1}
                  </Text>
                </View>
                <View style={styles.prizeStripDivider} />
                <View style={styles.prizeStripItem}>
                  <Text style={styles.prizeStripLabel}>TOTAL POINTS</Text>
                  <Text style={[styles.prizeStripValue, { color: '#00E676' }]}>
                    {userPoints} PTS
                  </Text>
                </View>
                <View style={styles.prizeStripDivider} />
                <View style={styles.prizeStripItem}>
                  <Text style={styles.prizeStripLabel}>PRIZE STATUS</Text>
                  <Text
                    style={[
                      styles.prizeStripValue,
                      { color: userRank <= 3 ? '#00E676' : '#94A3B8' },
                    ]}
                  >
                    {userRank <= 3 ? '🏆 WINNER' : 'FINISHED'}
                  </Text>
                </View>
              </View>

              {/* ── Leaderboard Section ── */}
              <View style={styles.leaderboardBox}>
                <View style={styles.leaderboardHeaderRow}>
                  <Text style={styles.leaderboardTitle}>🏆 LEADERBOARD STANDINGS</Text>
                  <Text style={styles.leaderboardSub}>Top 3 Win Prize Multipliers</Text>
                </View>

                {/* Leaderboard Participants */}
                {displayLeaderboard.map((item, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const isYou = item.username === 'You' || item.is_you;
                  return (
                    <View
                      key={item.id || index}
                      style={[
                        styles.leaderboardRow,
                        isYou && styles.leaderboardRowYou,
                      ]}
                    >
                      <View style={styles.playerInfoLeft}>
                        <Text style={{ fontSize: 16 }}>{medals[index] || `#${index + 1}`}</Text>
                        <Text style={{ fontSize: 16 }}>{getAvatar(item.id, item.username)}</Text>
                        <View>
                          <Text
                            style={[
                              styles.playerName,
                              isYou && { color: '#FFD700', fontWeight: '900' },
                            ]}
                          >
                            {item.username} {isYou ? '(You)' : ''}
                          </Text>
                          <Text style={styles.playerRankSub}>Rank #{item.rank || index + 1}</Text>
                        </View>
                      </View>
                      <Text style={styles.playerPoints}>{item.total_points || 0} PTS</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Actions ── */}
              <View style={{ marginTop: 14, marginBottom: 20 }}>
                {!isFinalRound ? (
                  <View style={styles.autoNextContainer}>
                    <LinearGradient
                      colors={['rgba(212, 175, 55, 0.25)', 'rgba(212, 175, 55, 0.08)']}
                      style={styles.autoNextBadge}
                    >
                      <MaterialCommunityIcons name="timer-sand" size={20} color="#FFD700" />
                      <Text style={styles.autoNextText}>
                        ROUND {Number(roundNumber) + 1} OF {totalRounds} STARTS IN{' '}
                        <Text style={styles.autoNextTimer}>{nextRoundCountdown}s</Text>
                      </Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={navigateBackToPools}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#00C853', '#007E33']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.actionGradient}
                    >
                      <Text style={styles.actionBtnText}>
                        🎮 BACK TO CONTEST POOLS · ({finalCountdown}s)
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.secondaryWalletBtn}
                  onPress={() => navigation.navigate('Wallet')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryWalletText}>💰 View Wallet & Claimed Prizes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>

        {/* ── 10-Round Final Winner Celebration Modal ── */}
        <Modal
          visible={showWinnerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWinnerModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <LinearGradient
              colors={['#4a0000', '#1c0505', '#0d0000']}
              style={styles.modalBox}
            >
              <Text style={{ fontSize: 44 }}>👑</Text>
              <Text style={styles.modalTitle}>10 ROUNDS TOURNAMENT</Text>
              <Text style={styles.modalSubTitle}>TOP 3 CHAMPIONS & PRIZES</Text>
              <Text style={styles.modalNote}>
                Prize money is automatically credited to the winners' wallets!
              </Text>

              {/* Podium Rows */}
              <View style={styles.podiumContainer}>
                {/* 1st Place */}
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.25)', 'rgba(255, 215, 0, 0.08)']}
                  style={[styles.podiumRow, { borderColor: '#FFD700' }]}
                >
                  <View style={styles.podiumLeft}>
                    <Text style={{ fontSize: 24 }}>🥇</Text>
                    <Text style={{ fontSize: 20 }}>
                      {getAvatar(1, topWinners[0]?.username || 'Player 1')}
                    </Text>
                    <View>
                      <Text style={[styles.podiumName, { color: '#FFD700' }]}>
                        {topWinners[0]?.username || 'Rank 1 Champion'}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {topWinners[0]?.total_points || 300} PTS
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.podiumPrize}>
                      ₹{topWinners[0]?.reward_paid ? Number(topWinners[0].reward_paid).toLocaleString() : '1,500'}
                    </Text>
                    <Text style={[styles.podiumPct, { color: '#FFD700' }]}>1ST (50%)</Text>
                  </View>
                </LinearGradient>

                {/* 2nd Place */}
                <LinearGradient
                  colors={['rgba(192, 192, 192, 0.2)', 'rgba(192, 192, 192, 0.06)']}
                  style={[styles.podiumRow, { borderColor: '#C0C0C0' }]}
                >
                  <View style={styles.podiumLeft}>
                    <Text style={{ fontSize: 22 }}>🥈</Text>
                    <Text style={{ fontSize: 18 }}>
                      {getAvatar(2, topWinners[1]?.username || 'Player 2')}
                    </Text>
                    <View>
                      <Text style={styles.podiumName}>
                        {topWinners[1]?.username || 'Rank 2 Player'}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {topWinners[1]?.total_points || 200} PTS
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.podiumPrize}>
                      ₹{topWinners[1]?.reward_paid ? Number(topWinners[1].reward_paid).toLocaleString() : '900'}
                    </Text>
                    <Text style={[styles.podiumPct, { color: '#C0C0C0' }]}>2ND (30%)</Text>
                  </View>
                </LinearGradient>

                {/* 3rd Place */}
                <LinearGradient
                  colors={['rgba(205, 127, 50, 0.2)', 'rgba(205, 127, 50, 0.06)']}
                  style={[styles.podiumRow, { borderColor: '#CD7F32' }]}
                >
                  <View style={styles.podiumLeft}>
                    <Text style={{ fontSize: 22 }}>🥉</Text>
                    <Text style={{ fontSize: 18 }}>
                      {getAvatar(3, topWinners[2]?.username || 'Player 3')}
                    </Text>
                    <View>
                      <Text style={styles.podiumName}>
                        {topWinners[2]?.username || 'Rank 3 Player'}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {topWinners[2]?.total_points || 100} PTS
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.podiumPrize}>
                      ₹{topWinners[2]?.reward_paid ? Number(topWinners[2].reward_paid).toLocaleString() : '600'}
                    </Text>
                    <Text style={[styles.podiumPct, { color: '#CD7F32' }]}>3RD (20%)</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.modalWalletBtn}
                onPress={() => {
                  setShowWinnerModal(false);
                  navigation.navigate('Wallet');
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00C853', '#007E33']}
                  style={styles.modalWalletGradient}
                >
                  <Text style={styles.modalWalletBtnText}>
                    💰 VIEW WALLET & CLAIMED PRIZE
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 12, paddingVertical: 6 }}
                onPress={() => {
                  setShowWinnerModal(false);
                  navigateBackToPools();
                }}
              >
                <Text style={{ color: '#D4AF37', fontSize: 13, fontWeight: '700' }}>
                  🎮 Join Another Contest Pool
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
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
  redirectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  redirectBarText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  redirectSeconds: {
    color: '#FFD700',
    fontWeight: '900',
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  scrollInside: {
    paddingBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    marginBottom: 8,
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
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: '800',
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultBadgeWin: {
    backgroundColor: '#00C853',
  },
  resultBadgeLoss: {
    backgroundColor: '#475569',
  },
  resultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  trophyWrapper: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  trophyEmoji: {
    fontSize: 36,
  },
  outcomeTitle: {
    color: '#FFD700',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  outcomeSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 16,
  },
  winningCardsBox: {
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginVertical: 8,
    alignItems: 'center',
  },
  winningCardsTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardsPairRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  cardCol: {
    alignItems: 'center',
  },
  drawnCardItem: {
    width: 76,
    height: 114,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    elevation: 6,
    position: 'relative',
  },
  openCloseTag: {
    position: 'absolute',
    top: 3,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  openCloseTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
  drawnCardVal: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  drawnCardSuit: {
    fontSize: 22,
    marginTop: -3,
  },
  cardColLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  compareStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    marginTop: 8,
  },
  compareLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
  },
  compareValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  matchBadgeWin: {
    backgroundColor: 'rgba(0, 200, 83, 0.2)',
    borderColor: '#00C853',
  },
  matchBadgeLoss: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderColor: '#64748B',
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  prizeStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginVertical: 4,
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
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  prizeStripDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#333333',
  },
  leaderboardBox: {
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 4,
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leaderboardTitle: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  leaderboardSub: {
    color: '#888',
    fontSize: 9,
  },
  pinnedUserRow: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  pinnedTag: {
    position: 'absolute',
    top: -6,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinnedTagText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  pinnedUserName: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
  },
  pinnedUserSub: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '600',
  },
  pinnedUserPoints: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: '900',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  leaderboardRowYou: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  playerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  playerRankSub: {
    color: '#888',
    fontSize: 9,
  },
  playerPoints: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
  },
  autoNextContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  autoNextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    gap: 8,
  },
  autoNextText: {
    color: '#FFD700',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  autoNextTimer: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: '900',
  },
  actionBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  actionGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  secondaryWalletBtn: {
    marginTop: 8,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryWalletText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 4,
  },
  modalSubTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  modalNote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  podiumContainer: {
    width: '100%',
    marginTop: 14,
    gap: 8,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  podiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  podiumName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  podiumScore: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  podiumPrize: {
    color: '#00E676',
    fontWeight: '900',
    fontSize: 14,
  },
  podiumPct: {
    fontSize: 9,
    fontWeight: '800',
  },
  modalWalletBtn: {
    width: '100%',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalWalletGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalWalletBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});