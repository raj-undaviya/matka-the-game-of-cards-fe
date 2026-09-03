import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TransactionHistory({
  transactions = [],
  activeTab = 'all',
  onTabChange,
}) {
  const tabs = [
    { key: 'all', label: 'Lasseo', icon: 'card-bulleted-outline' },
    { key: 'deposit', label: 'Deposit', icon: 'arrow-down-bold-box-outline' },
    { key: 'withdraw', label: 'Withdraw', icon: 'arrow-up-bold-box-outline' },
    { key: 'bonus', label: 'Bonus', icon: 'gift-outline' },
    { key: 'refund', label: 'Refund', icon: 'history' },
  ];

  return (
    <View style={styles.outerContainer}>
      {/* Gold coin overlapping the top-right card edge */}
      <View style={styles.coinBadgeContainer}>
        <Text style={styles.coinBadgeText}>🪙</Text>
      </View>

      <LinearGradient
        colors={['rgba(78, 8, 8, 0.85)', 'rgba(30, 3, 3, 0.95)']}
        style={styles.cardContent}
      >
        {/* Header Title with lines before and after */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLine} />
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Top Filter Bar (Level 1) */}
        <View style={styles.topFilterBar}>
          <TouchableOpacity 
            style={[styles.topFilterPill, activeTab === 'all' && styles.topFilterPillActive]} 
            onPress={() => onTabChange && onTabChange('all')}
          >
            <MaterialCommunityIcons 
              name="lock-outline" 
              size={12} 
              color={activeTab === 'all' ? '#FFA800' : 'rgba(255,255,255,0.5)'} 
              style={{ marginRight: 4 }} 
            />
            <Text style={[styles.topFilterLabel, activeTab === 'all' && styles.topFilterLabelActive]}>All cards</Text>
          </TouchableOpacity>
        </View>

        {/* Tab / Filter Row (Level 2) */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabActive]}
                onPress={() => onTabChange && onTabChange(tab.key)}
              >
                {isActive && <View style={styles.activeDot} />}
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sub-Filter Row */}
        <View style={styles.subFilterRow}>
          {/* Left Side Chevron Dropdown */}
          <TouchableOpacity style={styles.subFilterLeft}>
            <MaterialCommunityIcons name="checkbox-blank-outline" size={12} color="#FFA800" style={{ marginRight: 5 }} />
            <Text style={styles.subFilterText}>Full card on Logo</Text>
          </TouchableOpacity>

          {/* Right Side Options */}
          <View style={styles.subFilterRightContainer}>
            <TouchableOpacity style={styles.glassPill}>
              <MaterialCommunityIcons name="shield-check-outline" size={11} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} />
              <Text style={styles.glassPillText}>Update status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.glassPill}>
              <MaterialCommunityIcons name="wallet-outline" size={11} color="rgba(255,255,255,0.6)" style={{ marginRight: 4 }} />
              <Text style={styles.glassPillText}>$41,900</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal Divider */}
        <View style={styles.divider} />

        {/* Transactions list */}
        <View style={styles.listContainer}>
          {transactions.map((txn, index) => {
            return (
              <TouchableOpacity key={txn.id || index} style={styles.txnRow} activeOpacity={0.75}>
                {/* Left Avatar Icon container */}
                <View style={[styles.avatarCircle, { backgroundColor: txn.avatarColor || 'rgba(255,255,255,0.05)' }]}>
                  <Text style={styles.avatarEmoji}>🪙</Text>
                </View>

                {/* Middle content info */}
                <View style={styles.txnInfo}>
                  <Text style={styles.txnTitle} numberOfLines={1}>
                    {txn.title}
                  </Text>
                  <Text style={styles.txnSub} numberOfLines={1}>
                    {txn.subtitle}
                  </Text>
                </View>

                {/* Right content status & amount */}
                <View style={styles.txnRight}>
                  <Text style={[styles.statusLabel, txn.statusColor ? { color: txn.statusColor } : null]}>
                    {txn.displayStatus || txn.status || 'WON'}
                  </Text>
                  <Text style={[styles.amountText, { color: txn.color || '#22c55e' }]}>
                    {txn.amount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {transactions.length === 0 && (
            <Text style={styles.emptyText}>No transactions found</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    marginTop: 16,
    width: '100%',
  },
  coinBadgeContainer: {
    position: 'absolute',
    top: -8,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  coinBadgeText: {
    fontSize: 12,
  },
  cardContent: {
    borderRadius: 10,
    padding: 16,
    width: '100%',
    // No outer border!
    borderWidth: 0,
    // Shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerLine: {
    flex: 1,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  topFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  topFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  topFilterPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  topFilterLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  topFilterLabelActive: {
    color: '#FFA800',
    fontWeight: '700',
  },
  topFilterRightText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginLeft: 'auto',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFA800',
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFA800',
    marginRight: 5,
  },
  subFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subFilterText: {
    color: '#FFA800',
    fontSize: 11,
    fontWeight: '600',
  },
  subFilterRightContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  glassPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
    marginBottom: 12,
  },
  listContainer: {
    width: '100%',
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 15,
  },
  txnInfo: {
    flex: 1,
    marginLeft: 10,
  },
  txnTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  txnSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 12,
  },
});
