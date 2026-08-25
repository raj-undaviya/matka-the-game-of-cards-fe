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

const gameVariations = [
  {
    id: 1,
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
    name: 'LUCKLY DRAW JACCPOT',
    subTitle: 'ENTRY FEES.🪙100',
    rewards: '23x',
    poolValue: '🪙805',
  
    bgColors: ['#1C1C1C', '#000000'],
    sphereColors: ['#7C3AED', '#5B21B6', '#3B0764'],
    rewardLabel: '80x',
  },
];

const getMedalImage = (id) => {
  switch (id) {
    case 1:
      return require('../assets/images/medal_single.png');
    case 5:
      return require('../assets/images/medal_pair.png');
    case 2:
      return require('../assets/images/medal_trio.png');
    case 3:
      return require('../assets/images/medal_sum.png');
    case 4:
      return require('../assets/images/medal_jackpot.png');
    default:
      return require('../assets/images/medal_single.png');
  }
};

const AwardMedal = ({ game }) => {
  return (
    <View style={homeScreenStyles.medalCardOuterFrame}>
      <View style={homeScreenStyles.medalCardContainer}>

        {/* Radiating Background Rays Line Effects */}
        <View style={homeScreenStyles.sunburstContainer}>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => (
            <View key={idx} style={[homeScreenStyles.sunburstRay, { transform: [{ rotate: `${deg}deg` }] }]} />
          ))}
        </View>

        {/* Premium generated badge image for specific multiplier */}
        <Image
          source={getMedalImage(game.id)}
          style={homeScreenStyles.badgeImage}
          resizeMode="contain"
        />

      </View>
    </View>
  );
};

const PremiumHeader = ({ title = 'WIRA SLOT', badgeValue = '3', onBadgePress, onHelpPress }) => {
  return (
    <View style={homeScreenStyles.headerWrapper}>
      {/* Background Deep Maroon Gradient */}
      <LinearGradient
        colors={['#2E0002', '#4B0002', '#6E0003']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={homeScreenStyles.headerGradient}
      >
        {/* Slightly brighter red-orange glow beam rising from bottom-center */}
        
        {/* Scattered small star/sparkle particles (low opacity) */}
        <View style={[homeScreenStyles.headerSparkle, { top: 8, left: '14%', opacity: 0.12 }]}><Text style={homeScreenStyles.sparkleChar}>★</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 32, left: '24%', opacity: 0.18 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 12, left: '44%', opacity: 0.1 }]}><Text style={homeScreenStyles.sparkleChar}>★</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 28, right: '34%', opacity: 0.15 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 10, right: '18%', opacity: 0.12 }]}><Text style={homeScreenStyles.sparkleChar}>★</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 38, right: '8%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { top: 8, right: '6%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        <View style={[homeScreenStyles.headerSparkle, { bottom: 38, right: '4%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
         <View style={[homeScreenStyles.headerSparkle,{ top: 60, right: '45%', opacity: 0.2 }]}><Text style={homeScreenStyles.sparkleChar}>✦</Text></View>
        {/* Main Content Layout */}
        <View style={homeScreenStyles.headerContent}>

          {/* Left Side: Circular gold-bordered play badge */}
          <TouchableOpacity
            onPress={onHelpPress}
            activeOpacity={0.85}
            style={homeScreenStyles.leftBadgeGear}
          >
            <View style={homeScreenStyles.leftBadgeInner}>
              <Ionicons name="play" size={12} color="#FFD700" />
            </View>
          </TouchableOpacity>

          {/* Centered Title */}
          <View style={homeScreenStyles.headerTitleContainer} pointerEvents="none">
            <Text style={homeScreenStyles.headerTitleText}>{title.toUpperCase()}</Text>
          </View>

          {/* Right Side: Circular gold-bordered wallet badge with value */}
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

      {/* Bottom edge: glowing curved gold-orange line with mask */}
      <View style={homeScreenStyles.headerBottomCurveContainer} pointerEvents="none">
        {/* Glow Line Ellipse */}
        <LinearGradient
          colors={['rgba(218, 165, 32, 0)', 'rgba(255, 120, 0, 1)', 'rgba(255, 215, 0, 1)', 'rgba(255, 120, 0, 1)', 'rgba(218, 165, 32, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={homeScreenStyles.headerBottomCurveLine}
        />
        {/* Cover Ellipse */}
        <View style={homeScreenStyles.headerBottomCurveCover} />
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { logout } = useContext(AuthContext);
  const [balance, setBalance] = useState(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      apiService.getWalletBalance()
        .then(res => setBalance(res.balance))
        .catch(err => console.log('Error fetching balance:', err));
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
                {gameVariations.map((game) => (
                  <DarkPanelBackground key={game.id} style={homeScreenStyles.cardOuter}>
                    {/* Card click routes to ContestPool with gameId parameter */}
                    <TouchableOpacity
                      style={homeScreenStyles.cardTouchRow}
                      onPress={() => navigation.navigate('ContestPool', { gameId: game.id })}
                      activeOpacity={0.8}
                    >

                      {/* Left: Medal Block */}
                      <AwardMedal game={game} />

                      {/* Right: Game Info */}
                      <View style={homeScreenStyles.infoSection}>
                        <View style={homeScreenStyles.titleRow}>
                          <View>
                            <Text style={homeScreenStyles.gameName}>{game.name}</Text>
                            <Text style={homeScreenStyles.gameSubTitle}>{game.subTitle}</Text>
                          </View>
                          
                        </View>

                        <View style={homeScreenStyles.detailsRow}>
                          <Text style={homeScreenStyles.detailsTextLeft}>
                            REWARDS | <Text style={homeScreenStyles.goldMultiplierText}>{game.rewards}</Text>
                          </Text>
                          <Text style={homeScreenStyles.detailsTextRight}>
                            {game.poolValue}
                          </Text>
                        </View>

                        <View style={homeScreenStyles.footerRow}>
                          <Text style={homeScreenStyles.footerTextLeft}>{game.codeLeft}</Text>
                          <Text style={homeScreenStyles.footerTextRight}>{game.codeRight}</Text>
                        </View>
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