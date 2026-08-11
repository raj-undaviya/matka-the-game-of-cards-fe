import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { howToPlayStyles as styles } from '../styles/GlobalStyle';

const steps = [
  {
    number: '1',
    title: 'Choose a Game',
    desc: 'Select any available game variation from the lobby.',
    cards: ['A♦', '5♥', '10♣'],
  },
  {
    number: '2',
    title: 'Place Your Bet',
    desc: 'Pay the entry fee and join the game before the timer ends.',
    cards: ['2♣', '6♥', '9♦'],
  },
  {
    number: '3',
    title: 'Select Your Number',
    desc: 'Choose your lucky number, pair, or trio based on the selected game.',
    cards: ['3♦', '7♣', 'A♥'],
  },
  {
    number: '4',
    title: 'Wait for the Draw',
    desc: 'Once all slots are filled or the timer ends, the draw starts automatically.',
    cards: ['4♠', '8♦', '10♥'],
  },
  {
    number: '5',
    title: 'Check the Result',
    desc: 'Random cards are revealed and matched with your selected numbers.',
    cards: ['A♣', '5♦', '7♥'],
  },
  {
    number: '6',
    title: 'Win Rewards',
    desc: 'Matching players receive rewards based on the selected game variation.',
    cards: ['2♥', '9♠', '10♦'],
  },
  {
    number: '7',
    title: 'Single Card Game',
    desc: 'Pick one number. If it matches the draw, win 10× your entry fee.',
    cards: ['6♦', 'A♠', '4♣'],
  },
  {
    number: '8',
    title: 'Pair Selection',
    desc: 'Choose any two cards. Both must match the two revealed cards to win.',
    cards: ['3♣', '3♥', '8♦'],
  },
  {
    number: '9',
    title: 'Trio Game',
    desc: 'Select three cards. Triple matches earn the highest rewards.',
    cards: ['7♠', '7♦', '7♥'],
  },
  {
    number: '10',
    title: 'Lucky Sum Game',
    desc: 'Three cards are added together. The last digit decides the winner.',
    cards: ['1♦', '2♣', '9♥'],
  },
  {
    number: '11',
    title: 'Jackpot Draw',
    desc: 'Choose one number and any bid amount for a chance to win the entire prize pool.',
    cards: ['A♦', '10♠', '5♣'],
  },
  {
    number: '12',
    title: 'Fair Play',
    desc: 'All draws are random and rewards are credited automatically to your wallet.',
    cards: ['8♣', '4♥', 'A♦'],
  },
];
const MockCards = ({ cards }) => {
  return (
    <View style={styles.mockCardsWrap}>
      {cards.map((c, i) => {
        const value = c.slice(0, -1);
        const suit = c.slice(-1);
        const isRed = suit === '♥' || suit === '♦';
        const rotate = i === 0 ? '-12deg' : i === 2 ? '12deg' : '0deg';
        const translateX = i === 0 ? -7 : i === 2 ? 7 : 0;
        const translateY = i === 1 ? -3 : 0;

        return (
          <View
            key={i}
            style={[
              styles.miniCard,
              {
                transform: [{ rotate }, { translateX }, { translateY }],
                zIndex: i === 1 ? 5 : 1,
              }
            ]}
          >
            <Text style={[styles.miniCardValue, { color: isRed ? '#cc0000' : '#111' }]}>{value}</Text>
            <Text style={[styles.miniCardSuit, { color: isRed ? '#cc0000' : '#111' }]}>{suit}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function HowToPlayScreen({ navigation }) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Fetch user wallet balance
    apiService.getWalletBalance()
      .then(res => setBalance(res.balance))
      .catch(err => console.log('Error fetching balance:', err));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E0002" />
      <LinearGradient colors={['#2E0002', '#0F0203']} style={styles.gradient}>
        
        {/* Header Row */}
        <View style={styles.header}>
          {/* Left: circular back button with gold border */}
          <TouchableOpacity
            style={styles.circularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFD700" />
          </TouchableOpacity>

          {/* Right side group: Wallet balance pill & circular close button */}
          <View style={styles.balanceContainer}>
            <View style={styles.balancePill}>
              <Text style={styles.balanceLabel}>
                COINS <Text style={styles.balanceText}>{Number(balance).toLocaleString()}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.circularBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll/Papyrus Layout Container */}
        <View style={styles.scrollArea}>
          
          {/* Top 3D Cylinder Roller */}
          <LinearGradient
            colors={['#AA7E2D', '#FFECA6', '#F9E1A3', '#AA7E2D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.scrollRollerTop}
          >
            {/* Left and Right Gold caps */}
            <View style={styles.rollerCapLeft} />
            <View style={styles.rollerCapRight} />
          </LinearGradient>

          {/* Papyrus Scroll Body (Sheet) */}
          <View style={styles.parchmentSheet}>
            
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.title}>HOW TO PLAY</Text>

              {/* Step cards list inside scroll */}
              {steps.map((step, index) => (
                <View key={index} style={styles.stepCard}>
                  {/* Step index badge circle */}
                  <View style={styles.stepRankCircle}>
                    <Text style={styles.stepRankText}>{step.number}</Text>
                  </View>

                  {/* Icon / Card Illustration */}
                  <View style={styles.stepIllustrationContainer}>
                    {step.cards ? (
                      <MockCards cards={step.cards} />
                    ) : (
                      <Text style={styles.stepIllustrationText}>{step.avatar}</Text>
                    )}
                  </View>

                  {/* Title & description */}
                  <View style={styles.stepTextCol}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}

              {/* Tack Now Gold Pill Button */}
              <TouchableOpacity
                style={styles.goldButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FFF2B2', '#EAB237', '#B57C0A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.goldButtonGradient}
                >
                  <Text style={styles.goldButtonText}>Play Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>az

          {/* Bottom 3D Cylinder Roller */}
          <LinearGradient
            colors={['#AA7E2D', '#FFECA6', '#F9E1A3', '#AA7E2D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.scrollRollerBottom}
          >
            {/* Left and Right Gold caps */}
            <View style={styles.rollerCapLeft} />
            <View style={styles.rollerCapRight} />
          </LinearGradient>

        </View>

      </LinearGradient>
    </SafeAreaView>
  );
}