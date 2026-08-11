import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { pairSelectionStyles as styles } from '../styles/GlobalStyle';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 5;

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const suits = ['♠', '♥', '♦', '♣'];

export default function PairSelectionGameScreen({ route, navigation }) {
  const { roundId, entryFee = 150, winningPrize = 3000, reward = '20x' } = route.params || {};

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
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    } else {
      Alert.alert('Limit Reached', 'You can only select 2 cards');
    }
  };

  const handlePlaceBet = () => {
    if (selectedCards.length !== 2) {
      Alert.alert('Invalid Selection', 'Please select exactly 2 cards');
      return;
    }
    Alert.alert(
      'Confirm Bet',
      `Place bet on ${selectedCards.join(' & ')}?\nEntry Fee: ₹${entryFee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const numList = selectedCards.map(c => c === 'A' ? 1 : Number(c));
              await apiService.placeBet(roundId, numList, entryFee);
              
              navigation.replace('LiveGame', {
                gameType: 'pair',
                roundId,
                selectedCards: selectedCards.join(','),
                entryFee,
                reward,
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
      <LinearGradient colors={['#001a2d', '#000d1a']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pair Selection</Text>
          <View style={styles.coinBalance}>
            <Text style={styles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.infoBar}>
          {[
            { label: 'Timer', value: `${timer}s`, color: timer < 10 ? '#FF6B6B' : '#fff' },
            { label: 'Selected', value: `${selectedCards.length}/2` },
            { label: 'Reward', value: 'x20', color: '#06B6D4' },
          ].map((item, i) => (
            <View key={i} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, item.color ? { color: item.color } : {}]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.gameArea}>
          <Text style={styles.instruction}>Select Your Pair</Text>
          <Text style={styles.subInstruction}>{selectedCards.length}/2 cards selected</Text>

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
                    colors={isSelected ? ['#003d4d', '#06B6D4'] : ['#fff', '#f0f0f0']}
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
            <Text style={styles.betInfoText}>Win: ₹{winningPrize.toLocaleString()} ({reward})</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeBetButton, selectedCards.length !== 2 && styles.disabledButton]}
          onPress={handlePlaceBet}
          disabled={selectedCards.length !== 2}
        >
          <LinearGradient
            colors={selectedCards.length === 2 ? ['#06B6D4', '#0891B2'] : ['#555', '#333']}
            style={styles.buttonGradient}
          >
            <Text style={styles.placeBetText}>
              {selectedCards.length === 2
                ? `PLACE BET · ${selectedCards.join(' & ')}`
                : `SELECT ${2 - selectedCards.length} MORE`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}