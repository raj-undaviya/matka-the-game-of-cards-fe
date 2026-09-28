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
  const {
    roundId: initialRoundId,
    poolId,
    entryFee = 1000,
    winningPrize = 80000,
    reward = '80x',
    roundNumber = 1,
    totalRounds = 10,
    slotNumber = 1,
    isDailyMega = false,
    country = 'India',
  } = route.params || {};

  const [currentRound, setCurrentRound] = useState(Number(roundNumber) || 1);
  const [activeRoundId, setActiveRoundId] = useState(initialRoundId);
  const [selectedDigit, setSelectedDigit] = useState(null);
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
      if (selectedDigit !== null) {
        handlePlaceBet();
      } else {
        if (currentRound < Number(totalRounds)) {
          const nextR = currentRound + 1;
          setCurrentRound(nextR);
          setSelectedDigit(null);
          setTimer(10);
        } else {
          Alert.alert('Completed', 'All rounds completed!');
        }
      }
    }
  }, [timer]);

  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async () => {
    if (loading) return;
    if (selectedDigit === null) {
      Alert.alert('No Digit Selected', 'Please select a digit 0–9');
      return;
    }
    setLoading(true);
    try {
      const targetId = activeRoundId || initialRoundId || poolId;
      // Map 0 to 10 to satisfy backend validator range
      const apiDigit = selectedDigit === 0 ? 10 : selectedDigit;
      const res = await apiService.placeBet(targetId, [apiDigit], entryFee);
      const finalRoundId = res?.round || res?.round_id || targetId;
      
      navigation.replace('LiveGame', {
        gameType: 'lastDigitSum',
        roundId: finalRoundId,
        poolId,
        selectedDigit,
        entryFee,
        reward,
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
          gameType: 'lastDigitSum',
          roundId: activeRoundId || initialRoundId || poolId,
          poolId,
          selectedDigit,
          entryFee,
          reward,
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
            poolId
              ? { label: 'Round', value: `${roundNumber}/${totalRounds}`, color: '#00E676' }
              : { label: 'Slots', value: '3/5' },
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