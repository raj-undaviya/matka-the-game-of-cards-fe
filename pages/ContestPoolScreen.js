// pages/ContestPoolScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiService } from '../services/apiService';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ContestPoolScreen({ route, navigation }) {
  const { gameId, gameVariation, gameName } = route.params || {};

  const [pools, setPools] = useState([]);
  const [megaPool, setMegaPool] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningMega, setJoiningMega] = useState(false);

  // Per-pool countdown map
  const [poolTimers, setPoolTimers] = useState({});
  const [currentTick, setCurrentTick] = useState(Date.now());

  // Entry Confirmation Modal States
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedPoolForEntry, setSelectedPoolForEntry] = useState(null);
  const [isMegaSelected, setIsMegaSelected] = useState(false);

  const isFocused = useIsFocused();
  const timerRef = useRef(null);

  const gameIdToVariation = {
    1: 'V1', // Single Card
    5: 'V2', // Pair Selection
    2: 'V3', // Trio Game
    3: 'V4', // Last Digit Sum
    4: 'V5', // Lucky Draw
  };
  const variation = gameVariation || gameIdToVariation[gameId] || 'V2';

  const fetchPoolsData = useCallback(async () => {
    try {
      const balRes = await apiService.getWalletBalance().catch(() => ({ balance: 0 }));
      setBalance(balRes.balance || balRes.current_balance || 0);

      // Fetch dynamic pools for this variation
      const poolsRes = await apiService.getPools(variation).catch(() => []);

      if (Array.isArray(poolsRes) && poolsRes.length > 0) {
        let activeMega = null;
        const otherPools = [];
        const timerInit = {};

        poolsRes.forEach((p) => {
          const isMega = Boolean(p.is_daily_mega || p.pool_type === 'mega_daily');
          const isRegular = p.pool_type === 'regular_5min' || p.pool_type === 'regular_pool' || (p.name && p.name.includes('Regular'));
          const isHourly = p.pool_type === 'hourly_pool' || p.pool_type?.includes('hourly') || (p.interval_minutes && p.interval_minutes >= 60) || (p.name && p.name.toLowerCase().includes('hourly'));

          const p1 = p.prize_distribution?.['1'] || (p.entry_fee ? p.entry_fee * 30 : 0);
          const p2 = p.prize_distribution?.['2'] || (p.entry_fee ? p.entry_fee * 20 : 0);
          const p3 = p.prize_distribution?.['3'] || (p.entry_fee ? p.entry_fee * 10 : 0);
          const totalPrize = p.win_prize || (p1 + p2 + p3) || 1000;

          let timerSecs = 300;
          if (typeof p.starts_in_seconds === 'number' && p.starts_in_seconds > 0) {
            timerSecs = p.starts_in_seconds;
          } else if (typeof p.remaining_seconds === 'number') {
            timerSecs = p.remaining_seconds;
          }
          if (isRegular && timerSecs > 300) {
            timerSecs = 300;
          }

          timerInit[p.id] = timerSecs;

          const poolObj = {
            id: p.id,
            poolId: p.id,
            slotNumber: p.slot_number || 1,
            name: p.name || (isHourly ? 'Hourly Pool' : 'Regular Pool'),
            poolType: p.pool_type || (isHourly ? 'hourly_pool' : 'regular_pool'),
            entryFee: p.entry_fee || (isHourly ? 20 : 10),
            winningPrize: totalPrize,
            winPrize: totalPrize,
            maxSlots: p.max_players || 100,
            filledSlots: p.participants_count || 0,
            status: p.status || 'upcoming',
            isDailyMega: isMega,
            isHourly: isHourly,
            isRegular: isRegular,
            isEntryEnabled: p.is_entry_enabled !== false,
            startsInSeconds: p.starts_in_seconds || 0,
            countdownLabel: p.countdown_label || '',
            userHasPlayedToday: !!p.user_has_played_today,
            scheduleDisplay: isMega
              ? 'Daily 1:30 PM (5 mins)'
              : (p.schedule_display || (isHourly ? `Every ${Math.round((p.interval_minutes || 60) / 60)} Hours • Entry ₹${p.entry_fee || 20}` : `Every 5 Mins • Entry ₹${p.entry_fee || 10}`)),
            firstPrize: p1,
            secondPrize: p2,
            thirdPrize: p3,
            roundsCount: p.rounds_count || 10,
            remainingSeconds: timerSecs,
          };

          if (isMega && !activeMega) {
            activeMega = poolObj;
          } else {
            otherPools.push(poolObj);
          }
        });

        setMegaPool(activeMega);
        setPools(otherPools);
        setPoolTimers(timerInit);
      } else {
        // Fallback: exactly 1 single Regular Pool slot
        const defaultPools = [
          {
            id: 'regular_pool_fallback_1',
            name: 'Regular Pool (Slot #1)',
            slotNumber: 1,
            poolType: 'regular_pool',
            entryFee: 10,
            winningPrize: 600,
            maxSlots: 100,
            filledSlots: 45,
            roundsCount: 10,
            firstPrize: 300,
            secondPrize: 200,
            thirdPrize: 100,
            scheduleDisplay: 'Every 5 Mins',
            remainingSeconds: 300,
          },
        ];
        setPools(defaultPools);
      }
    } catch (err) {
      console.log('Error fetching contest pools:', err);
    } finally {
      setIsLoading(false);
    }
  }, [variation]);

  useEffect(() => {
    if (isFocused) {
      setIsLoading(true);
      fetchPoolsData();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchPoolsData, isFocused]);

  // Real-time tick down for active pool countdowns & instant slot rollover
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCurrentTick(Date.now());
      setPoolTimers((prev) => {
        let hasExpired = false;
        const next = { ...prev };
        const expiredIds = [];

        Object.keys(next).forEach((key) => {
          if (next[key] <= 1) {
            next[key] = 0;
            hasExpired = true;
            expiredIds.push(key);
          } else {
            next[key] = next[key] - 1;
          }
        });

        if (hasExpired) {
          // Sync with backend to ensure DB models create the new slot & round 1
          fetchPoolsData();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchPoolsData]);

  const formatTimer = (totalSeconds) => {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs < 10 ? '0' : ''}${hrs}h:${mins < 10 ? '0' : ''}${mins}m:${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isMegaPoolOpenNow = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const currentSecs = hours * 3600 + minutes * 60 + seconds;

    const startSecs = 13 * 3600 + 30 * 60; // 13:30:00 (1:30 PM)
    const endSecs = 13 * 3600 + 35 * 60;   // 13:35:00 (1:35 PM)

    if (currentSecs >= startSecs && currentSecs <= endSecs) {
      const remainingSecs = endSecs - currentSecs;
      return { isOpen: true, remainingSecs };
    }
    return { isOpen: false, remainingSecs: 0 };
  };

  const requestPoolEntry = (pool, isMega = false) => {
    if (isMega && !isMegaPoolOpenNow().isOpen) {
      return;
    }
    setSelectedPoolForEntry(pool);
    setIsMegaSelected(isMega);
    setConfirmModalVisible(true);
  };

  const confirmAndProceedEntry = async () => {
    const pool = selectedPoolForEntry;
    const isMega = isMegaSelected;
    setConfirmModalVisible(false);

    if (!pool) return;

    const entryFee = pool.entryFee || (isMega ? 200 : 10);
    const winPrize = pool.winningPrize || (isMega ? pool.firstPrize || 6000 : 1000);

    const getVariationDefaultMultiplier = () => {
      if (variation === 'V1' || gameId === 1) return '10x';
      if (variation === 'V2' || gameId === 5) return '20x';
      if (variation === 'V3' || gameId === 2) return '32x';
      if (variation === 'V4' || gameId === 3) return '80x';
      if (variation === 'V5' || gameId === 4) return '100x';
      return '30x';
    };
    const reward = isMega ? '30x' : (pool.rewardMultiplier || pool.reward || getVariationDefaultMultiplier());

    const screenParams = {
      roundId: pool.id,
      poolId: pool.poolId || pool.id,
      entryFee,
      winningPrize: winPrize,
      reward,
      slotNumber: pool.slotNumber || 1,
      roundNumber: 1,
      totalRounds: pool.roundsCount || 10,
      isDailyMega: isMega,
      country: pool.country || 'India',
      poolName: pool.name,
      poolType: pool.poolType,
    };

    let targetScreen = 'PairSelection';
    if (variation === 'V1' || gameId === 1) {
      targetScreen = 'SingleCard';
    } else if (variation === 'V2' || gameId === 5) {
      targetScreen = 'PairSelection';
    } else if (variation === 'V3' || gameId === 2) {
      targetScreen = 'TrioGame';
    } else if (variation === 'V4' || gameId === 3) {
      targetScreen = 'LastDigitSum';
    } else if (variation === 'V5' || gameId === 4) {
      targetScreen = 'LuckyDraw';
    }

    const currentBal = Number(balance) || 0;

    // ── Insufficient Balance Case: Redirect to Wallet ──
    if (currentBal < entryFee) {
      const needed = entryFee - currentBal;
      Alert.alert(
        'Insufficient Wallet Balance',
        `Current Balance: ₹${currentBal.toLocaleString()}\nPool Entry Fee: ₹${entryFee.toLocaleString()}\n\nYou need ₹${needed.toLocaleString()} more to join. Redirecting to deposit...`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deposit Now',
            onPress: () => {
              navigation.navigate('Wallet', {
                returnScreen: targetScreen,
                returnParams: screenParams,
                autoOpenDeposit: true,
                requiredAmount: Math.max(100, needed),
              });
            },
          },
        ]
      );
      return;
    }

    // ── Join Pool on Backend & Navigate to Card Selection ──
    if (pool.poolId && typeof pool.poolId === 'number') {
      try {
        if (isMega) setJoiningMega(true);
        await apiService.joinPool(pool.poolId);
      } catch (err) {
        const errorMsg = err.message || '';
        if (!errorMsg.includes('already joined')) {
          Alert.alert('Contest Notice', errorMsg || 'Unable to join pool');
          if (isMega) setJoiningMega(false);
          return;
        }
      } finally {
        if (isMega) setJoiningMega(false);
      }
    }

    navigation.navigate(targetScreen, screenParams);
  };

  const getTierIcon = (poolType) => {
    if (poolType === 'mega_daily') return '⭐';
    if (poolType === 'hourly') return '⏱️';
    if (poolType === '2_hourly') return '⏱️';
    if (poolType === '5_hourly') return '⏱️';
    if (poolType === '10_hourly') return '⏱️';
    if (poolType === 'regular_5min' || poolType === 'regular_pool') return '⚡';
    return '🎯';
  };

  const renderMegaPoolCard = () => {
    if (!megaPool) return null;

    const fillPercent = Math.min(100, Math.round((megaPool.filledSlots / Math.max(1, megaPool.maxSlots)) * 100));
    const megaWindow = isMegaPoolOpenNow();
    const canEnter = megaWindow.isOpen && !joiningMega;

    return (
      <LinearGradient
        colors={['#420000', '#200000', '#110000']}
        style={styles.megaPoolContainer}
      >
        {/* Top Gold Glowing Ribbon */}
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.megaRibbon}
        >
          <View style={styles.megaRibbonContent}>
            <FontAwesome name="trophy" size={13} color="#000" />
            <Text style={styles.megaRibbonText}>⭐ DAILY MEGA POOL (1:30 PM)</Text>
          </View>
        </LinearGradient>

        <View style={styles.megaBody}>
          {/* Timing & Restriction Tag */}
          <View style={styles.megaScheduleRow}>
            <View style={styles.scheduleBadge}>
              <Ionicons name="time" size={12} color="#FFD700" />
              <Text style={styles.scheduleBadgeText}>1:30 PM Everyday</Text>
            </View>
            <View style={styles.oncePerDayBadge}>
              <MaterialCommunityIcons name="shield-check" size={12} color="#4ADE80" />
              <Text style={styles.oncePerDayText}>Daily Pool</Text>
            </View>
          </View>

          {/* Prize & Entry Action */}
          <View style={styles.megaMainRow}>
            <View style={styles.megaPrizeWrap}>
              <Text style={styles.megaPrizeLabel}>MEGA PRIZE POOL</Text>
              <Text style={styles.megaPrizeAmount}>₹{Number(megaPool.winPrize).toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              disabled={!canEnter}
              onPress={() => requestPoolEntry(megaPool, true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  canEnter
                    ? ['#00E676', '#009624']
                    : ['#4B5563', '#374151']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.megaEntryBtn, !canEnter && styles.megaEntryBtnDisabled]}
              >
                <Text style={styles.megaEntryBtnText}>
                  {joiningMega ? 'ENTERING...' : `ENTRY ₹${megaPool.entryFee}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 3-Tier Multiplier Badges */}
          <View style={styles.prizeTiersRow}>
            <View style={styles.tierBox}>
              <Text style={styles.tierRank}>🥇 1st Winner</Text>
              <Text style={styles.tierPrize}>₹{Number(megaPool.firstPrize).toLocaleString()}</Text>
              <Text style={styles.tierMult}>30x Prize</Text>
            </View>

            <View style={styles.tierBox}>
              <Text style={styles.tierRank}>🥈 2nd Winner</Text>
              <Text style={styles.tierPrize}>₹{Number(megaPool.secondPrize).toLocaleString()}</Text>
              <Text style={styles.tierMult}>20x Prize</Text>
            </View>

            <View style={styles.tierBox}>
              <Text style={styles.tierRank}>🥉 3rd Winner</Text>
              <Text style={styles.tierPrize}>₹{Number(megaPool.thirdPrize).toLocaleString()}</Text>
              <Text style={styles.tierMult}>10x Prize</Text>
            </View>
          </View>

          {/* Progress Bar (Spots Left: Max 150) */}
          <View style={styles.megaProgressSection}>
            <View style={styles.megaProgressBarTrack}>
              <LinearGradient
                colors={['#FFD700', '#FF9100']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.megaProgressBarFill, { width: `${fillPercent}%` }]}
              />
            </View>
            <View style={styles.megaSpotsRow}>
              <Text style={styles.megaSpotsJoined}>{megaPool.filledSlots} / {megaPool.maxSlots} joined</Text>
              <Text style={styles.megaSpotsMax}>
                {megaWindow.isOpen ? `Entry closes in ${formatTimer(megaWindow.remainingSecs)}` : 'Starts at 1:30 PM (5 min timer)'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderPoolRow = ({ item, index }) => {
    const fillPercent = Math.min(100, Math.round((item.filledSlots / Math.max(1, item.maxSlots)) * 100));
    const isRegular = item.isRegular ?? (item.poolType === 'regular_5min' || item.poolType === 'regular_pool' || item.entryFee === 10 || item.name?.includes('Regular'));
    const isHourly = item.isHourly ?? (!isRegular && (item.poolType?.includes('hourly') || item.name?.toLowerCase().includes('hourly')));
    const poolSecs = poolTimers[item.id] ?? item.remainingSeconds ?? 300;
    const isEntryAllowed = item.isEntryEnabled !== false;

    return (
      <View
        style={[
          styles.poolCardContainer,
          isRegular && styles.regularPoolContainer,
          isHourly && styles.hourlyPoolContainer,
        ]}
      >
        {/* Top Header: Pool Tier Tag & Expiration Countdown */}
        <View style={styles.cardTopRow}>
          <View style={[styles.slotBadge, isRegular && styles.regularSlotBadge, isHourly && styles.hourlySlotBadge]}>
            <Text style={styles.slotBadgeText}>
              {getTierIcon(item.poolType)} {item.name.toUpperCase()}
            </Text>
          </View>

          <View style={styles.headerRightWrap}>
            <View style={[styles.timerBadge, isHourly && styles.hourlyTimerBadge]}>
              <Ionicons name="time-outline" size={13} color={poolSecs < 15 ? '#FF4444' : isHourly ? '#93C5FD' : '#FFD700'} />
              <Text style={[styles.timerBadgeText, isHourly && styles.hourlyTimerBadgeText, poolSecs < 15 && styles.timerUrgent]}>
                {isHourly && item.startsInSeconds > 0 ? `Starts in ${formatTimer(poolSecs)}` : `${formatTimer(poolSecs)} Left`}
              </Text>
            </View>
          </View>
        </View>

        {/* Prize Pool & Entry Fee Row */}
        <View style={styles.mainInfoRow}>
          <View style={styles.prizeSection}>
            <Text style={styles.prizeLabel}>TOTAL PRIZE POOL</Text>
            <Text style={styles.prizeValue}>₹{Number(item.winningPrize).toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            disabled={!isEntryAllowed}
            onPress={() => requestPoolEntry(item, false)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isEntryAllowed
                  ? (isHourly ? ['#4F46E5', '#3730A3'] : ['#00C853', '#007E33'])
                  : ['#4B5563', '#374151']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.entryFeeBtn, !isEntryAllowed && styles.entryBtnDisabled]}
            >
              <Text style={styles.entryFeeBtnText}>
                {isEntryAllowed ? `ENTRY ₹${item.entryFee}` : `🔒 STARTS IN ${formatTimer(poolSecs)}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 3-Tier Multiplier Breakdown */}
        <View style={styles.regularPrizeRow}>
          <View style={styles.regularTierBox}>
            <Text style={styles.regularTierRank}>🥇 1st Prize</Text>
            <Text style={styles.regularTierPrize}>₹{Number(item.firstPrize).toLocaleString()}</Text>
          </View>
          <View style={styles.regularTierBox}>
            <Text style={styles.regularTierRank}>🥈 2nd Prize</Text>
            <Text style={styles.regularTierPrize}>₹{Number(item.secondPrize).toLocaleString()}</Text>
          </View>
          <View style={styles.regularTierBox}>
            <Text style={styles.regularTierRank}>🥉 3rd Prize</Text>
            <Text style={styles.regularTierPrize}>₹{Number(item.thirdPrize).toLocaleString()}</Text>
          </View>
        </View>

        {/* Progress Bar for Spots */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${fillPercent}%`,
                  backgroundColor: isHourly ? '#60A5FA' : (fillPercent > 80 ? '#FF5252' : '#FF9900'),
                },
              ]}
            />
          </View>
          <View style={styles.spotsRow}>
            <Text style={styles.spotsFilledText}>
              {item.filledSlots} joined ({Math.max(0, item.maxSlots - item.filledSlots)} spots left)
            </Text>
            <Text style={styles.spotsTotalText}>{item.maxSlots} max capacity</Text>
          </View>
        </View>

        {/* Card Footer: Schedule and Rules */}
        <View style={styles.cardFooterRow}>
          <View style={styles.footerTag}>
            <FontAwesome name="trophy" size={11} color="#FFD700" />
            <Text style={styles.footerTagText}>
              {item.roundsCount || 10} Rounds Tournament
            </Text>
          </View>
          <Text style={styles.guaranteedText}>{item.scheduleDisplay || 'Auto Slots'}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#5a0000', '#120000']}
      style={styles.mainBackground}
    >
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#5a0000" />

        {/* Header Decor & Controls */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.chainDecorContainer}>
            <Svg height="30" width="160" viewBox="0 0 160 30" style={styles.chainSvg}>
              <Path
                d="M 5,0 Q 80,30 155,0"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <Circle cx="80" cy="15" r="2.5" fill="#D4AF37" />
            </Svg>
            <View style={styles.chainStar}>
              <FontAwesome name="star" size={13} color="#FFF5C2" />
            </View>
          </View>

          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.85}
          >
            <Text style={styles.walletBtnText}>₹{Number(balance).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Large Card Container */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['rgba(78, 8, 8, 0.75)', 'rgba(30, 3, 3, 0.95)']}
            style={styles.cardContent}
          >
            {/* Centered Contest Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLine} />
              <Text style={styles.cardTitle}>{gameName || 'CONTEST POOLS'}</Text>
              <View style={styles.headerLine} />
            </View>

            {/* List Content */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
            ) : (
              <FlatList
                ListHeaderComponent={renderMegaPoolCard}
                data={pools}
                renderItem={renderPoolRow}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </LinearGradient>
        </View>

        {/* ── Luxury Casino Confirmation Pop-up Modal ── */}
        <Modal
          visible={confirmModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <LinearGradient
              colors={['#450808', '#200303', '#100000']}
              style={styles.confirmModalBox}
            >
              {/* Top Golden Glowing Accent Bar */}
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#D4AF37']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalTopBar}
              />

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconCircle}>
                  <FontAwesome name="trophy" size={26} color="#FFD700" />
                </View>
                <Text style={styles.modalTitle}>CONFIRM POOL ENTRY</Text>
                <Text style={styles.modalSubTitle}>
                  {isMegaSelected
                    ? '⭐ Daily Mega Championship Pool'
                    : selectedPoolForEntry?.name || 'Tournament Pool'}
                </Text>
              </View>

              {/* Pool Details Breakdown Card */}
              <View style={styles.modalDetailsCard}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Entry Fee</Text>
                  <Text style={styles.modalDetailValueGold}>
                    ₹{selectedPoolForEntry?.entryFee || (isMegaSelected ? 200 : 10)}
                  </Text>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Total Win Prize</Text>
                  <Text style={styles.modalDetailValueGreen}>
                    ₹{Number(selectedPoolForEntry?.winningPrize || selectedPoolForEntry?.winPrize || 1000).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Tournament Rounds</Text>
                  <Text style={styles.modalDetailValueGold}>
                    {selectedPoolForEntry?.roundsCount || 10} Rounds
                  </Text>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Wallet Balance</Text>
                  <Text
                    style={[
                      styles.modalDetailValue,
                      Number(balance) < (selectedPoolForEntry?.entryFee || (isMegaSelected ? 200 : 10))
                        ? styles.textRed
                        : styles.textGreen,
                    ]}
                  >
                    ₹{Number(balance).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Balance State Message */}
              {Number(balance) < (selectedPoolForEntry?.entryFee || (isMegaSelected ? 200 : 10)) ? (
                <View style={styles.modalNoticeBoxWarning}>
                  <Ionicons name="warning-outline" size={16} color="#FFA500" />
                  <Text style={styles.modalNoticeTextWarning}>
                    Insufficient balance! You will be redirected to add money first.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalNoticeBoxSuccess}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#00E676" />
                  <Text style={styles.modalNoticeTextSuccess}>
                    Sufficient balance! You will proceed to select your card.
                  </Text>
                </View>
              )}

              {/* Action Buttons: NO / YES */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setConfirmModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>NO, CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={confirmAndProceedEntry}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#00E676', '#007E33']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.modalConfirmGradient}
                  >
                    <Text style={styles.modalConfirmBtnText}>YES, ENTER</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainBackground: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    marginTop: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6c0606',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  chainDecorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  chainSvg: {
    position: 'absolute',
    top: 0,
  },
  chainStar: {
    position: 'absolute',
    top: 9,
  },
  walletBtn: {
    backgroundColor: '#EAA015',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF5C2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  walletBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerLine: {
    height: 1,
    width: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.6)',
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginHorizontal: 10,
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loader: {
    marginTop: 40,
  },

  // ── Featured Daily Mega Pool Card ──
  megaPoolContainer: {
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#FFD700',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  megaRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  megaRibbonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  megaRibbonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  countryTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countryTagText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 11,
  },
  megaBody: {
    padding: 12,
  },
  megaScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  scheduleBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  oncePerDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  oncePerDayText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '800',
  },
  megaMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  megaPrizeWrap: {
    flex: 1,
  },
  megaPrizeLabel: {
    color: '#E5E7EB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  megaPrizeAmount: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  megaEntryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  megaEntryBtnDisabled: {
    opacity: 0.85,
    shadowOpacity: 0,
    elevation: 0,
  },
  megaEntryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  prizeTiersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  tierBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  tierRank: {
    color: '#F3F4F6',
    fontSize: 10,
    fontWeight: '800',
  },
  tierPrize: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  tierMult: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  megaProgressSection: {
    marginTop: 2,
  },
  megaProgressBarTrack: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  megaProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  megaSpotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  megaSpotsJoined: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  megaSpotsMax: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
  },
  megaNextOpenText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Multi-Tier Contest Cards ──
  poolCardContainer: {
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 12,
    marginBottom: 12,
  },
  regularPoolContainer: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    backgroundColor: 'rgba(12, 24, 14, 0.92)',
  },
  hourlyPoolContainer: {
    borderColor: 'rgba(96, 165, 250, 0.35)',
    backgroundColor: 'rgba(15, 20, 30, 0.92)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444444',
  },
  regularSlotBadge: {
    backgroundColor: '#14532D',
    borderColor: '#22C55E',
  },
  hourlySlotBadge: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
  },
  slotBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryBadgeSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countryBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  hourlyTimerBadge: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  timerBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  hourlyTimerBadgeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '800',
  },
  timerUrgent: {
    color: '#FF4444',
  },
  entryBtnDisabled: {
    opacity: 0.7,
  },
  mainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prizeSection: {
    flex: 1,
  },
  prizeLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  prizeValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  entryFeeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  entryFeeBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  regularPrizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.18)',
  },
  regularTierBox: {
    flex: 1,
    alignItems: 'center',
  },
  regularTierRank: {
    color: '#D1D5DB',
    fontSize: 9,
    fontWeight: '800',
  },
  regularTierPrize: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  spotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spotsFilledText: {
    color: '#FFA800',
    fontSize: 10,
    fontWeight: '700',
  },
  spotsTotalText: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  footerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerTagText: {
    color: '#CCCCCC',
    fontSize: 10,
    fontWeight: '600',
  },
  guaranteedText: {
    color: '#00C853',
    fontSize: 10,
    fontWeight: '800',
  },

  /* ── Confirmation Modal Styles ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 22,
  },
  modalTopBar: {
    height: 5,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  modalIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  modalSubTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  modalDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalDetailLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  modalDetailValueGold: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
  },
  modalDetailValueGreen: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: '900',
  },
  modalDetailValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  textGreen: {
    color: '#00E676',
  },
  textRed: {
    color: '#FF5252',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  modalNoticeBoxWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#FFA500',
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  modalNoticeTextWarning: {
    color: '#FFA500',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  modalNoticeBoxSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: '#00E676',
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  modalNoticeTextSuccess: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 18,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalConfirmBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
