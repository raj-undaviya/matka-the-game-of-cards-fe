import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { lastDigitSumStyles as styles } from '../styles/GlobalStyle';

const { width } = Dimensions.get('window');
const BTN_SIZE = (width - 80) / 5;

export default function LastDigitSumGameScreen({ route, navigation }) {
  const { roundId, entryFee = 1000, winningPrize = 80000, reward = '80x' } = route.params || {};

  const [selectedDigit, setSelectedDigit] = useState(null);
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

  const handlePlaceBet = () => {
    if (selectedDigit === null) {
      Alert.alert('No Digit Selected', 'Please select a digit 0–9');
      return;
    }
    Alert.alert(
      'Confirm Bet',
      `Bet on digit: ${selectedDigit}?\nEntry Fee: ₹${entryFee.toLocaleString()}\nWin: ₹${winningPrize.toLocaleString()} (${reward})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Map 0 to 10 to satisfy backend validator range
              const apiDigit = selectedDigit === 0 ? 10 : selectedDigit;
              await apiService.placeBet(roundId, [apiDigit], entryFee);
              
              navigation.replace('LiveGame', {
                gameType: 'lastDigitSum',
                roundId,
                selectedDigit,
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
      <LinearGradient colors={['#0a1628', '#050d1a']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Last Digit Sum</Text>
          <View style={styles.coinBalance}>
            <Text style={styles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.infoBar}>
          {[
            { label: 'Timer', value: `${timer}s`, color: timer < 10 ? '#FF6B6B' : '#fff' },
            { label: 'Slots', value: '3/5' },
            { label: 'Reward', value: 'x80', color: '#F97316' },
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
          <View style={styles.titleBox}>
            <Text style={styles.instruction}>SELECT LAST DIGIT</Text>
            <Text style={styles.subInstruction}>
              3 cards will be drawn — pick the last digit of their sum
            </Text>
          </View>

          <View style={styles.digitsGrid}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
              const isSelected = selectedDigit === digit;
              return (
                <TouchableOpacity
                  key={digit}
                  style={{ width: BTN_SIZE, height: BTN_SIZE, margin: 4 }}
                  onPress={() => setSelectedDigit(digit)}
                  activeOpacity={0.7}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={['#F97316', '#EA580C']}
                      style={[styles.digitInner, { borderRadius: BTN_SIZE / 2 }]}
                    >
                      <Text style={[styles.digitText, { color: '#fff' }]}>{digit}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.digitInner, styles.digitInactive,
                      { borderRadius: BTN_SIZE / 2 }]}>
                      <Text style={styles.digitText}>{digit}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Example</Text>
            <Text style={styles.exampleText}>
              Cards: 5 + 7 + 4 = 16 → Last Digit ={' '}
              <Text style={{ color: '#F97316', fontWeight: 'bold' }}>6</Text>
            </Text>
          </View>

          <View style={styles.betInfo}>
            <Text style={styles.betInfoText}>Entry Fee: ₹{entryFee.toLocaleString()}</Text>
            <Text style={styles.betInfoText}>Win: ₹{winningPrize.toLocaleString()} ({reward})</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeBetButton, selectedDigit === null && styles.disabledButton]}
          onPress={handlePlaceBet}
          disabled={selectedDigit === null}
        >
          <LinearGradient
            colors={selectedDigit !== null ? ['#F97316', '#EA580C'] : ['#555', '#333']}
            style={styles.buttonGradient}
          >
            <Text style={styles.placeBetText}>
              {selectedDigit !== null ? `CONFIRM DIGIT: ${selectedDigit}` : 'SELECT A DIGIT'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}