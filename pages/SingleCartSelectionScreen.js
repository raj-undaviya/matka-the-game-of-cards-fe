import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    SafeAreaView, Alert, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { singleCardStyles as styles } from '../styles/GlobalStyle';
import { Ionicons } from '@expo/vector-icons';
import LeaderboardScreen from '../components/LeaderBoard';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 5;

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const suits = ['♠', '♥', '♦', '♣'];

export default function SingleCardGameScreen({ route, navigation }) {
    const { roundId, entryFee = 100, winningPrize = 1000, reward = '10x' } = route.params || {};

    const [selectedCard, setSelectedCard] = useState(null);
    const [timer, setTimer] = useState(60);
    const [balance, setBalance] = useState(0);
    const [slotsOccupied, setSlotsOccupied] = useState(0);

    useEffect(() => {
        // Fetch wallet balance
        apiService.getWalletBalance()
            .then(res => setBalance(res.balance))
            .catch(err => console.log('Error fetching balance:', err));

        // Fetch live slot occupancy
        if (roundId) {
            apiService.getRoundDetail(roundId)
                .then(res => setSlotsOccupied(res.slots_filled))
                .catch(err => console.log('Error fetching round info:', err));
        }

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [roundId]);

    const mapCardToNumber = (cardStr) => {
        if (cardStr === 'A') return 1;
        return Number(cardStr);
    };

    const handlePlaceBet = () => {
        if (!selectedCard) {
            Alert.alert('No Card Selected', 'Please select a card before placing bet');
            return;
        }
        Alert.alert(
            'Confirm Bet',
            `Place bet on ${selectedCard}?\nEntry Fee: ₹${entryFee}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const numVal = mapCardToNumber(selectedCard);
                            await apiService.placeBet(roundId, [numVal], entryFee);

                            navigation.replace('LiveGame', {
                                gameType: 'single',
                                roundId,
                                selectedCard,
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
            <LinearGradient colors={['#2E0002', '#0F0203']} style={styles.gradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="arrow-back" size={20} color="#FFA800" style={{ marginRight: 6 }} />
                        <Text style={styles.backButton}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Single Card Game</Text>
                    <View style={styles.coinBalance}>
                        <Text style={styles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    <View style={styles.infoBar}>
                        {[
                            { label: 'Timer', value: `${timer}s`, color: timer < 10 ? '#FF6B6B' : '#fff' },
                            { label: 'Slots', value: `${slotsOccupied}/5` },
                            { label: 'Reward', value: 'x10', color: '#FFA800' },
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
                        <Text style={styles.instruction}>Select Your Card</Text>

                        <View style={styles.cardsContainer}>
                            {cards.map((card, index) => {
                                const isSelected = selectedCard === card;
                                const suit = suits[index % 4];
                                const isRed = suit === '♥' || suit === '♦';
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.card, isSelected && styles.selectedCard,
                                        { width: CARD_SIZE, height: CARD_SIZE * 1.4 }]}
                                        onPress={() => setSelectedCard(card)}
                                        activeOpacity={0.7}
                                    >
                                        <LinearGradient
                                            colors={isSelected ? ['#5E0002', '#FFA800'] : ['#fff', '#f0f0f0']}
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

                    <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                        <LeaderboardScreen />
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={[styles.placeBetButton, !selectedCard && styles.disabledButton]}
                    onPress={handlePlaceBet}
                    disabled={!selectedCard}
                >
                    <LinearGradient
                        colors={selectedCard ? ['#FFA800', '#D97706'] : ['#555', '#333']}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.placeBetText}>
                            {selectedCard ? `PLACE BET ON ${selectedCard}` : 'SELECT A CARD'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </SafeAreaView>
    );
}