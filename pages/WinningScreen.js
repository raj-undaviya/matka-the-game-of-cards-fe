import React, { useState, useEffect, useRef } from 'react';
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
    drawnCard,
    userCards = ['A', '7'],
    userPick = 'A,7',
    won = 'false',
    entryFee = 150,
    reward = '20x',
    winningPrize = 3000,
    roundId,
    poolId,
    roundNumber = 1,
    totalRounds = 10,
    slotNumber = 1,
  } = params;

  const isWin = won === 'true' || won === true;
  const isFinalRound = Number(roundNumber) >= Number(totalRounds);

  const [leaderboard, setLeaderboard] = useState([]);
  const [topWinners, setTopWinners] = useState([]);
  const [userRank, setUserRank] = useState(1);
  const [userPoints, setUserPoints] = useState(isWin ? 3000 : 0);
  const [balance, setBalance] = useState(0);
  const [showWinnerModal, setShowWinnerModal] = useState(isFinalRound);
  const [nextRoundLoading, setNextRoundLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;

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
  }, [poolId]);

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

  const handleNextRound = async () => {
    setNextRoundLoading(true);
    try {
      const nextRNum = Number(roundNumber) + 1;
      let nextRId = null;

      if (poolId) {
        const lb = await apiService.getPoolLeaderboard(poolId);
        nextRId = lb.active_round_id;
      }

      if (!nextRId) {
        const rounds = await apiService.getRounds('V2');
        if (rounds && rounds.length > 0) {
          nextRId = rounds[0].id;
        }
      }

      navigation.replace('PairSelection', {
        roundId: nextRId,
        poolId,
        roundNumber: nextRNum,
        totalRounds,
        slotNumber,
        entryFee,
        winningPrize,
        reward,
      });
    } catch (err) {
      navigation.replace('PairSelection', {
        poolId,
        roundNumber: Number(roundNumber) + 1,
        totalRounds,
        slotNumber,
        entryFee,
        winningPrize,
        reward,
      });
    } finally {
      setNextRoundLoading(false);
    }
  };

  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [
    { id: 1, username: 'You', rank: userRank || 1, total_points: isWin ? 3000 : 500, is_you: true },
    { id: 2, username: 'Vikram_Ace', rank: 2, total_points: 2400 },
    { id: 3, username: 'Pooja_Sharma', rank: 3, total_points: 1800 },
    { id: 4, username: 'Rajesh_Matka', rank: 4, total_points: 1200 },
    { id: 5, username: 'Anil_K', rank: 5, total_points: 900 },
  ];

  const trophyScale = trophyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <LinearGradient colors={['#5a0000', '#120000']} style={styles.mainBackground}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* ── Top Header Row ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('ContestPool')}
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
                <Text style={styles.cardTitle}>ROUND RESULT</Text>
                <View style={styles.headerLine} />
              </View>

              {/* Progress Badges */}
              <View style={styles.badgesRow}>
                <View style={styles.slotBadge}>
                  <Text style={styles.slotBadgeText}>SLOT #{slotNumber}</Text>
                </View>
                <View style={styles.roundBadge}>
                  <Text style={styles.roundBadgeText}>ROUND {roundNumber}/{totalRounds}</Text>
                </View>
                <View style={[styles.resultBadge, isWin ? styles.resultBadgeWin : styles.resultBadgeLoss]}>
                  <Text style={styles.resultBadgeText}>{isWin ? '🏆 WON' : 'COMPLETED'}</Text>
                </View>
              </View>

              {/* Outcome Banner */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', marginVertical: 8 }}>
                <Animated.View style={[
                  styles.trophyWrapper,
                  { transform: [{ scale: trophyScale }] }
                ]}>
                  <Text style={styles.trophyEmoji}>{isWin ? '🏆' : '🎯'}</Text>
                </Animated.View>

                <Text style={styles.outcomeTitle}>
                  {isWin ? 'CONGRATULATIONS! YOU WON!' : 'ROUND FINISHED'}
                </Text>
                <Text style={styles.outcomeSub}>
                  {isWin
                    ? `Predicted winning pair correctly! Win Reward: ${reward}`
                    : `Round ${roundNumber} completed. Keep playing to reach Top 3!`}
                </Text>
              </Animated.View>

              {/* ── TWO WINNING CARDS SHOWCASE ── */}
              <View style={styles.winningCardsBox}>
                <Text style={styles.winningCardsTitle}>⭐ TWO WINNING CARDS DRAWN ⭐</Text>

                <View style={styles.cardsPairRow}>
                  {formattedDrawnCards.slice(0, 2).map((c, i) => (
                    <View key={i} style={styles.cardCol}>
                      <LinearGradient
                        colors={['#ffffff', '#f4f4f4']}
                        style={[styles.drawnCardItem, { borderColor: i === 0 ? '#06B6D4' : '#FFD700' }]}
                      >
                        <View style={[styles.openCloseTag, { backgroundColor: i === 0 ? '#0891b2' : '#b45309' }]}>
                          <Text style={styles.openCloseTagText}>{i === 0 ? 'OPEN' : 'CLOSE'}</Text>
                        </View>
                        <Text style={[styles.drawnCardVal, { color: c.isRed ? '#C20005' : '#111827' }]}>
                          {c.val}
                        </Text>
                        <Text style={[styles.drawnCardSuit, { color: c.isRed ? '#C20005' : '#111827' }]}>
                          {c.suit}
                        </Text>
                      </LinearGradient>
                      <Text style={styles.cardColLabel}>Card {i + 1}: {c.val} {c.suit}</Text>
                    </View>
                  ))}
                </View>

                {/* Comparison Strip */}
                <View style={styles.compareStrip}>
                  <View>
                    <Text style={styles.compareLabel}>YOUR PICK</Text>
                    <Text style={styles.compareValue}>
                      {Array.isArray(userCards) ? userCards.join(' & ') : String(userPick).replace(',', ' & ')}
                    </Text>
                  </View>
                  <View style={[styles.matchBadge, isWin ? styles.matchBadgeWin : styles.matchBadgeLoss]}>
                    <Text style={[styles.matchBadgeText, { color: isWin ? '#00E676' : '#FF6B6B' }]}>
                      {isWin ? '✓ MATCHED' : '✗ MISSED'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Points / Prize Strip ── */}
              <View style={styles.prizeStrip}>
                <View style={styles.prizeStripItem}>
                  <Text style={styles.prizeStripLabel}>ROUND POINTS</Text>
                  <Text style={[styles.prizeStripValue, { color: isWin ? '#00E676' : '#FFD700' }]}>
                    {isWin ? '+3,000 PTS' : '0 PTS'}
                  </Text>
                </View>
                <View style={styles.prizeStripDivider} />
                <View style={styles.prizeStripItem}>
                  <Text style={styles.prizeStripLabel}>YOUR RANK</Text>
                  <Text style={[styles.prizeStripValue, { color: '#FFD700' }]}>#{userRank || 1}</Text>
                </View>
                <View style={styles.prizeStripDivider} />
                <View style={styles.prizeStripItem}>
                  <Text style={styles.prizeStripLabel}>TOTAL POINTS</Text>
                  <Text style={styles.prizeStripValue}>{userPoints} PTS</Text>
                </View>
              </View>

              {/* ── Leaderboard Preview ── */}
              <View style={styles.leaderboardBox}>
                <View style={styles.leaderboardHeaderRow}>
                  <Text style={styles.leaderboardTitle}>🏆 LEADERBOARD STANDINGS</Text>
                  <Text style={styles.leaderboardSub}>Top 3 Win Prizes</Text>
                </View>

                {displayLeaderboard.slice(0, 3).map((item, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <View
                      key={item.id || index}
                      style={[
                        styles.leaderboardRow,
                        (item.username === 'You' || item.is_you) && styles.leaderboardRowYou
                      ]}
                    >
                      <View style={styles.playerInfoLeft}>
                        <Text style={{ fontSize: 18 }}>{medals[index] || `#${index + 1}`}</Text>
                        <Text style={{ fontSize: 18 }}>{getAvatar(item.id, item.username)}</Text>
                        <View>
                          <Text style={[styles.playerName, (item.username === 'You' || item.is_you) && { color: '#FFD700' }]}>
                            {item.username} {item.username === 'You' || item.is_you ? '(You)' : ''}
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
              <View style={{ marginTop: 16, marginBottom: 20 }}>
                {!isFinalRound ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleNextRound}
                    disabled={nextRoundLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#00C853', '#007E33']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.actionGradient}
                    >
                      <Text style={styles.actionBtnText}>
                        {nextRoundLoading
                          ? 'LOADING NEXT ROUND…'
                          : `PLAY ROUND ${Number(roundNumber) + 1} OF ${totalRounds} ➔`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowWinnerModal(true)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA000', '#D4AF37']}
                      style={styles.actionGradient}
                    >
                      <Text style={[styles.actionBtnText, { color: '#000' }]}>
                        👑 VIEW FINAL TOURNAMENT WINNERS 👑
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.secondaryWalletBtn}
                  onPress={() => navigation.navigate('Wallet')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryWalletText}>💰 View Wallet Balance</Text>
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
                    <Text style={{ fontSize: 20 }}>{getAvatar(1, topWinners[0]?.username || 'Player 1')}</Text>
                    <View>
                      <Text style={[styles.podiumName, { color: '#FFD700' }]}>
                        {topWinners[0]?.username || 'Rank 1 Champion'}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {topWinners[0]?.total_points || 3000} PTS
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
                    <Text style={{ fontSize: 18 }}>{getAvatar(2, topWinners[1]?.username || 'Player 2')}</Text>
                    <View>
                      <Text style={styles.podiumName}>
                        {topWinners[1]?.username || 'Rank 2 Player'}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {topWinners[1]?.total_points || 2400} PTS
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
                    <Text style={{ fontSize: 18 }}>{getAvatar(3, topWinners[2]?.username || 'Player 3')}</Text>
                    <View>
                      <Text style={styles.podiumName}>
                        {topWinners[2]?.username || 'Rank 3 Player'}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {topWinners[2]?.total_points || 1800} PTS
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

              {/* Wallet Direct Action */}
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
                  navigation.navigate('ContestPool');
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
    fontSize: 11,
    fontWeight: '900',
  },
  trophyWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  trophyEmoji: {
    fontSize: 40,
  },
  outcomeTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  outcomeSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 16,
  },
  winningCardsBox: {
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginVertical: 10,
    alignItems: 'center',
  },
  winningCardsTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  cardsPairRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  cardCol: {
    alignItems: 'center',
  },
  drawnCardItem: {
    width: 82,
    height: 122,
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
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  drawnCardVal: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
  },
  drawnCardSuit: {
    fontSize: 24,
    marginTop: -3,
  },
  cardColLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  compareStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginTop: 10,
  },
  compareLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
  },
  compareValue: {
    color: '#fff',
    fontSize: 14,
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
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '900',
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
  leaderboardBox: {
    backgroundColor: 'rgba(15, 15, 15, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 6,
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaderboardTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  leaderboardSub: {
    color: '#888',
    fontSize: 10,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  leaderboardRowYou: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  playerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  playerRankSub: {
    color: '#888',
    fontSize: 10,
  },
  playerPoints: {
    color: '#FFD700',
    fontSize: 12,
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
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  secondaryWalletBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryWalletText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  modalNote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  podiumContainer: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
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
    fontSize: 13,
  },
  podiumScore: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  podiumPrize: {
    color: '#00E676',
    fontWeight: '900',
    fontSize: 15,
  },
  podiumPct: {
    fontSize: 9,
    fontWeight: '800',
  },
  modalWalletBtn: {
    width: '100%',
    marginTop: 18,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalWalletGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalWalletBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});