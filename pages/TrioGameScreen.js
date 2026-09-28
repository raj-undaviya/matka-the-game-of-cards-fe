import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { trioStyles as styles } from '../styles/GlobalStyle';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 5;

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const suits = ['♠', '♥', '♦', '♣'];

export default function TrioGameScreen({ route, navigation }) {
  const {
    roundId: initialRoundId,
    poolId,
    entryFee = 200,
    winningPrize = 10000,
    reward = '50x',
    roundNumber = 1,
    totalRounds = 10,
    slotNumber = 1,
    isDailyMega = false,
    country = 'India',
  } = route.params || {};

  const [currentRound, setCurrentRound] = useState(Number(roundNumber) || 1);
  const [activeRoundId, setActiveRoundId] = useState(initialRoundId);
  const [selectedCards, setSelectedCards] = useState([]);
  const [timer, setTimer] = useState(10);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Fetch wallet balance
    apiService.getWalletBalance()
      .then(res => setBalance(res.balance || res.current_balance || 0))
      .catch(err => console.log('Error fetching balance:', err));

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
          Alert.alert('Completed', 'All rounds completed!');
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
      Alert.alert('Limit Reached', 'You can only select 3 cards');
    }
  };

  const isTriple = selectedCards.length === 3 && new Set(selectedCards).size === 1;
  const multiplier = isTriple ? '50x' : (reward || '25x');

  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async () => {
    if (loading) return;
    if (selectedCards.length !== 3) {
      Alert.alert('Invalid Selection', 'Please select exactly 3 cards');
      return;
    }
    setLoading(true);
    try {
      const targetId = activeRoundId || initialRoundId || poolId;
      const numList = selectedCards.map(c => c === 'A' ? 1 : Number(c));
      const res = await apiService.placeBet(targetId, numList, entryFee);
      const finalRoundId = res?.round || res?.round_id || targetId;
      
      navigation.replace('LiveGame', {
        gameType: 'trio',
        roundId: finalRoundId,
        poolId,
        selectedCards: selectedCards.join(','),
        entryFee,
        reward: multiplier,
        winningPrize,
        roundNumber: currentRound,
        totalRounds,
        slotNumber,
        isDailyMega,
        country,
      });
    } catch (err) {
      const errMsg = err.message || 'Failed to place bet';
      if (errMsg.includes('already placed')) {
        navigation.replace('LiveGame', {
          gameType: 'trio',
          roundId: activeRoundId || initialRoundId || poolId,
          poolId,
          selectedCards: selectedCards.join(','),
          entryFee,
          reward: multiplier,
          winningPrize,
          roundNumber: currentRound,
          totalRounds,
          slotNumber,
          isDailyMega,
          country,
        });
      } else {
        Alert.alert('Bet Error', errMsg);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a0a2e', '#0d0518']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trio Game</Text>
          <View style={styles.coinBalance}>
            <Text style={styles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.infoBar}>
          {[
            { label: 'Timer', value: `${timer}s`, color: timer < 10 ? '#FF6B6B' : '#fff' },
            poolId
              ? { label: 'Round', value: `${roundNumber}/${totalRounds}`, color: '#00E676' }
              : { label: 'Triple Match', value: 'x50', color: '#FFD700' },
            { label: 'Reward', value: multiplier, color: '#8B5CF6' },
          ].map((item, i) => (
            <View key={i} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: item.color || '#fff' }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.gameArea}>
          <Text style={styles.instruction}>SELECT THREE CARDS</Text>

          <View style={styles.starsRow}>
            {[0, 1, 2].map((i) => (
              <Text key={i} style={[styles.star, i < selectedCards.length && styles.starActive]}>
                ★
              </Text>
            ))}
          </View>

          {selectedCards.length === 3 && (
            <View style={[styles.tripleTag,
              { borderColor: isTriple ? '#FFD700' : '#8B5CF6' }]}>
              <Text style={[styles.tripleTagText,
                { color: isTriple ? '#FFD700' : '#8B5CF6' }]}>
                {isTriple ? '🔥 TRIPLE MATCH! x50' : `Combo x25`}
              </Text>
            </View>
          )}

          <View style={styles.cardsContainer}>
            {cards.map((card, index) => {
              const isSelected = selectedCards.includes(card);
              const suit = suits[index % 4];
              const isRed = suit === '♥' || suit === '♦';
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.card, isSelected && styles.selectedCard,
                    { width: CARD_SIZE, height: CARD_SIZE * 1.4 }]}
                  onPress={() => handleCardSelect(card)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={isSelected ? ['#3d1a6b', '#8B5CF6'] : ['#fff', '#f0f0f0']}
                    style={styles.cardInner}
                  >
                    <Text style={[styles.cardValue,
                      { color: isSelected ? '#fff' : (isRed ? '#cc0000' : '#111') }]}>
                      {card}
                    </Text>
                    <Text style={[styles.cardSuit,
                      { color: isSelected ? '#fff' : (isRed ? '#cc0000' : '#111') }]}>
                      {suit}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.betInfo}>
            <Text style={styles.betInfoText}>Entry Fee: ₹{entryFee}</Text>
            <Text style={styles.betInfoText}>
              {selectedCards.length === 3
                ? (isTriple ? `Win: ₹${(entryFee * 50).toLocaleString()} (50x)` : `Win: ₹${(entryFee * 25).toLocaleString()} (25x)`)
                : 'Select 3 cards'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeBetButton, selectedCards.length !== 3 && styles.disabledButton]}
          onPress={handlePlaceBet}
          disabled={selectedCards.length !== 3}
        >
          <LinearGradient
            colors={selectedCards.length === 3 ? ['#8B5CF6', '#7C3AED'] : ['#555', '#333']}
            style={styles.buttonGradient}
          >
            <Text style={styles.placeBetText}>
              {selectedCards.length === 3
                ? `PLACE BET · ${selectedCards.join(' · ')}`
                : `SELECT ${3 - selectedCards.length} MORE`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}