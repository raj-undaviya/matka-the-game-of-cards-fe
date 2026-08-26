// pages/VerifyOTPScreen.js
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
import { apiService } from '../services/apiService';
import GlowingBadgeBackground from '../components/GlowingBadgeBackground';

export default function VerifyOTPScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyEmailOTP } = useContext(AuthContext);

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
          <TouchableOpacity
            style={styles.absoluteBackButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF5C2" />
          </TouchableOpacity>

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
                <Text style={styles.cardHeaderTitle}>VERIFY EMAIL ADDRESS</Text>
                <Text style={styles.otpDescription}>
                  Enter the 6-digit OTP code sent to:{"\n"}
                  <Text style={styles.otpEmailText}>{email || 'your email'}</Text>
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
    borderColor: '#FFF5C2',
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
  resendLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#06B6D4',
    fontWeight: '600',
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
