import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { walletStyles as styles } from '../styles/GlobalStyle';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import WalletCard from '../components/WalletCard';

// ─── Coin Stack Custom Visual ──────────────────────────────────────────────────
const CoinStack = () => {
  return (
    <View style={styles.coinStackContainer}>
      <View style={styles.coinStackWrapper}>
        <View style={[styles.coinLayer, { top: 16, backgroundColor: '#c59b27', borderColor: '#4a3605' }]} />
        <View style={[styles.coinLayer, { top: 10, backgroundColor: '#333333', borderColor: '#ffffff', borderStyle: 'dashed' }]} />
        <View style={[styles.coinLayer, { top: 4, backgroundColor: '#8a6d1c', borderColor: '#ffeaa7' }]} />
        <View style={[styles.coinLayer, { top: 0, backgroundColor: '#f9ca24', borderColor: '#ffffff' }]}>
          <Text style={{ fontSize: 6, color: '#fff', textAlign: 'center', fontWeight: 'bold', marginTop: -2.5 }}>👑</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Matka Gaming Logo Badge ───────────────────────────────────────────────────
const MatkaGamingLogo = () => {
  return (
    <View style={styles.logoBadgeContainer}>
      <View style={styles.logoBadgeCrownContainer}>
        <Text style={styles.logoBadgeCrown}>👑</Text>
      </View>
      <Text style={styles.logoRightText}>MATKA</Text>
      <Text style={styles.logoRightSubText}>GAMING</Text>
    </View>
  );
};

// ─── Emoji Avatar Generator ───────────────────────────────────────────────────
const getAvatarData = (id) => {
  const avatars = [
    { emoji: '👳', bg: '#4e5d78' },
    { emoji: '🧔', bg: '#c94c4c' },
    { emoji: '👧', bg: '#b2aa5d' },
    { emoji: '👩‍🦰', bg: '#9b59b6' },
    { emoji: '🧑', bg: '#1abc9c' },
    { emoji: '👨', bg: '#34495e' }
  ];
  const str = String(id ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return avatars[hash % avatars.length] || avatars[0];
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [actionType, setActionType] = useState(null); // 'deposit' | 'withdraw' | null
  const [inputAmount, setInputAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'deposit' | 'withdraw'

  const fetchWalletDetails = async () => {
    try {
      const balRes = await apiService.getWalletBalance();
      setBalance(Number(balRes.balance));

      const txRes = await apiService.getTransactions();
      const mapTxnType = (type) => {
        if (type === 'deposit' || type === 'win_credit' || type === 'refund') return 'credit';
        if (type === 'withdraw' || type === 'bet_debit') return 'debit';
        return 'trophy';
      };

      const mapped = txRes.map((t) => ({
        id: t.id,
        type: mapTxnType(t.transaction_type),
        title: t.note || (t.transaction_type === 'deposit' ? 'Deposit via PhonePe' : 'Game Round Bet'),
        date: new Date(t.created_at).toLocaleString(),
        amount: (t.transaction_type === 'deposit' || t.transaction_type === 'win_credit')
          ? `+₹${Number(t.amount).toLocaleString()}`
          : `-₹${Number(t.amount).toLocaleString()}`,
        color: (t.transaction_type === 'deposit' || t.transaction_type === 'win_credit') ? '#22c55e' : '#ef4444',
      }));
      setTransactions(mapped);
    } catch (err) {
      console.log('Error fetching wallet details:', err);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const showAction = (type) => {
    setActionType(type);
    setInputAmount('');
  };

  const hideAction = () => {
    setActionType(null);
    setInputAmount('');
  };

  const handleSubmit = async () => {
    const val = Number(inputAmount);
    if (!val || val <= 0) return;

    if (actionType === 'withdraw' && val > balance) {
      Alert.alert('Limit Exceeded', 'Insufficient wallet balance');
      return;
    }

    try {
      if (actionType === 'deposit') {
        const order = await apiService.initDeposit(val);
        Alert.alert(
          'Deposit Initialized',
          `Order ID: ${order.order_id}\nAmount: ₹${val}\nComplete the verification on your dashboard.`,
          [{ text: 'OK', onPress: () => { fetchWalletDetails(); hideAction(); } }]
        );
      } else {
        const res = await apiService.requestWithdrawal(val, {
          mode: 'upi',
          upiId: 'user@upi', // Mock default UPI address for mobile client input
          note: 'Withdrawal request from client app',
        });
        Alert.alert(
          'Withdraw Requested',
          res.message || 'Withdrawal request has been submitted to admin.',
          [{ text: 'OK', onPress: () => { fetchWalletDetails(); hideAction(); } }]
        );
      }
    } catch (err) {
      Alert.alert('Transaction Error', err.message || 'Action failed');
    }
  };

  const getTotalDeposit = () => {
    let sum = 0;
    transactions.forEach(t => {
      if (t.type === 'credit') {
        const amt = parseFloat(t.amount.replace(/[^0-9.]/g, ''));
        if (!isNaN(amt)) sum += amt;
      }
    });
    return sum > 0 ? `₹ ${sum.toLocaleString()}` : '₹ 0';
  };

  const getTotalWithdraw = () => {
    let sum = 0;
    transactions.forEach(t => {
      if (t.type === 'debit') {
        const amt = parseFloat(t.amount.replace(/[^0-9.]/g, ''));
        if (!isNaN(amt)) sum += amt;
      }
    });
    return sum > 0 ? `₹ ${sum.toLocaleString()}` : '₹ 0';
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposit') return t.type === 'credit';
    if (activeTab === 'withdraw') return t.type === 'debit';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header Section ── */}
          <View style={styles.headerTopRow}>
            {/* Left: Coin Stack with Back navigation */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerLeftButton}
              activeOpacity={0.7}
            >
              <CoinStack />
            </TouchableOpacity>

            {/* Center Title */}
            <Text style={styles.headerTitleText}>MATKA BALANCE</Text>

            {/* Right Logo */}
            <MatkaGamingLogo />
          </View>

          {/* Centered Balance Block */}
          <View style={styles.balanceContainer}>
            <Text style={styles.headerSubTitleText}>wame bulere</Text>
            <Text style={styles.headerBalanceText}>₹{balance.toLocaleString()}</Text>
          </View>

          {/* ── Cards Row (Deposit / Withdraw side by side) ── */}
          <View style={styles.cardsContainer}>
            <WalletCard
              gradientColors={['#4caf50', '#0f2912']}
              rayColor="rgba(255, 255, 255, 0.08)"
              topLabel="All"
              secondaryLabel="1rensone"
              label="Total Deposit"
              amount={getTotalDeposit()}
              buttonText="Deposit"
              onButtonPress={() => showAction('deposit')}
              iconName="shield-check"
              iconType="material"
              iconColor="#8fa122"
            />

            <WalletCard
              gradientColors={['#ff9800', '#3e1d03']}
              rayColor="rgba(255, 255, 255, 0.06)"
              topLabel="Lost"
              secondaryLabel="Witbrhon"
              label="Total Withdraw"
              amount={getTotalWithdraw()}
              buttonText="Withdraw"
              onButtonPress={() => showAction('withdraw')}
              iconName="bitcoin"
              iconType="fontawesome"
              iconColor="#e67e22"
            />
          </View>

          {/* ── Action Form ── */}
          {actionType && (
            <View style={styles.actionForm}>
              <Text style={styles.formTitle}>
                {actionType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.amountInput}
                  value={inputAmount}
                  onChangeText={setInputAmount}
                  placeholder="Enter amount (₹)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="numeric"
                  autoFocus
                />
                <TouchableOpacity style={styles.goBtn} onPress={handleSubmit}>
                  <Text style={styles.goBtnText}>Go</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={hideAction} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Transactions Dashboard Panel ── */}
          <View style={styles.dashboardContainer}>
            {/* Filters */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Filter:</Text>
              <View style={styles.filterTabs}>
                <TouchableOpacity
                  style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
                  onPress={() => setActiveTab('all')}
                >
                  <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>Juiorss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterTab, activeTab === 'deposit' && styles.filterTabActive]}
                  onPress={() => setActiveTab('deposit')}
                >
                  <Text style={[styles.filterTabText, activeTab === 'deposit' && styles.filterTabTextActive]}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterTab, activeTab === 'withdraw' && styles.filterTabActive]}
                  onPress={() => setActiveTab('withdraw')}
                >
                  <Text style={[styles.filterTabText, activeTab === 'withdraw' && styles.filterTabTextActive]}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Header */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Transaction History</Text>
              <View style={styles.listCountBadge}>
                <Text style={styles.listCountText}>Y. 202109</Text>
              </View>
            </View>

            {/* List */}
            <View style={styles.txnList}>
              {filteredTransactions.map((txn) => {
                const avatar = getAvatarData(txn.id);
                const isSuccess = txn.type === 'credit';
                return (
                  <View key={txn.id} style={styles.txnItem}>
                    <View style={styles.txnLeft}>
                      <View style={[styles.avatarContainer, { backgroundColor: avatar?.bg || '#4e5d78' }]}>
                        <Text style={styles.avatarText}>{avatar?.emoji || '👤'}</Text>
                      </View>
                      <View style={styles.txnInfo}>
                        <Text style={styles.txnTitle} numberOfLines={1}>{txn.title}</Text>
                        <Text style={styles.txnSub} numberOfLines={1}>{txn.date}</Text>
                      </View>
                    </View>
                    <View style={styles.txnRight}>
                      <View style={[styles.statusBadge, isSuccess ? styles.statusBadgeSuccess : styles.statusBadgeError]}>
                        <Text style={[styles.statusText, isSuccess ? styles.statusTextSuccess : styles.statusTextError]}>
                          ✓ {txn.amount.replace('+', '').replace('-', '')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              {filteredTransactions.length === 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginVertical: 20, fontSize: 13 }}>
                  No transactions found
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}