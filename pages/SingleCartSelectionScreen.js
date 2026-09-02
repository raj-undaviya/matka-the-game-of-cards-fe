import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    SafeAreaView, Alert, Dimensions, ScrollView,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { Ionicons } from '@expo/vector-icons';
import LeaderboardScreen from '../components/LeaderBoard';
import Svg, { Rect, Path, G, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 72) / 5; // 5 cards per row

const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const suits = ['♠', '♥', '♦', '♣'];

// Premium Casino Card Back Component
function PlayingCardBack({ width, height, style }) {
    // Generate mesh lines for the lattice pattern
    const meshLines = [];
    for (let i = -10; i < 20; i++) {
        meshLines.push(
            <React.Fragment key={i}>
                <Line x1={i * 12} y1={-10} x2={i * 12 + 80} y2={160} stroke="#A00000" strokeWidth={1.5} />
                <Line x1={i * 12} y1={160} x2={i * 12 + 80} y2={-10} stroke="#A00000" strokeWidth={1.5} />
            </React.Fragment>
        );
    }

    return (
        <View style={[{
            width,
            height,
            backgroundColor: '#ffffff',
            borderRadius: 10,
            padding: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        }, style]}>
            <View style={{ flex: 1, backgroundColor: '#8B0000', borderRadius: 7, overflow: 'hidden' }}>
                <Svg width="100%" height="100%" viewBox="0 0 100 145">
                    {/* Inner dash border */}
                    <Rect x="5" y="5" width="90" height="135" rx="5" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3, 3" />
                    {/* Inner gold border */}
                    <Rect x="8" y="8" width="84" height="129" rx="3" fill="none" stroke="#C59B27" strokeWidth="1" />
                    
                    {/* Grid mesh lattice */}
                    <G opacity={0.6}>
                        {meshLines}
                    </G>

                    {/* Central Gold/White Diamond Emblem */}
                    <G transform="translate(50, 72.5)">
                        <Path d="M 0 -22 L 18 0 L 0 22 L -18 0 Z" fill="#8B0000" stroke="#C59B27" strokeWidth="1.5" />
                        <Path d="M 0 -15 L 12 0 L 0 15 L -12 0 Z" fill="none" stroke="#ffffff" strokeWidth="1" />
                        <Path d="M 0 -7 L 6 0 L 0 7 L -6 0 Z" fill="#C59B27" />
                    </G>
                </Svg>
            </View>
        </View>
    );
}

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

    const getSelectedCardText = () => {
        if (!selectedCard) return 'None';
        const index = cards.indexOf(selectedCard);
        return `${selectedCard} ${suits[index % 4]}`;
    };

    return (
        <SafeAreaView style={localStyles.container}>
            {/* Header / Navbar */}
            <View style={localStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="arrow-back" size={20} color="#B22222" style={{ marginRight: 6 }} />
                    <Text style={localStyles.backButton}>Back</Text>
                </TouchableOpacity>
                <Text style={localStyles.headerTitle}>Single Card Game</Text>
                <View style={localStyles.coinBalance}>
                    <Text style={localStyles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
                </View>
            </View>

            {/* Info bar */}
            <View style={localStyles.infoBar}>
                {[
                    { label: 'Timer', value: `${timer}s`, color: timer < 10 ? '#FF6B6B' : '#2C1E15' },
                    { label: 'Slots', value: `${slotsOccupied}/5` },
                    { label: 'Reward', value: 'x10', color: '#C59B27' },
                ].map((item, i) => (
                    <View key={i} style={localStyles.infoItem}>
                        <Text style={localStyles.infoLabel}>{item.label}</Text>
                        <Text style={[localStyles.infoValue, { color: item.color || '#2C1E15' }]}>
                            {item.value}
                        </Text>
                    </View>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={localStyles.scrollContent}>
                {/* 1. Select Card Panel (White Card Layout) */}
                <View style={localStyles.selectionCard}>
                    <Text style={localStyles.panelTitle}>1. Select Your Card</Text>
                    <View style={localStyles.divider} />

                    <View style={localStyles.controlGroup}>
                        <Text style={localStyles.controlLabel}>Select Card (A-10 with Pre-assigned Suits)</Text>
                        
                        <View style={localStyles.cardsContainer}>
                            {cards.map((card, index) => {
                                const isSelected = selectedCard === card;
                                const suit = suits[index % 4];
                                const isRed = suit === '♥' || suit === '♦';
                                const cardColor = isRed ? '#B22222' : '#2C1E15';

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            localStyles.cardButton,
                                            { width: CARD_SIZE, height: CARD_SIZE * 1.35 },
                                            isSelected && localStyles.cardButtonActive
                                        ]}
                                        onPress={() => setSelectedCard(card)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            localStyles.cardButtonText,
                                            { color: isSelected ? '#FFFFFF' : cardColor, fontSize: 13 }
                                        ]}>
                                            {card} {suit}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={localStyles.controlGroup}>
                        <Text style={localStyles.betInputLabel}>Bet Amount (Coins)</Text>
                        <View style={localStyles.betInputWrap}>
                            <Text style={localStyles.betInputText}>{entryFee}</Text>
                            <Text style={localStyles.coinSuffix}>Coins</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Casino Felt Table Panel */}
                <View style={localStyles.casinoTable}>
                    <View style={localStyles.statusBanner}>
                        <Text style={localStyles.statusText}>WAITING FOR YOUR BET...</Text>
                    </View>

                    <View style={localStyles.drawZone}>
                        {/* Deck Stack */}
                        <View style={localStyles.deckContainer}>
                            <PlayingCardBack width={72} height={104} style={localStyles.deckCardBack1} />
                            <PlayingCardBack width={72} height={104} style={localStyles.deckCardBack2} />
                            <PlayingCardBack width={72} height={104} style={localStyles.deckCardBack3} />
                        </View>

                        {/* Reveal Slot */}
                        <View style={localStyles.slotContainer}>
                            <View style={localStyles.revealSlot}>
                                <Text style={localStyles.revealSlotText}>?</Text>
                            </View>
                            <Text style={localStyles.slotLabel}>REVEAL SLOT</Text>
                        </View>
                    </View>

                    <View style={localStyles.tableStatsBar}>
                        <Text style={localStyles.tableStatsText}>
                            Your Choice: <Text style={localStyles.tableStatsValue}>{getSelectedCardText()}</Text>
                        </Text>
                        <Text style={localStyles.tableStatsText}>
                            Virtual Balance: <Text style={localStyles.tableStatsValue}>{Number(balance).toLocaleString()} Coins</Text>
                        </Text>
                    </View>
                </View>

                {/* Leaderboard */}
                <View style={{ marginTop: 10 }}>
                    <LeaderboardScreen />
                </View>
            </ScrollView>

            {/* Bottom Action Button */}
            <TouchableOpacity
                style={[localStyles.actionButton, !selectedCard && localStyles.disabledButton, { margin: 16 }]}
                onPress={handlePlaceBet}
                disabled={!selectedCard}
            >
                <LinearGradient
                    colors={selectedCard ? ['#B22222', '#8B0000'] : ['#8D7B70', '#5C4E46']}
                    style={localStyles.actionButtonGradient}
                >
                    <Text style={localStyles.actionButtonText}>
                        {selectedCard ? `Lock Bet & Draw Card` : 'SELECT A CARD'}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F5F0', // Clean Cream/Alabaster
        paddingTop: 45,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(178, 34, 34, 0.1)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        color: '#B22222', // Firebrick Red
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C1E15', // Charcoal Brown
    },
    coinBalance: {
        backgroundColor: 'rgba(197, 155, 39, 0.15)', // Light gold/yellow background
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(197, 155, 39, 0.3)',
    },
    coinText: {
        color: '#C59B27', // Dark Gold
        fontWeight: 'bold',
        fontSize: 13,
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#EFEBE4', // Warm grey info bar
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        color: '#8D7B70', // text-dimmed
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    infoValue: {
        color: '#2C1E15',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    // The Select Card Panel (White Card Layout)
    selectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(178, 34, 34, 0.15)',
        shadowColor: '#8D7B70',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 20,
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C1E15',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(178, 34, 34, 0.15)',
        marginBottom: 16,
    },
    controlGroup: {
        marginBottom: 20,
    },
    controlLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8D7B70',
        marginBottom: 10,
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    // Card selector button styles
    cardButton: {
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(178, 34, 34, 0.2)',
        backgroundColor: '#FCFAF7',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    cardButtonActive: {
        backgroundColor: '#B22222', // Firebrick Red
        borderColor: '#B22222',
        shadowColor: '#B22222',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    cardButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    // Bet input mockup
    betInputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8D7B70',
        marginBottom: 8,
    },
    betInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FCFAF7',
        borderWidth: 1.5,
        borderColor: 'rgba(178, 34, 34, 0.25)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    betInputText: {
        flex: 1,
        color: '#B22222',
        fontSize: 16,
        fontWeight: 'bold',
    },
    coinSuffix: {
        color: '#B22222',
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    // Casino felt table styles
    casinoTable: {
        backgroundColor: '#0E3A2F', // Green Felt
        borderWidth: 6,
        borderColor: '#C59B27', // Gold felt border
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 20,
    },
    statusBanner: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    drawZone: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        marginVertical: 10,
    },
    deckContainer: {
        position: 'relative',
        width: 80,
        height: 120,
    },
    deckCardBack1: {
        position: 'absolute',
        top: 0,
        left: 0,
        transform: [{ rotate: '-3deg' }],
    },
    deckCardBack2: {
        position: 'absolute',
        top: -2,
        left: 4,
        transform: [{ rotate: '1deg' }],
    },
    deckCardBack3: {
        position: 'absolute',
        top: -4,
        left: 8,
        transform: [{ rotate: '4deg' }],
    },
    slotContainer: {
        alignItems: 'center',
    },
    revealSlot: {
        width: 72,
        height: 104,
        borderRadius: 10,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    revealSlotText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.2)',
    },
    slotLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 1,
    },
    tableStatsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 14,
        marginTop: 20,
    },
    tableStatsText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    tableStatsValue: {
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    
    // Actions
    actionButton: {
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#B22222',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    actionButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    disabledButton: {
        opacity: 0.5,
    },
});