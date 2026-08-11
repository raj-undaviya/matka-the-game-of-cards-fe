import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, ScrollView, TextInput, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { jackpotStyles as styles } from '../styles/GlobalStyle';

const { width } = Dimensions.get('window');
const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const suits = ['♠', '♥', '♦', '♣'];
const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

export default function LuckyDrawJackpotScreen({ route, navigation }) {
  const { roundId } = route.params || {};

  const [selectedCard, setSelectedCard] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [poolPrize, setPoolPrize] = useState(0);

  useEffect(() => {
    // Fetch wallet balance
    apiService.getWalletBalance()
      .then(res => setBalance(res.balance))
      .catch(err => console.log('Error fetching balance:', err));

    // Fetch live jackpot pool info
    if (roundId) {
      apiService.getRoundDetail(roundId)
        .then(res => {
          // Total pool = sum of entry fees of all bets in this round
          setPoolPrize(res.slots_filled * 100); // Or use real total pool if returned
        })
        .catch(err => console.log('Error fetching jackpot detail:', err));
    }
  }, [roundId]);

  const handlePlaceBet = () => {
    const amount = parseInt(betAmount);
    if (!selectedCard) {
      Alert.alert('No Card Selected', 'Please pick your lucky card');
      return;
    }
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Minimum bet is ₹100');
      return;
    }
    Alert.alert(
      '🎰 Confirm Jackpot Entry',
      `Lucky Card: ${selectedCard}\nBet Amount: ₹${amount}\nWinner takes the entire pool!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ENTER JACKPOT',
          onPress: async () => {
            try {
              const numVal = selectedCard === 'A' ? 1 : Number(selectedCard);
              await apiService.placeBet(roundId, [numVal], amount);
              
              navigation.replace('LiveGame', {
                gameType: 'jackpot',
                roundId,
                selectedCard,
                entryFee: amount,
                reward: 'Jackpot',
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
      <LinearGradient colors={['#1a0800', '#2d1500', '#1a0800']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>JACKPOT</Text>
          <View style={styles.coinBalance}>
            <Text style={styles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Pot Visual */}
          <View style={styles.potSection}>
            <Text style={styles.potIcon}>🏺</Text>
            <Text style={styles.jackpotLabel}>MATKA JACKPOT</Text>
            <Text style={styles.prizePoolLabel}>Total Prize Pool</Text>
            <Text style={styles.prizeAmount}>₹{poolPrize > 0 ? poolPrize.toLocaleString() : '50,000'}</Text>
            <View style={styles.winnerTag}>
              <Text style={styles.winnerTagText}>🏆 Winner Takes All</Text>
            </View>
          </View>

          {/* Card Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pick Your Lucky Card</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cards.map((card, index) => {
                const isSelected = selectedCard === card;
                const suit = suits[index % 4];
                const isRed = suit === '♥' || suit === '♦';
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.card, isSelected && styles.selectedCard]}
                    onPress={() => setSelectedCard(card)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isSelected ? ['#8B4513', '#FFD700'] : ['#fff', '#f5f5f5']}
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
            </ScrollView>
          </View>

          {/* Bet Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bet Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={betAmount}
                onChangeText={setBetAmount}
                placeholder="Enter amount"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <View style={styles.quickAmounts}>
              {quickAmounts.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickBtn, betAmount === String(amt) && styles.quickBtnActive]}
                  onPress={() => setBetAmount(String(amt))}
                >
                  <Text style={[styles.quickBtnText, betAmount === String(amt) && styles.quickBtnTextActive]}>
                    ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.minNote}>Min: ₹100 · No maximum</Text>
          </View>

          <TouchableOpacity
            style={[styles.placeBetButton, (!selectedCard || !betAmount) && styles.disabledButton]}
            onPress={handlePlaceBet}
            disabled={!selectedCard || !betAmount}
          >
            <LinearGradient
              colors={selectedCard && betAmount ? ['#FFD700', '#FFA500'] : ['#555', '#333']}
              style={styles.buttonGradient}
            >
              <Text style={styles.placeBetText}>PLACE BET</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
