// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiService, setAuthToken, setAuthTokens, setOnTokenUpdate } from '../services/apiService';

// Defensive check to avoid crash if AsyncStorage is not yet installed
let storage;
try {
  storage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('AsyncStorage is not installed. Sessions will not persist across app restarts.');
  storage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
}

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync token to apiService and AsyncStorage
  const updateTokens = async (newAccess, newRefresh = null) => {
    setTokenState(newAccess);
    if (newRefresh) {
      setRefreshTokenState(newRefresh);
    }
    setAuthTokens(newAccess, newRefresh);

    if (newAccess) {
      await storage.setItem('jwt_token', newAccess);
      if (newRefresh) {
        await storage.setItem('jwt_refresh_token', newRefresh);
      }
    } else {
      await storage.removeItem('jwt_token');
      await storage.removeItem('jwt_refresh_token');
      setUser(null);
      setRefreshTokenState(null);
    }
  };

  // Listen for background auto-refreshes from backend responses
  useEffect(() => {
    setOnTokenUpdate(async (newAccess, newRefresh) => {
      setTokenState(newAccess);
      if (newRefresh) setRefreshTokenState(newRefresh);
      if (newAccess) await storage.setItem('jwt_token', newAccess);
      if (newRefresh) await storage.setItem('jwt_refresh_token', newRefresh);
    });
  }, []);

  // Attempt auto-login on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await storage.getItem('jwt_token');
        const storedRefresh = await storage.getItem('jwt_refresh_token');

        if (storedToken || storedRefresh) {
          setTokenState(storedToken);
          setRefreshTokenState(storedRefresh);
          setAuthTokens(storedToken, storedRefresh);

          // Verify token and fetch profile
          const profile = await apiService.getProfile();
          setUser(profile);
        }
      } catch (e) {
        console.log('Auto-login bootstrap failed:', e);
        // Clean up invalid tokens
        await updateTokens(null, null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);

      // If email is not verified, redirect to OTP verification flow
      if (response && response.is_email_verified === false) {
        return {
          success: false,
          isEmailVerified: false,
          email: response.email || email,
          message: response.message || 'Email not verified. OTP has been sent.'
        };
      }

      // Response returns { message: "Login successful", data: { id, email, token, refresh_token, ... } }
      const userProfile = response.data;
      const userToken = userProfile ? (userProfile.token || userProfile.access_token || userProfile.access) : null;
      const userRefreshToken = userProfile ? (userProfile.refresh_token || userProfile.refresh) : null;

      if (!userToken && !userRefreshToken) {
        throw new Error('Invalid response from server');
      }

      setUser(userProfile);
      await updateTokens(userToken, userRefreshToken);
      return { success: true };
    } catch (error) {
      console.log('Login failed:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password, confirmPassword, termsAccepted) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(username, email, password, confirmPassword, termsAccepted);
      return { success: true, message: response.message, user: response.user };
    } catch (error) {
      console.log('Registration failed:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailOTP = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyOTP(email, otp);
      return { success: true, message: response.message };
    } catch (error) {
      console.log('OTP Verification failed:', error);
      return { success: false, error: error.message || 'Verification failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await updateTokens(null, null);
    } catch (e) {
      console.log('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        login,
        register,
        verifyEmailOTP,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Custom Hook ────────────────────────────────────────────────────────────
// Lets any screen do: const { user, login, logout } = useAuth();
// instead of manually importing useContext + AuthContext every time.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};