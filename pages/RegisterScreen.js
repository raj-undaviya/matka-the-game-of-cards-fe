// pages/RegisterScreen.js
import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Image, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Ionicons } from '@expo/vector-icons';
import GlowingBadgeBackground from '../components/GlowingBadgeBackground';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { register, verifyEmailOTP, isLoading } = useContext(AuthContext);
  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all the details');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Invalid Password', 'Passwords do not match');
      return;
    }

    const result = await register(username, email, password, confirmPassword);
    if (result.success) {
      Alert.alert(
        'Onboarding Step',
        'We sent a verification code to your email. Please input it here.',
        [{ text: 'OK', onPress: () => setShowOtpScreen(true) }]
      );
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP');
      return;
    }
    setIsVerifying(true);
    const result = await verifyEmailOTP(email, otpCode);
    setIsVerifying(false);
    if (result.success) {
      Alert.alert(
        'Verified!',
        'Your email has been verified. You can now login!',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Verification Failed', result.error);
    }
  };

  const handleResendOTP = async () => {
    try {
      await apiService.resendOTP(email);
      Alert.alert('OTP Resent', 'A new OTP has been dispatched to your email.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to resend OTP');
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
          {/* Top-left absolute back button */}
          {!showOtpScreen && (
            <TouchableOpacity
              style={styles.absoluteBackButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF5C2" />
            </TouchableOpacity>
          )}
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

                {!showOtpScreen ? (
                  <>
                    <Text style={styles.cardHeaderTitle}>REGISTER NEW PLAYER</Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Username</Text>
                      <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Email Address</Text>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email"
                        placeholderTextColor="rgba(255,255,255,0.4)"
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
                          placeholder="Enter password (min 8 chars)"
                          placeholderTextColor="rgba(255,255,255,0.4)"
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
                            color="#FFF5C2"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={styles.passwordInput}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Re-enter password"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color="#FFF5C2"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {isLoading ? (
                      <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 20 }} />
                    ) : (
                      <TouchableOpacity style={styles.actionButton} onPress={handleRegister} activeOpacity={0.8}>
                        <LinearGradient
                          colors={['#AA820A', '#EBB828', '#FFF5C2', '#EBB828', '#AA820A']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.actionButtonText}>REGISTER PLAYER</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => navigation.navigate('Login')}
                      style={styles.loginLink}
                    >
                      <Text style={styles.loginText}>
                        Already have an account? <Text style={styles.loginTextGold}>Sign In</Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardHeaderTitle}>VERIFY EMAIL ADDRESS</Text>
                    <Text style={styles.otpDescription}>
                      Enter the 6-digit OTP code sent to:{"\n"}
                      <Text style={styles.otpEmailText}>{email}</Text>
                    </Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Verification Code</Text>
                      <TextInput
                        style={[styles.input, styles.otpInput]}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        placeholder="000000"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        maxLength={6}
                        textAlign="center"
                      />
                    </View>

                    {isVerifying ? (
                      <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 20 }} />
                    ) : (
                      <TouchableOpacity style={styles.actionButton} onPress={handleVerifyOTP} activeOpacity={0.8}>
                        <LinearGradient
                          colors={['#AA820A', '#EBB828', '#FFF5C2', '#EBB828', '#AA820A']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.actionButtonText}>VERIFY CODE</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={handleResendOTP} style={styles.resendLink}>
                      <Text style={styles.resendText}>Did not receive code? Resend OTP</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowOtpScreen(false)}
                      style={styles.backLink}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                        <Text style={styles.backLinkText}>Edit Registration Details</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}

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
    paddingTop: 12,
    paddingBottom: 126,
    justifyContent: 'flex-start',
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoOuterGear: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: '#EBB828',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  logoInnerStar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBB828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStarSymbol: { color: '#5E0004', fontSize: 16, fontWeight: 'bold' },
  logoTitle: {
    color: '#FFF5C2',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  outerBoardFrame: {
    borderWidth: 3,
    borderColor: '#D4AF37',
    borderRadius: 12,
    backgroundColor: '#0F0F0F',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  innerCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#121212',
  },
  cardHeaderTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#FFF5C2',
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
    borderRadius: 8,
    color: '#FFD700',
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
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    color: '#FFD700',
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeIcon: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    letterSpacing: 10,
    fontSize: 22,
    fontWeight: 'bold',
  },
  otpDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpEmailText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  actionButton: {
    borderRadius: 8,
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
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#5E0004',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  loginTextGold: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  resendLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#06B6D4',
    fontWeight: '600',
    fontSize: 13,
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 5,
  },
  backLinkText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  absoluteBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 32),
    left: 20,
    zIndex: 10,
    padding: 8,
  },
});
