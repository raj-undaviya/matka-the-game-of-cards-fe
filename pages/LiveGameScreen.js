
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { liveGameStyles as styles } from '../styles/GlobalStyle';

const { width } = Dimensions.get('window');

const MOCK_PLAYERS = [
  { id: 1, name: 'Rahul', angle: 270, bet: 100, emoji: '👦' },
  { id: 2, name: 'Priya', angle: 330, bet: 150, emoji: '👩' },
  { id: 3, name: 'Suresh', angle: 30, bet: 200, emoji: '👨' },
  { id: 4, name: 'Meena', angle: 90, bet: 100, emoji: '👱' },
  { id: 5, name: 'Arjun', angle: 150, bet: 175, emoji: '🧑' },
  { id: 6, name: 'You', angle: 210, bet: 0, isYou: true, emoji: '😎' },
];

export default function LiveGameScreen({ route, navigation }) {
  const params = route.params || {};
  const { gameType, roundId, selectedCard, selectedCards, selectedDigit, entryFee, reward } = params;
  const userPick = selectedCard || selectedCards?.split(',')[0] || selectedDigit;

  const [phase, setPhase] = useState('waiting');
  const [countdown, setCountdown] = useState(3);
  const [waitTimer, setWaitTimer] = useState(5); // Slots left
  const [drawnCardsStr, setDrawnCardsStr] = useState('?');

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  // Main Polling Loop to check active Django Round Status
  useEffect(() => {
    if (!roundId) return;

    const interval = setInterval(async () => {
      try {
        const detail = await apiService.getRoundDetail(roundId);
        
        // Update slots left
        const slotsLeft = Math.max(0, detail.max_slots - detail.slots_filled);
        setWaitTimer(slotsLeft);

        if (detail.status === 'drawing') {
          setPhase('countdown');
        } else if (detail.status === 'completed') {
          clearInterval(interval);
          setPhase('revealing');

          const drawn = detail.drawn_numbers || [7];
          const drawnNum = drawn[0];
          const drawnCardString = drawnNum === 1 ? 'A' : String(drawnNum);
          const drawnSuit = ['♠', '♥', '♦', '♣'][Math.floor(Math.random() * 4)];
          
          setDrawnCardsStr(`${drawnCardString} ${drawnSuit}`);

          // Calculate win locally based on same game engine logic
          let didWin = false;
          if (gameType === 'single') {
            didWin = userPick === drawnCardString;
          } else if (gameType === 'pair') {
            const pickedArr = selectedCards?.split(',') || [];
            const pickedNums = pickedArr.map(c => c === 'A' ? 1 : Number(c));
            didWin = pickedNums[0] === drawn[0] && pickedNums[1] === drawn[1];
          } else if (gameType === 'trio') {
            const pickedArr = selectedCards?.split(',') || [];
            const pickedNums = pickedArr.map(c => c === 'A' ? 1 : Number(c));
            const allSame = (drawn[0] === drawn[1] && drawn[1] === drawn[2]);
            if (allSame) {
              didWin = pickedNums.every(n => n === drawn[0]);
            } else {
              didWin = pickedNums.some(n => drawn.includes(n));
            }
          } else if (gameType === 'lastDigitSum') {
            const sum = drawn.reduce((a, b) => a + b, 0);
            const lastDigit = sum % 10;
            didWin = Number(selectedDigit) === lastDigit;
          } else if (gameType === 'jackpot') {
            didWin = userPick === drawnCardString;
          }

          setTimeout(() => {
            navigation.replace('Winning', {
              gameType,
              reward,
              entryFee,
              drawnCard: `${drawnCardString} ${drawnSuit}`,
              userPick,
              won: String(didWin),
            });
          }, 1800);
        }
      } catch (e) {
        console.log('Error polling round status:', e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [roundId, gameType, userPick, selectedCards, selectedDigit]);

  // Local countdown timer ticks when phase is drawing
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  const circleRadius = 130;
  const centerX = width / 2;
  const arenaCenter = 220;

  const statusText =
    phase === 'waiting' ? `FILLING SLOTS · ${waitTimer}s` :
    phase === 'countdown' ? `REVEALING IN ${countdown}…` : 'REVEALING…';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a0000', '#3d0000', '#1a0000']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LIVE ROUND</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>
              {phase === 'waiting' ? `${waitTimer}s` : `${countdown}`}
            </Text>
          </View>
          <View style={styles.coinBalance}>
            <Text style={styles.coinText}>🪙 {5000 - Number(entryFee || 0)}</Text>
          </View>
        </View>

        <Text style={styles.statusText}>
          {phase === 'waiting' ? `FILLING SLOTS · ${waitTimer} slots left` : statusText}
        </Text>

        {/* Arena */}
        <View style={[styles.arena, { height: arenaCenter * 2 }]}>
          {MOCK_PLAYERS.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const px = centerX + circleRadius * Math.cos(rad) - 30;
            const py = arenaCenter + circleRadius * Math.sin(rad) - 30;
            return (
              <View key={p.id} style={[
                styles.playerAvatar,
                p.isYou && styles.playerAvatarYou,
                { position: 'absolute', left: px, top: py },
              ]}>
                <Text style={styles.avatarEmoji}>{p.emoji}</Text>
                {p.bet > 0 && (
                  <View style={styles.betBadge}>
                    <Text style={styles.betBadgeText}>{p.bet}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Center Card */}
          <View style={[styles.cardWrap, { top: arenaCenter - 110 }]}>
            <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />
            <LinearGradient colors={['#fff', '#f9f9f9']} style={styles.mainCard}>
              {phase === 'revealing' ? (
                <>
                  <Text style={styles.cardValueLarge}>{drawnCardsStr.split(' ')[0]}</Text>
                  <Text style={styles.cardSuitLarge}>{drawnCardsStr.split(' ')[1]}</Text>
                </>
              ) : (
                <View style={styles.cardBack}>
                  {phase === 'countdown' && (
                    <Text style={styles.revealingLabel}>REVEALING{'\n'}IN</Text>
                  )}
                  <Text style={styles.cardBackText}>
                    {phase === 'countdown' ? `${countdown}` : '?'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Bet Strip */}
        <View style={styles.betStrip}>
          <View style={styles.betStripItem}>
            <Text style={styles.betStripLabel}>Your Pick</Text>
            <Text style={styles.betStripValue}>{userPick}</Text>
          </View>
          <View style={styles.betStripDivider} />
          <View style={styles.betStripItem}>
            <Text style={styles.betStripLabel}>Bet</Text>
            <Text style={[styles.betStripValue, { color: '#FFD700' }]}>₹{entryFee}</Text>
          </View>
          <View style={styles.betStripDivider} />
          <View style={styles.betStripItem}>
            <Text style={styles.betStripLabel}>If Win</Text>
            <Text style={[styles.betStripValue, { color: '#4ECDC4' }]}>{reward}</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}