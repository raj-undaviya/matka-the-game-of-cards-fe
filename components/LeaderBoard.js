import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    StyleSheet,
    StatusBar,
    Dimensions,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

const MOCK_LEADERS = [
    {
        rank: 1,
        username: 'Aravind_Pro',
        points: '145,200',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=60',
        title: '🥇 Grand Master',
        avatarColor: 'rgba(255, 215, 0, 0.1)',
    },
    {
        rank: 2,
        username: 'Sneha_K',
        points: '128,450',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=60',
        title: '🥈 Master',
        avatarColor: 'rgba(192, 192, 192, 0.1)',
    },
    {
        rank: 3,
        username: 'Rajesh_Matka',
        points: '112,900',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&auto=format&fit=crop&q=60',
        title: '🥉 Elite',
        avatarColor: 'rgba(205, 127, 50, 0.1)',
    },
    {
        rank: 4,
        username: 'Priya_Darshini',
        points: '95,600',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=60',
        title: 'Pro Player',
        avatarColor: 'rgba(255, 255, 255, 0.05)',
    },
    {
        rank: 5,
        username: 'Amit_Sharma',
        points: '89,400',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60',
        title: 'Expert',
        avatarColor: 'rgba(255, 255, 255, 0.05)',
    },
    {
        rank: 6,
        username: 'MatkaQueen',
        points: '78,250',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60',
        title: 'Expert',
        avatarColor: 'rgba(255, 255, 255, 0.05)',
    },
    {
        rank: 7,
        username: 'LuckyStrike',
        points: '74,100',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=60',
        title: 'Challenger',
        avatarColor: 'rgba(255, 255, 255, 0.05)',
    },
    {
        rank: 8,
        username: 'Vikram_R',
        points: '62,800',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=60',
        title: 'Challenger',
        avatarColor: 'rgba(255, 255, 255, 0.05)',
    },
];

export default function LeaderboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [balance, setBalance] = useState(0);
    const [leaders, setLeaders] = useState(MOCK_LEADERS);

    useEffect(() => {
        // Fetch current wallet balance
        apiService.getWalletBalance()
            .then(res => setBalance(res.balance))
            .catch(err => console.log('Error fetching balance:', err));

        // Dynamic insert of current user if they are not in the mock list
        if (user && user.username) {
            const exists = MOCK_LEADERS.some(l => l.username.toLowerCase() === user.username.toLowerCase());
            if (!exists) {
                // Add active user at rank 9
                const updated = [
                    ...MOCK_LEADERS,
                    {
                        rank: 9,
                        username: user.username,
                        points: '4,500',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60',
                        title: 'Novice (You)',
                        avatarColor: 'rgba(255, 168, 0, 0.15)',
                        isCurrentUser: true,
                    }
                ];
                setLeaders(updated);
            }
        }
    }, [user]);

    const topThree = leaders.filter(l => l.rank <= 3).sort((a, b) => {
        // Return order: Rank 2, Rank 1, Rank 3 for layout presentation
        const order = [2, 1, 3];
        return order.indexOf(a.rank) - order.indexOf(b.rank);
    });

    const remainingLeaders = leaders.filter(l => l.rank > 3);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#2E0002" />
            <LinearGradient colors={['#2E0002', '#0F0203']} style={styles.gradient}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonWrap}>
                        <Ionicons name="arrow-back" size={22} color="#FFA800" />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>LEADERBOARD</Text>
                    <View style={styles.coinBalance}>
                        <Text style={styles.coinText}>🪙 {Number(balance).toLocaleString()}</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Podium Visual Section */}
                    <View style={styles.podiumContainer}>
                        {topThree.map((item) => {
                            const isFirst = item.rank === 1;
                            const isSecond = item.rank === 2;
                            const isThird = item.rank === 3;

                            let podiumHeight = 100;
                            let scale = 0.9;
                            let borderColor = '#CD7F32';

                            if (isFirst) {
                                podiumHeight = 135;
                                scale = 1.1;
                                borderColor = '#FFD700';
                            } else if (isSecond) {
                                podiumHeight = 115;
                                scale = 1.0;
                                borderColor = '#C0C0C0';
                            }

                            return (
                                <View key={item.rank} style={[styles.podiumCol, { transform: [{ scale }] }]}>
                                    {/* Avatar Container with Rank Medal overlay */}
                                    <View style={styles.podiumAvatarOuter}>
                                        {isFirst && (
                                            <View style={styles.crownContainer}>
                                                <MaterialCommunityIcons name="crown" size={22} color="#FFD700" />
                                            </View>
                                        )}
                                        <View style={[styles.podiumAvatarCircle, { borderColor }]}>
                                            <Image source={{ uri: item.avatar }} style={styles.podiumAvatarImage} />
                                        </View>
                                        <View style={[styles.podiumRankBadge, { backgroundColor: borderColor }]}>
                                            <Text style={styles.podiumRankText}>{item.rank}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.podiumUsername} numberOfLines={1}>
                                        {item.username}
                                    </Text>

                                    <Text style={styles.podiumPoints}>
                                        {item.points} pts
                                    </Text>

                                    {/* Podium Base Stand */}
                                    <LinearGradient
                                        colors={
                                            isFirst ? ['rgba(255, 215, 0, 0.22)', 'rgba(255, 168, 0, 0.05)'] :
                                                isSecond ? ['rgba(192, 192, 192, 0.15)', 'rgba(255, 255, 255, 0.02)'] :
                                                    ['rgba(205, 127, 50, 0.15)', 'rgba(255, 255, 255, 0.02)']
                                        }
                                        style={[styles.podiumBase, { height: podiumHeight }]}
                                    >
                                        <Text style={styles.podiumStandRank}>{item.rank}</Text>
                                    </LinearGradient>
                                </View>
                            );
                        })}
                    </View>

                    {/* Leaderboard Table (Transaction History styling match) */}
                    <View style={styles.tableOuterContainer}>
                        {/* Gold coin overlapping the top-right card edge */}
                        

                        <LinearGradient
                            colors={['rgba(78, 8, 8, 0.85)', 'rgba(30, 3, 3, 0.95)']}
                            style={styles.cardContent}
                        >
                            {/* Header Title with lines before and after */}
                            <View style={styles.tableHeaderContainer}>
                                <View style={styles.tableHeaderLine} />
                                <Text style={styles.tableHeaderTitle}>STANDINGS</Text>
                                <View style={styles.tableHeaderLine} />
                            </View>

                            {/* Table List */}
                            <View style={styles.listContainer}>
                                {remainingLeaders.map((item, index) => {
                                    const isCur = item.isCurrentUser;
                                    return (
                                        <View
                                            key={item.rank}
                                            style={[
                                                styles.rowContainer,
                                                isCur && styles.rowContainerHighlighted
                                            ]}
                                        >
                                            {/* Left: Rank & Photo */}
                                            <View style={styles.rankCol}>
                                                <Text style={styles.rankText}>{item.rank}</Text>
                                            </View>

                                            <View style={[styles.avatarCircle, { backgroundColor: item.avatarColor }]}>
                                                <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                                            </View>

                                            {/* Middle: Username & Subtitle */}
                                            <View style={styles.userInfoCol}>
                                                <Text style={[styles.usernameText, isCur && { color: '#FFA800' }]} numberOfLines={1}>
                                                    {item.username}
                                                </Text>
                                                <Text style={styles.titleText} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                            </View>

                                            {/* Right: Points */}
                                            <View style={styles.pointsCol}>
                                                <Text style={styles.pointsLabel}>SCORE</Text>
                                                <Text style={styles.pointsValue}>
                                                    {item.points} pts
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </LinearGradient>
                    </View>

                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2E0002',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
    },
    gradient: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 168, 0, 0.3)',
    },
    backButtonWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    backButtonText: {
        color: '#FFA800',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFA800',
        letterSpacing: 1.5,
    },
    coinBalance: {
        backgroundColor: 'rgba(255, 168, 0, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    coinText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 13,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },

    // Podium Styles
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginVertical: 20,
        paddingHorizontal: 8,
    },
    podiumCol: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    podiumAvatarOuter: {
        position: 'relative',
        alignItems: 'center',
        marginBottom: 8,
    },
    crownContainer: {
        position: 'absolute',
        top: -18,
        zIndex: 10,
    },
    podiumAvatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    podiumAvatarImage: {
        width: '100%',
        height: '100%',
    },
    podiumRankBadge: {
        position: 'absolute',
        bottom: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    podiumRankText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 10,
    },
    podiumUsername: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 6,
        maxWidth: 90,
    },
    podiumPoints: {
        color: '#FFA800',
        fontSize: 11,
        fontWeight: '900',
        marginTop: 2,
        marginBottom: 8,
    },
    podiumBase: {
        width: '100%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomWidth: 0,
    },
    podiumStandRank: {
        color: 'rgba(255,255,255,0.22)',
        fontSize: 32,
        fontWeight: '900',
    },

    // Table Styles matching TransactionHistory
    tableOuterContainer: {
        position: 'relative',
        marginTop: 10,
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
        borderRadius: 24,
        padding: 16,
        width: '100%',
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 8,
    },
    tableHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    tableHeaderLine: {
        flex: 1,
        height: 1.2,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    tableHeaderTitle: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: 12,
        letterSpacing: 1.5,
    },
    listContainer: {
        width: '100%',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    rowContainerHighlighted: {
        borderColor: '#FFA800',
        backgroundColor: 'rgba(255, 168, 0, 0.08)',
    },
    rankCol: {
        width: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    rankText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 'bold',
        fontSize: 13,
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userInfoCol: {
        flex: 1,
        marginLeft: 10,
    },
    usernameText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    titleText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        marginTop: 2,
    },
    pointsCol: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    pointsLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    pointsValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFA800',
        marginTop: 2,
    },
});
