// services/apiService.js
import { Platform } from "react-native";
// Change this URL to matches your local network IP if testing on physical devices (e.g. 'http://192.168.1.X:8000/api')
// For Android Emulators use: 'http://10.0.2.2:8000/api'
// export const API_BASE_URL = 'https://matka-the-game-of-cards-be.vercel.app/api';
export const API_BASE_URL =
  Platform.OS === "android"
    ? "http://192.168.1.8:8000/api"
    : "https://backend.matka-game.binaries.org.in/api";

let authToken = null;
let refreshToken = null;
let onTokenUpdateCallback = null;

export const setAuthToken = (token, refresh = null) => {
  authToken = token;
  if (refresh) refreshToken = refresh;
};

export const setAuthTokens = (token, refresh = null) => {
  authToken = token;
  if (refresh) refreshToken = refresh;
};

export const setOnTokenUpdate = (callback) => {
  onTokenUpdateCallback = callback;
};

const getHeaders = (extraHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  if (refreshToken) {
    headers["X-Refresh-Token"] = refreshToken;
  }
  return headers;
};

const handleResponse = async (response) => {
  // Capture auto-refreshed tokens from backend response headers if present
  try {
    const newAccess = response.headers?.get?.("x-access-token") || response.headers?.get?.("X-Access-Token");
    const newRefresh = response.headers?.get?.("x-refresh-token") || response.headers?.get?.("X-Refresh-Token");
    if (newAccess) {
      authToken = newAccess;
      if (newRefresh) refreshToken = newRefresh;
      if (onTokenUpdateCallback) {
        onTokenUpdateCallback(newAccess, newRefresh || refreshToken);
      }
    }
  } catch (e) {
    // Ignore header inspection errors
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      data.message || data.error || data.detail || JSON.stringify(data) || "Request failed";
    throw new Error(errorMsg);
  }
  return data;
};

export const apiService = {
  // ── Authentication APIs ──
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  register: async (username, email, password, confirmPassword, termsAccepted) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        username,
        email,
        password,
        password2: confirmPassword,
        termsAccepted,
      }),
    });
    return handleResponse(response);
  },

  verifyOTP: async (email, otp) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(response);
  },

  resendOTP: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/otp/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ── Game APIs ──
  getGames: async () => {
    const response = await fetch(`${API_BASE_URL}/game/games/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPools: async (variation) => {
    const url = variation
      ? `${API_BASE_URL}/game/pools/?variation=${variation}`
      : `${API_BASE_URL}/game/pools/`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getRounds: async (variation) => {
    const url = variation
      ? `${API_BASE_URL}/game/rounds/?variation=${variation}`
      : `${API_BASE_URL}/game/rounds/`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getRoundDetail: async (roundId) => {
    const response = await fetch(`${API_BASE_URL}/game/rounds/${roundId}/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  placeBet: async (roundId, selectedNumbers, entryFee) => {
    const response = await fetch(`${API_BASE_URL}/game/bets/place/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        round_id: roundId,
        selected_numbers: selectedNumbers,
        entry_fee: entryFee,
      }),
    });
    return handleResponse(response);
  },

  joinPool: async (poolId) => {
    const response = await fetch(`${API_BASE_URL}/game/pools/${poolId}/join/`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPoolLeaderboard: async (poolId) => {
    const response = await fetch(`${API_BASE_URL}/game/pools/${poolId}/leaderboard/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getMyBets: async () => {
    const response = await fetch(`${API_BASE_URL}/game/bets/my/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ── Wallet APIs ──
  getWalletBalance: async () => {
    const response = await fetch(`${API_BASE_URL}/wallet/balance/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  initDeposit: async (amount, provider = "razorpay") => {
    const response = await fetch(`${API_BASE_URL}/wallet/deposit/init/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ amount: Number(amount), provider }),
    });
    return handleResponse(response);
  },

  verifyDeposit: async (verificationPayload = {}) => {
    const response = await fetch(`${API_BASE_URL}/wallet/deposit/verify/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(verificationPayload),
    });
    return handleResponse(response);
  },

  requestWithdrawal: async (amount, details = {}) => {
    const response = await fetch(`${API_BASE_URL}/wallet/withdraw/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        amount: Number(amount),
        mode: details.mode || "upi",
        upi_id: details.upiId || "",
        account_number: details.accountNumber || "",
        ifsc_code: details.ifscCode || details.ifsccode || "",
        account_holder: details.accountHolder || "",
        note: details.note || "Withdraw request from mobile application",
      }),
    });
    return handleResponse(response);
  },

  getTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/wallet/transactions/`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
