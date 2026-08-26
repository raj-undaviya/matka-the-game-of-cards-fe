// pages/LoginScreen.js
import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Image, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import GlowingBadgeBackground from '../components/GlowingBadgeBackground';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password');
      return;
    }
    const result = await login(email, password);
    if (!result.success) {
      if (result.isEmailVerified === false) {
        Alert.alert(
          'Email Verification Required',
          result.message || 'Please verify your email to continue.',
          [
            {
              text: 'Verify Now',
              onPress: () => {
                navigation.navigate('VerifyOTP', { email: result.email || email });
              }
            }
          ]
        );
      } else {
        Alert.alert('Authentication Failed', result.error);
      }
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/login_screen_background_img.png')}
      style={[StyleSheet.absoluteFillObject, { flex: 1 }]}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <GlowingBadgeBackground>
                <Image
                  source={require('../assets/images/matka_logo.png')}
                  style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden' }}
                  resizeMode="cover"
                />
              </GlowingBadgeBackground>
            </View>

            {/* Input Board Card */}
            <View style={styles.outerBoardFrame}>
              <View style={styles.innerCard}>
                <Text style={styles.cardHeaderTitle}>SIGN IN TO ARENA</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email"
                    placeholderTextColor="gray"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="gray"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#FFD700"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#AA820A', '#EBB828', '#FFF5C2', '#EBB828', '#AA820A']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.loginButtonText}>LOGIN</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  style={styles.signupLink}
                >
                  <Text style={styles.signupText}>
                    Don't have an account? <Text style={styles.signupTextGold}>Register Here</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    justifyContent: 'center',
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
    // Bright golden shadow effect
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 10,
  },
  logoOuterGear: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#EBB828',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  logoInnerStar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EBB828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStarSymbol: { color: '#5E0004', fontSize: 20, fontWeight: 'bold' },
  logoTitle: {
    color: '#FFF5C2',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  logoSubtitle: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 2,
  },
  outerBoardFrame: {
    borderWidth: 3,
    borderColor: '#D4AF37',
    borderRadius: 10, // Form has 10px border radius
    backgroundColor: '#000000', // Form background color should be black
    padding: 6,
    // Bright golden shadow effect
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 20,
    elevation: 12,
  },
  innerCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: 8, // inner frame fits inside outer form
    padding: 20,
    backgroundColor: '#000000', // Form background color should be black
  },
  cardHeaderTitle: {
    color: '#FFD700', // Font color should be golden
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    color: '#FFD700', // Font color should be golden
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 10,
    color: '#FFD700', // Font color should be golden
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    color: '#FFD700', // Font color should be golden
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeIcon: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    borderRadius: 10, // Capsule shape
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: '#FFF5C2', // Light gold border
    // Golden glow shadow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10, // 25 minus border width
  },
  loginButtonText: {
    color: '#5E0004',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  signupTextGold: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
