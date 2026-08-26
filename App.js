import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './context/AuthContext';

// ─── Screens Import ───────────────────────────────────────────────────────────
import SplashScreen from './pages/SplashScreen';
import HomeScreen from './pages/HomeScreen';
import ContestPoolScreen from './pages/ContestPoolScreen';
import HowToPlayScreen from './pages/HowToPlayScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import VerifyOTPScreen from './pages/VerifyOTPScreen';

// 👇 ADD THESE NEW IMPORTS
import SingleCardGameScreen from './pages/SingleCartSelectionScreen'; // Single Card game mode
import PairSelectionGameScreen from './pages/PairSelectionScreen'; // Pair Selection game mode
import TrioGameScreen from './pages/TrioGameScreen'; // Trio Game mode
import LastDigitSumGameScreen from './pages/LastdigitSumScreen'; // Last Digit Sum mode
import LuckyDrawJackpotScreen from './pages/JackpotScreen'; // Lucky Draw Jackpot mode
import LiveGameScreen from './pages/LiveGameScreen'; // Live round screen
import WinningScreen from './pages/WinningScreen'; // Win/Loss result screen
import WalletScreen from './pages/WalletScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}>
          {/* ── Existing Screens ── */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ContestPool" component={ContestPoolScreen} />
          <Stack.Screen name="Howtoplay" component={HowToPlayScreen} />

          {/* ── 👇 ADD THESE NEW ROUTES ── */}
          <Stack.Screen name="SingleCard" component={SingleCardGameScreen} />
          <Stack.Screen
            name="PairSelection"
            component={PairSelectionGameScreen}
          />
          <Stack.Screen name="TrioGame" component={TrioGameScreen} />
          <Stack.Screen
            name="LastDigitSum"
            component={LastDigitSumGameScreen}
          />
          <Stack.Screen name="LuckyDraw" component={LuckyDrawJackpotScreen} />
          <Stack.Screen name="LiveGame" component={LiveGameScreen} />
          <Stack.Screen name="Winning" component={WinningScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
