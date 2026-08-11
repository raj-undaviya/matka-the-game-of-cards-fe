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
  const { roundId, entryFee = 200, winningPrize = 10000, reward = '50x' } = route.params || {};

  const [selectedCards, setSelectedCards] = useState([]);
  const [timer, setTimer] = useState(60);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Fetch wallet balance
    apiService.getWalletBalance()
      .then(res => setBalance(res.balance))
      .catch(err => console.log('Error fetching balance:', err));

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const multiplier = isTriple ? '50x' : '25x';

  const handlePlaceBet = () => {
    if (selectedCards.length !== 3) {
      Alert.alert('Invalid Selection', 'Please select exactly 3 cards');
      return;
    }
    Alert.alert(
      'Confirm Bet',
      `Bet on ${selectedCards.join(', ')}?\nEntry Fee: ₹${entryFee}\nReward: ${multiplier}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const numList = selectedCards.map(c => c === 'A' ? 1 : Number(c));
              await apiService.placeBet(roundId, numList, entryFee);
              
              navigation.replace('LiveGame', {
                gameType: 'trio',
                roundId,
                selectedCards: selectedCards.join(','),
                entryFee,
                reward: multiplier,
              });
            } catch (err) {
              Alert.alert('Bet Error', err.message || 'Failed to place bet');
            }
          },
        },
      ]
    );
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
            { label: 'Triple Match', value: 'x50', color: '#FFD700' },
            { label: 'Other', value: 'x25', color: '#8B5CF6' },
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