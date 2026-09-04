// pages/HomeScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { homeScreenStyles } from '../styles/GlobalStyle';
import DarkPanelBackground from '../components/DarkPanelBackground';

const defaultGameVariations = [
  {
    id: 1,
    variation: 'V1',
    name: 'SINGLE CARD GAME',
    subTitle: 'ENTRY FEES.🪙100',
    rewards: '30x',
    poolValue: '🪙2,109',
    bgColors: ['#1C1C1C', '#000000'],
    sphereColors: ['#FF3B30', '#C20005', '#5E0002'],
    rewardLabel: '10x',
  },
  {
    id: 5,
    variation: 'V2',
    name: 'PAIR SELECTION',
    subTitle: 'ENTRY FEES.🪙100',
    rewards: '20x',
    poolValue: '🪙2,105',
    bgColors: ['#1C1C1C', '#000000'],
    sphereColors: ['#06B6D4', '#0891B2', '#003d4d'],
    rewardLabel: '20x',
  },
  {
    id: 2,
    variation: 'V3',
    name: 'TRIO GAME TION AU',
    subTitle: 'ENTRY FEES.🪙100',
    rewards: '32x',
    poolValue: '🪙2,105',
    bgColors: ['#1C1C1C', '#000000'],
    sphereColors: ['#2EA043', '#16752E', '#093D15'],
    rewardLabel: '50x',
  },
  {
    id: 3,
    variation: 'V4',
    name: 'LAST DIGIT SUM',
    subTitle: 'ENTRY FEES.🪙100',
    rewards: '33x',
    poolValue: '🪙875',
    bgColors: ['#1C1C1C', '#000000'],
    sphereColors: ['#FF3B30', '#C20005', '#5E0002'],
    rewardLabel: '80x',
  },
  {
    id: 4,
    variation: 'V5',
    name: 'LUCKLY DRAW JACCPOT',
    subTitle: 'ENTRY FEES.🪙100',
    rewards: '23x',
    poolValue: '🪙805',
    bgColors: ['#1C1C1C', '#000000'],
    sphereColors: ['#7C3AED', '#5B21B6', '#3B0764'],
    rewardLabel: '80x',
  },
];

const getMedalImage = (id, variation, imageUrl) => {
  const img = (imageUrl || '').toLowerCase();
  if (img.includes('pair') || variation === 'V2' || id === 5) return require('../assets/images/medal_pair.png');
  if (img.includes('trio') || variation === 'V3' || id === 2) return require('../assets/images/medal_trio.png');
  if (img.includes('sum') || variation === 'V4' || id === 3) return require('../assets/images/medal_sum.png');
  if (img.includes('jackpot') || variation === 'V5' || id === 4) return require('../assets/images/medal_jackpot.png');
  return require('../assets/images/medal_single.png');
};

const AwardMedal = ({ game }) => {
  const imgUrl = game.imageUrl || game.image_url || '';
  const isNetworkImage = imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:');

  return (
    <View style={homeScreenStyles.medalCardOuterFrame}>
      <View style={homeScreenStyles.medalCardContainer}>

        {/* Radiating Background Rays Line Effects */}
        <View style={homeScreenStyles.sunburstContainer}>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => (
            <View key={idx} style={[homeScreenStyles.sunburstRay, { transform: [{ rotate: `${deg}deg` }] }]} />
          ))}
        </View>

        {/* Dynamic Image from remote URL or local medal asset */}
        {isNetworkImage ? (
          <Image
            source={{ uri: imgUrl }}
            style={homeScreenStyles.badgeImage}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={getMedalImage(game.id, game.variation, imgUrl)}
            style={homeScreenStyles.badgeImage}
            resizeMode="contain"
          />
        )}

      </View>
    </View>
  );
};

const PremiumHeader = ({ title = 'WIRA SLOT', badgeValue = '3', onBadgePress, onHelpPress }) => {
  return (
    <View style={homeScreenStyles.headerWrapper}>
      <LinearGradient
        colors={['#2E0002', '#4B0002', '#6E0003']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={homeScreenStyles.headerGradient}
      >
        <View style={[homeScreenStyles.headerSparkle, { top: 8, left: '14%', opacity: 0.12 }]}><Text style={homeScreenStyles.sparkleChar}>★</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 32, left: '24%', opacity: 0.18 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 12, left: '44%', opacity: 0.1 }]}><Text style={homeScreenStyles.sparkleChar}>★</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 28, right: '34%', opacity: 0.15 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 10, right: '18%', opacity: 0.12 }]}><Text style={homeScreenStyles.sparkleChar}>★</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 38, right: '8%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 8, right: '6%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { bottom: 38, right: '4%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 60, right: '45%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>

        <View style={homeScreenStyles.headerContent}>
          <TouchableOpacity
            onPress={onHelpPress}
            activeOpacity={0.85}
            style={homeScreenStyles.leftBadgeGear}
          >
            <View style={homeScreenStyles.leftBadgeInner}>
              <Ionicons name="play" size={12} color="#FFD700" />
            </View>
          </TouchableOpacity>

          <View style={homeScreenStyles.headerTitleContainer} pointerEvents="none">
            <Text style={homeScreenStyles.headerTitleText}>{title.toUpperCase()}</Text>
          </View>

          <TouchableOpacity
            onPress={onBadgePress}
            activeOpacity={0.85}
            style={homeScreenStyles.rightBadgeContainer}
          >
            <View style={homeScreenStyles.rightBadgeIconCircle}>
              <MaterialCommunityIcons name="wallet-outline" size={12} color="#FFD700" />
            </View>
            <Text style={homeScreenStyles.rightBadgeText}>{badgeValue}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={homeScreenStyles.headerBottomCurveContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(218, 165, 32, 0)', 'rgba(255, 120, 0, 1)', 'rgba(255, 215, 0, 1)', 'rgba(255, 120, 0, 1)', 'rgba(218, 165, 32, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={homeScreenStyles.headerBottomCurveLine}
        />
        <View style={homeScreenStyles.headerBottomCurveCover} />
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const [games, setGames] = useState(defaultGameVariations);
  const isFocused = useIsFocused();

  // Helper mapping variation to standard screen ID
  const mapVariationToId = (variation, currentId) => {
    if (variation === 'V1') return 1;
    if (variation === 'V2') return 5;
    if (variation === 'V3') return 2;
    if (variation === 'V4') return 3;
    if (variation === 'V5') return 4;
    return currentId || 1;
  };

  useEffect(() => {
    if (isFocused) {
      // 1. Fetch balance
      apiService.getWalletBalance()
        .then(res => setBalance(res.balance))
        .catch(err => console.log('Error fetching balance:', err));

      // 2. Fetch dynamic games list from backend
      apiService.getGames()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((g) => ({
              id: mapVariationToId(g.variation, g.id),
              dbId: g.id,
              variation: g.variation,
              name: g.name,
              subTitle: g.sub_title || g.subtitle || 'ENTRY FEES.🪙100',
              rewards: g.rewards || '10x',
              poolValue: g.pool_value || g.poolValue || '🪙1,000',
              imageUrl: g.image_url || g.imageUrl || '',
              description: g.description || '',
              rewardLabel: g.reward_label || '10x',
            }));
            setGames(formatted);
          }
        })
        .catch((err) => {
          console.log('Error loading dynamic games, using defaults:', err);
        });
    }
  }, [isFocused]);

  const handleExit = () => {
    Alert.alert(
      'Sign Out',
      'Do you want to log out from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out', onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    <View style={homeScreenStyles.container}>
      <SafeAreaView style={homeScreenStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* Header Container bar */}
        <PremiumHeader
          title="WIRASLOT"
          badgeValue={Number(balance).toLocaleString()}
          onBadgePress={() => navigation.navigate('Wallet')}
          onHelpPress={() => navigation.navigate('Howtoplay')}
        />

        {/* Main Container Dashboard Panel */}
        <View style={homeScreenStyles.body}>
          <View style={homeScreenStyles.outerBoardFrame}>
            <View style={homeScreenStyles.innerBoardFrame}>

              {/* Inner Header Label Section */}
              <View style={homeScreenStyles.boardHeaderRow}>
                <View style={homeScreenStyles.boardHeaderLeftGroup}>
                  <FontAwesome name="star" size={10} color="#DAA520" />
                  <FontAwesome name="star" size={10} color="#DAA520" />
                </View>
                <Text style={homeScreenStyles.boardHeaderTitle}>SELECT A GAME MODE</Text>
                <View style={homeScreenStyles.boardHeaderRightGroup}>
                  <FontAwesome name="star" size={10} color="#DAA520" />
                  <FontAwesome name="star" size={10} color="#DAA520" />
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={homeScreenStyles.scrollContent}>
                {games.map((game) => (
                  <DarkPanelBackground key={`${game.id}-${game.variation}-${game.name}`} style={homeScreenStyles.cardOuter}>
                    {/* Card click routes to ContestPool with dynamic game details */}
                    <TouchableOpacity
                      style={homeScreenStyles.cardTouchRow}
                      onPress={() => navigation.navigate('ContestPool', {
                        gameId: game.id,
                        gameVariation: game.variation,
                        gameName: game.name,
                        gameReward: game.rewards,
                      })}
                      activeOpacity={0.8}
                    >

                      {/* Left: Medal / Image Block */}
                      <AwardMedal game={game} />

                      {/* Right: Game Info */}
                      <View style={homeScreenStyles.infoSection}>
                        <View style={homeScreenStyles.titleRow}>
                          <Text style={homeScreenStyles.gameName}>{game.name}</Text>
                        </View>

                        {game.description ? (
                          <View style={{ marginTop: 4 }}>
                            <Text numberOfLines={2} style={{ color: '#B0B0B0', fontSize: 11, fontWeight: '500', lineHeight: 15 }}>
                              {game.description}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                    </TouchableOpacity>
                  </DarkPanelBackground>
                ))}
              </ScrollView>

            </View>
          </View>
        </View>

        {/* Exit Tab overlaying bottom border */}
        <View style={homeScreenStyles.bottomTab}>
          <TouchableOpacity onPress={handleExit} style={homeScreenStyles.closeButton}>
            <Ionicons name="close" size={16} color="#000000" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;