import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import SplitGradientText from '../components/SplitGradientText';
import TransactionHistory from '../components/TransactionHistory';
import WalletCard from '../components/WalletCard';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { walletStyles as styles } from '../styles/GlobalStyle';

// ─── Text Gradient Component ───────────────────────────────────────────────────
const GradientText = ({ text, style }) => {
  return (
    <MaskedView
      style={styles.gradientTextMask}
      maskElement={
        <Text style={[style, styles.gradientTextElement]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={['#f5d061', '#fff5cc', '#dca134', '#ab7210']}
        locations={[0, 0.48, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      />
    </MaskedView>
  );
};

// ─── Matka Gaming Logo Badge ───────────────────────────────────────────────────
const MatkaGamingHeaderLogo = () => {
  return (
    <View style={styles.matkaHeaderLogo}>
      <View style={styles.matkaHeaderCircle}>
        <Text style={styles.matkaHeaderCircleText}>M</Text>
      </View>

      <View style={styles.matkaHeaderTextBlock}>
        <Text style={styles.matkaHeaderSubText}>THE</Text>
        <Text style={styles.matkaHeaderWhiteText}>Matka</Text>
        <Text style={styles.matkaHeaderGoldText}>GAMING</Text>
      </View>
    </View>
  );
};

// ─── Safe Emoji Avatar Generator ───────────────────────────────────────────────
const getAvatarData = (id) => {
  const avatars = [
    { emoji: '👳', bg: '#4e5d78' },
    { emoji: '🧔', bg: '#c94c4c' },
    { emoji: '👧', bg: '#b2aa5d' },
    { emoji: '👩‍🦰', bg: '#9b59b6' },
    { emoji: '🧑', bg: '#1abc9c' },
    { emoji: '👨', bg: '#34495e' },
  ];

  // Handles numeric IDs, strings, UUIDs, etc.
  const str = String(id ?? '');

  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return avatars[hash % avatars.length];
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation }) {
  const { user } = useAuth();

  const [balance, setBalance] = useState(0);
  const [actionType, setActionType] = useState(null);
  const [inputAmount, setInputAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Withdrawal Form State
  const [withdrawMode, setWithdrawMode] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Sandbox Checkout Modal State
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // General loader for API calls
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Cashfree HTML ─────────────────────────────────────────────────────────
  const getCashfreeHtml = (order) => {
    const sessionId =
      order.payment_session_id ||
      order.paymentSessionId ||
      order.paymentSessionID ||
      '';

    const paymentUrl =
      order.payment_url ||
      order.paymentUrl ||
      order.paymentURL ||
      order.payment_link ||
      order.paymentLink ||
      '';

    const mode = order.mode || 'sandbox';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>

          <style>
            body {
              margin: 0;
              min-height: 100vh;
              background: #121212;
              color: #ffffff;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                Roboto, Helvetica, Arial, sans-serif;
            }

            #status {
              position: absolute;
              bottom: 24px;
              width: 100%;
              text-align: center;
              color: #ffffff;
              font-size: 14px;
              padding: 0 16px;
            }
          </style>
        </head>

        <body>
          <div id="status">Loading Cashfree checkout...</div>

          <script>
            function report(payload) {
              try {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify(payload)
                );
              } catch (err) {
                console.error(
                  'Cannot send message to React Native WebView',
                  err
                );
              }
            }

            function updateStatus(text) {
              var statusEl = document.getElementById('status');

              if (statusEl) {
                statusEl.innerText = text;
              }
            }

            function launchCheckout() {
              if ('${sessionId}') {
                if (!window.Cashfree) {
                  updateStatus('Cashfree SDK not loaded yet...');
                  return setTimeout(launchCheckout, 150);
                }

                try {
                  updateStatus('Opening Cashfree checkout...');

                  const cashfree = Cashfree({
                    mode: '${mode}'
                  });

                  cashfree
                    .checkout({
                      paymentSessionId: '${sessionId}',
                      redirectTarget: '_self',
                    })
                    .then(function(response) {
                      report({
                        status: 'success',
                        response: response
                      });
                    })
                    .catch(function(error) {
                      report({
                        status: 'failed',
                        error: error
                      });
                    });

                } catch (err) {
                  report({
                    status: 'js_error',
                    message:
                      err.message ||
                      'Cashfree checkout initialization failed',
                    stack: err.stack
                  });

                  updateStatus('Unable to start checkout.');
                }

              } else if ('${paymentUrl}') {
                updateStatus('Redirecting to Cashfree payment page...');
                window.location.href = '${paymentUrl}';

              } else {
                report({
                  status: 'failed',
                  error: {
                    message:
                      'No Cashfree session or payment URL available.'
                  }
                });

                updateStatus('No checkout data available.');
              }
            }

            if (
              document.readyState === 'complete' ||
              document.readyState === 'interactive'
            ) {
              launchCheckout();
            } else {
              document.addEventListener(
                'DOMContentLoaded',
                launchCheckout
              );
            }
          </script>
        </body>
      </html>
    `;
  };

  // ─── Cashfree Message Handler ──────────────────────────────────────────────
  const handleCashfreeMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.status === 'success') {
        setShowSandboxModal(false);
        setIsSubmitting(true);

        try {
          await apiService.verifyDeposit({
            provider: 'cashfree',
            payment_session_id:
              currentOrder?.payment_session_id ||
              currentOrder?.paymentSessionId,
            order_id:
              currentOrder?.order_id ||
              currentOrder?.orderId,
            result: data.response || data,
          });

          Alert.alert(
            'Success',
            'Deposit successful and balance updated!',
            [
              {
                text: 'OK',
                onPress: () => {
                  fetchWalletDetails();
                  hideAction();
                },
              },
            ]
          );
        } catch (err) {
          Alert.alert(
            'Verification Failed',
            err.message || 'Deposit verification failed'
          );
        } finally {
          setIsSubmitting(false);
        }

      } else if (data.status === 'failed') {
        Alert.alert(
          'Payment Failed',
          data.error?.message ||
            'Cashfree checkout transaction failed'
        );

      } else if (data.status === 'js_error') {
        Alert.alert(
          'Checkout Error',
          data.message ||
            'Cashfree checkout error occurred'
        );

        console.log(
          'Cashfree JS error details:',
          data
        );
      }
    } catch (e) {
      console.log(
        'Error parsing WebView message:',
        e,
        event.nativeEvent.data
      );
    }
  };

  // ─── Fetch Wallet Details ──────────────────────────────────────────────────
  const fetchWalletDetails = async () => {
  try {
    // Get wallet balance
    const balRes = await apiService.getWalletBalance();

    console.log('WALLET BALANCE API RESPONSE:', balRes);

    // Support different API response structures
    const serverBalance =
      balRes?.balance ??
      balRes?.wallet_balance ??
      balRes?.current_balance ??
      balRes?.data?.balance ??
      balRes?.data?.wallet_balance ??
      balRes?.data?.current_balance ??
      0;

    const parsedBalance = Number(serverBalance);

    console.log('PARSED WALLET BALANCE:', parsedBalance);

    setBalance(
      Number.isFinite(parsedBalance)
        ? parsedBalance
        : 0
    );

    // Get transactions
    const txRes = await apiService.getTransactions();

    console.log('TRANSACTIONS API RESPONSE:', txRes);

    const transactionList = Array.isArray(txRes)
      ? txRes
      : Array.isArray(txRes?.data)
      ? txRes.data
      : Array.isArray(txRes?.transactions)
      ? txRes.transactions
      : Array.isArray(txRes?.data?.transactions)
      ? txRes.data.transactions
      : [];

    const mapTxnType = (type) => {
      if (
        type === 'deposit' ||
        type === 'win_credit' ||
        type === 'refund'
      ) {
        return 'credit';
      }

      if (
        type === 'withdraw' ||
        type === 'bet_debit'
      ) {
        return 'debit';
      }

      return 'trophy';
    };

    const mapped = transactionList.map((t) => ({
      id: t.id,

      type: mapTxnType(t.transaction_type),

      title:
        t.note ||
        (
          t.transaction_type === 'deposit'
            ? 'Deposit via PhonePe'
            : 'Game Round Bet'
        ),

      date: new Date(
        t.created_at
      ).toLocaleDateString(),

      amount:
        t.transaction_type === 'deposit' ||
        t.transaction_type === 'win_credit' ||
        t.transaction_type === 'refund'
          ? `+₹${Number(t.amount).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
              }
            )}`
          : `-₹${Number(t.amount).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
              }
            )}`,

      color:
        t.transaction_type === 'deposit' ||
        t.transaction_type === 'win_credit' ||
        t.transaction_type === 'refund'
          ? '#22c55e'
          : '#FFA800',
    }));

    setTransactions(mapped);

  } catch (err) {
    console.log(
      'Error fetching wallet details:',
      err
    );
  }
};

  // ─── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWalletDetails();
  }, []);

  // ─── Action Helpers ────────────────────────────────────────────────────────
  const showAction = (type) => {
    setActionType(type);
    setInputAmount('');
  };

  const hideAction = async () => {
    setShowSandboxModal(false);
    setActionType(null);
    setInputAmount('');
    setCurrentOrder(null);

    try {
      await fetchWalletDetails();
    } catch (err) {
      console.log(
        'Unable to refresh wallet after cancel:',
        err
      );
    }
  };

  // ─── Submit Deposit / Withdrawal ──────────────────────────────────────────
  const handleSubmit = async () => {
    const val = Number(inputAmount);

    if (!val || val <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // ───────── Deposit ─────────
      if (actionType === 'deposit') {
        const order = await apiService.initDeposit(
          val,
          'cashfree'
        );

        console.log(
          'Cashfree deposit init response',
          order
        );

        const hasSessionOrLink = !!(
          order?.payment_session_id ||
          order?.paymentSessionId ||
          order?.paymentSessionID ||
          order?.payment_url ||
          order?.paymentUrl ||
          order?.paymentURL ||
          order?.payment_link ||
          order?.paymentLink
        );

        if (!order || !hasSessionOrLink) {
          console.log(
            'Invalid Cashfree order response',
            order
          );

          Alert.alert(
            'Transaction Error',
            `Cashfree init failed. Response: ${JSON.stringify(
              order
            )}`
          );

          setIsSubmitting(false);
          return;
        }

        setCurrentOrder(order);
        setShowSandboxModal(true);
        setIsSubmitting(false);
        return;
      }

      // ───────── Withdrawal ─────────
      if (val > balance) {
        Alert.alert(
          'Limit Exceeded',
          'Insufficient wallet balance'
        );

        setIsSubmitting(false);
        return;
      }

      let details = {};

      if (withdrawMode === 'upi') {
        if (!upiId.trim()) {
          Alert.alert(
            'Validation Error',
            'Please enter a valid UPI ID'
          );

          setIsSubmitting(false);
          return;
        }

        details = {
          mode: 'upi',
          upiId: upiId.trim(),
          note: 'Withdrawal request via UPI',
        };
      } else {
        if (
          !accountHolder.trim() ||
          !accountNumber.trim() ||
          !ifscCode.trim()
        ) {
          Alert.alert(
            'Validation Error',
            'Please fill in all bank details'
          );

          setIsSubmitting(false);
          return;
        }

        details = {
          mode: 'bank_transfer',
          accountHolder: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          note: 'Withdrawal request via Bank Transfer',
        };
      }

      const res =
        await apiService.requestWithdrawal(
          val,
          details
        );

      Alert.alert(
        'Withdraw Requested',
        res.message ||
          'Withdrawal request has been submitted to admin.',
        [
          {
            text: 'OK',
            onPress: () => {
              fetchWalletDetails();
              hideAction();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'Transaction Error',
        err.message || 'Action failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Total Deposit ─────────────────────────────────────────────────────────
  const getTotalDeposit = () => {
    let sum = 0;

    transactions.forEach((t) => {
      if (t.type === 'credit') {
        const amt = parseFloat(
          String(t.amount).replace(
            /[^0-9.]/g,
            ''
          )
        );

        if (!isNaN(amt)) {
          sum += amt;
        }
      }
    });

    return sum > 0
      ? `₹ ${sum.toLocaleString()}`
      : '₹ 0';
  };

  // ─── Total Withdraw ───────────────────────────────────────────────────────
  const getTotalWithdraw = () => {
    let sum = 0;

    transactions.forEach((t) => {
      if (t.type === 'debit') {
        const amt = parseFloat(
          String(t.amount).replace(
            /[^0-9.]/g,
            ''
          )
        );

        if (!isNaN(amt)) {
          sum += amt;
        }
      }
    });

    return sum > 0
      ? `₹ ${sum.toLocaleString()}`
      : '₹ 0';
  };

  // ─── Filtered Transactions ────────────────────────────────────────────────
  const filteredTransactions =
    transactions.filter((t) => {
      if (activeTab === 'all') {
        return true;
      }

      if (activeTab === 'deposit') {
        return t.type === 'credit';
      }

      if (activeTab === 'withdraw') {
        return t.type === 'debit';
      }

      return true;
    });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../assets/images/wallet_bg.png')}
        style={styles.gradient}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header Section ── */}
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerLeftButton}
                activeOpacity={0.7}
              >
                <View style={styles.menuLine1} />
                <View style={styles.menuLine2} />
              </TouchableOpacity>

              <MatkaGamingHeaderLogo />

              <TouchableOpacity
                onPress={fetchWalletDetails}
                style={styles.logoBadgeContainer}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="cached"
                  size={22}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            {/* ── Balance ── */}
            {(() => {
              const balanceStr = `₹${balance.toLocaleString()}`;
              console.log('balanceStr --->', balanceStr)

              const splitIndex =
                balanceStr.length - 2;

              const leftText =
                splitIndex > 0
                  ? balanceStr.substring(
                      0,
                      splitIndex
                    )
                  : balanceStr;

              const rightText =
                splitIndex > 0
                  ? balanceStr.substring(
                      splitIndex
                    )
                  : '';

              return (
                <View style={styles.balanceContainer}>
  <Text style={styles.myWalletLabel}>
    My Wallet
  </Text>

  <SplitGradientText
    leftText={`₹${Number(balance).toLocaleString()}`}
    rightText=""
    leftColors={['#fce8a8', '#c98f2e']}
    rightColors={['#fce8a8', '#c98f2e']}
    fontSize={56}
  />
</View>
              );
            })()}

            {/* ── Wallet Cards ── */}
            <View
              style={styles.cardsContainer}
            >
              <WalletCard
                id="deposit"
                gradientColors={[
                  '#4caf50',
                  '#0f2912',
                ]}
                label={'TOTAL\nDEPOSIT'}
                amount={getTotalDeposit()}
                buttonText="Deposit"
                onButtonPress={() =>
                  showAction('deposit')
                }
                iconName="account"
                iconType="material"
                iconColor="#ffffff"
                badgeBgColor="#133d16"
                badgeBorderColor="#3ba13c"
              />

              <WalletCard
                id="withdraw"
                gradientColors={[
                  '#ff9800',
                  '#3e1d03',
                ]}
                label={'TOTAL\nWITHDRAW'}
                amount={getTotalWithdraw()}
                buttonText="Lost"
                onButtonPress={() =>
                  showAction('withdraw')
                }
                iconName="bank-transfer"
                iconType="material"
                iconColor="#ffffff"
                badgeBgColor="#5c2e02"
                badgeBorderColor="#e8a023"
              />
            </View>

            {/* ── Action Form ── */}
            {actionType && (
              <View
                style={styles.actionForm}
              >
                <Text
                  style={styles.formTitle}
                >
                  {actionType === 'deposit'
                    ? 'Deposit Funds'
                    : 'Withdraw Funds'}
                </Text>

                <View
                  style={styles.inputRow}
                >
                  <TextInput
                    style={
                      styles.amountInput
                    }
                    value={inputAmount}
                    onChangeText={
                      setInputAmount
                    }
                    placeholder="Enter amount (₹)"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>

                {/* ── Withdrawal Details ── */}
                {actionType === 'withdraw' && (
                  <View
                    style={{
                      width: '100%',
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={
                        localStyles.toggleRow
                      }
                    >
                      <TouchableOpacity
                        style={[
                          localStyles.toggleTab,
                          withdrawMode ===
                            'upi' &&
                            localStyles.toggleTabActive,
                        ]}
                        onPress={() =>
                          setWithdrawMode(
                            'upi'
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            localStyles.toggleTabText,
                            withdrawMode ===
                              'upi' &&
                              localStyles.toggleTabTextActive,
                          ]}
                        >
                          UPI
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          localStyles.toggleTab,
                          withdrawMode ===
                            'bank' &&
                            localStyles.toggleTabActive,
                        ]}
                        onPress={() =>
                          setWithdrawMode(
                            'bank'
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            localStyles.toggleTabText,
                            withdrawMode ===
                              'bank' &&
                              localStyles.toggleTabTextActive,
                          ]}
                        >
                          Bank Transfer
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {withdrawMode === 'upi' ? (
                      <TextInput
                        style={
                          localStyles.subInput
                        }
                        value={upiId}
                        onChangeText={
                          setUpiId
                        }
                        placeholder="Enter UPI ID (e.g. username@bank)"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        autoCapitalize="none"
                      />
                    ) : (
                      <View>
                        <TextInput
                          style={
                            localStyles.subInput
                          }
                          value={
                            accountHolder
                          }
                          onChangeText={
                            setAccountHolder
                          }
                          placeholder="Account Holder Name"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                        />

                        <TextInput
                          style={
                            localStyles.subInput
                          }
                          value={
                            accountNumber
                          }
                          onChangeText={
                            setAccountNumber
                          }
                          placeholder="Account Number"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          keyboardType="numeric"
                        />

                        <TextInput
                          style={
                            localStyles.subInput
                          }
                          value={ifscCode}
                          onChangeText={(
                            text
                          ) =>
                            setIfscCode(
                              text.toUpperCase()
                            )
                          }
                          placeholder="IFSC Code"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          autoCapitalize="characters"
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* ── Submit ── */}
                {isSubmitting ? (
                  <View
                    style={
                      localStyles.loaderContainer
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#D4AF37"
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.goBtn}
                    onPress={
                      handleSubmit
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        styles.goBtnText
                      }
                    >
                      Submit Transaction
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ── Cancel ── */}
                <TouchableOpacity
                  onPress={hideAction}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      styles.cancelText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Transaction History ── */}
            <TransactionHistory
              transactions={filteredTransactions.map(
                (txn) => {
                  const avatar =
                    getAvatarData(txn.id);

                  return {
                    id: txn.id,

                    title:
                      txn.type === 'credit'
                        ? `Deposit ( ${txn.id} )`
                        : `Withdraw ( ${txn.id} )`,

                    subtitle: `${txn.title} • ${txn.date}`,

                    status: 'WoNO',

                    amount: txn.amount,

                    // Safe value — never undefined
                    avatarColor:
                      avatar?.bg ||
                      '#4e5d78',
                  };
                }
              )}

              activeTab={activeTab}

              onTabChange={(tabKey) => {
                if (tabKey === 'all') {
                  setActiveTab('all');
                } else if (
                  tabKey === 'deposit'
                ) {
                  setActiveTab('deposit');
                } else if (
                  tabKey === 'withdraw'
                ) {
                  setActiveTab('withdraw');
                }
              }}
            />
          </ScrollView>

          {/* ── Cashfree Checkout Modal ── */}
          <Modal
            visible={showSandboxModal}
            transparent={false}
            animationType="slide"
            onRequestClose={hideAction}
          >
            <SafeAreaView
              style={{
                flex: 1,
                backgroundColor: '#121212',
              }}
            >
              <View
                style={{
                  height: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderColor: '#222',
                  backgroundColor: '#121212',
                }}
              >
                <Text
                  style={{
                    color: '#D4AF37',
                    fontSize: 18,
                    fontWeight: '800',
                  }}
                >
                  Cashfree Checkout
                </Text>

                <TouchableOpacity
                  onPress={hideAction}
                  style={{ padding: 8 }}
                >
                  <Text
                    style={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {currentOrder && (
                <WebView
                  originWhitelist={['*']}

                  source={{
                    html: getCashfreeHtml(
                      currentOrder
                    ),
                  }}

                  mixedContentMode="always"

                  allowUniversalAccessFromFileURLs={
                    true
                  }

                  onMessage={
                    handleCashfreeMessage
                  }

                  onError={(event) => {
                    console.log(
                      'WebView error:',
                      event.nativeEvent
                    );

                    Alert.alert(
                      'Checkout Error',
                      event.nativeEvent
                        .description ||
                        'WebView failed to load'
                    );

                    setShowSandboxModal(
                      false
                    );
                  }}

                  onHttpError={(event) => {
                    console.log(
                      'WebView HTTP error:',
                      event.nativeEvent
                    );

                    Alert.alert(
                      'Checkout Error',
                      `HTTP error ${event.nativeEvent.statusCode}`
                    );

                    setShowSandboxModal(
                      false
                    );
                  }}

                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}

                  renderLoading={() => (
                    <View
                      style={{
                        position:
                          'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        justifyContent:
                          'center',
                        alignItems:
                          'center',
                        backgroundColor:
                          '#121212',
                      }}
                    >
                      <ActivityIndicator
                        size="large"
                        color="#D4AF37"
                      />
                    </View>
                  )}

                  style={{
                    flex: 1,
                    backgroundColor:
                      '#121212',
                  }}
                />
              )}
            </SafeAreaView>
          </Modal>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// ─── Local Styles ─────────────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginVertical: 12,
    padding: 3,
  },

  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },

  toggleTabActive: {
    backgroundColor: '#D4AF37',
  },

  toggleTabText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    fontSize: 13,
  },

  toggleTabTextActive: {
    color: '#000000',
  },

  subInput: {
    backgroundColor:
      'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.5,
  },

  modalBody: {
    marginBottom: 24,
  },

  modalInfoLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
  },

  modalInfoVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },

  sandboxDisclaimer: {
    color: '#EBB828',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 16,
    backgroundColor:
      'rgba(235,184,40,0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor:
      'rgba(235,184,40,0.2)',
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  modalBtnSuccess: {
    backgroundColor: '#D4AF37',
    marginRight: 8,
  },

  modalBtnSuccessText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },

  modalBtnCancel: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    marginLeft: 8,
  },

  modalBtnCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    fontSize: 13,
  },

  loaderContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
});