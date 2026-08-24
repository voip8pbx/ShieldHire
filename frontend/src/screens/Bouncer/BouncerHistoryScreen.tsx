import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
    RefreshControl, StatusBar, ScrollView, Linking, Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { AuthContext } from '../../context/AuthContext';

interface BookingHistory {
    id: string;
    date: string;
    time?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    duration?: number;
    totalPrice?: number;
    status: string;
    package?: string;
    notes?: string;
    clientName?: string;
    clientContactNo?: string;
    user: {
        name: string;
        contactNo?: string;
        email: string;
        profilePhoto?: string;
    };
}

// Tactical Digital Countdown Clock Component
const CountdownTimer = ({ targetDate, targetTime }: { targetDate: string, targetTime: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: number, mins: number, secs: number } | null>(null);

    useEffect(() => {
        const convertTo24Hour = (timeStr: string) => {
            if (!timeStr) return '00:00';
            const isAMPM = timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm');
            if (!isAMPM) return timeStr;

            const parts = timeStr.split(' ');
            const time = parts[0];
            const modifier = parts[1] || '';
            let [hours, minutes] = time.split(':');
            let hrs = parseInt(hours, 10);

            if (modifier.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
            if (modifier.toUpperCase() === 'AM' && hrs === 12) hrs = 0;

            return `${hrs.toString().padStart(2, '0')}:${minutes}`;
        };

        const calculateTimeLeft = () => {
            try {
                const time24 = convertTo24Hour(targetTime);
                const dateTimeStr = `${targetDate.split('T')[0]}T${time24}:00`;
                const eventTime = new Date(dateTimeStr).getTime();
                const now = new Date().getTime();
                const difference = eventTime - now;

                if (difference > 0) {
                    setTimeLeft({
                        hours: Math.floor((difference / (1000 * 60 * 60))),
                        mins: Math.floor((difference / 1000 / 60) % 60),
                        secs: Math.floor((difference / 1000) % 60)
                    });
                } else {
                    setTimeLeft(null);
                }
            } catch (e) {
                setTimeLeft(null);
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, [targetDate, targetTime]);

    if (!timeLeft) {
        return (
            <View style={styles.timerFinishedBox}>
                <Ionicons name="checkmark-circle" size={14} color="#4ade80" style={{ marginRight: 6 }} />
                <Text style={styles.timerFinishedText}>Shift Active / Event Started</Text>
            </View>
        );
    }

    return (
        <View style={styles.clockContainer}>
            <View style={styles.clockPill}>
                <Text style={styles.clockVal}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                <Text style={styles.clockUnit}>HRS</Text>
            </View>
            <Text style={styles.clockColon}>:</Text>
            <View style={styles.clockPill}>
                <Text style={styles.clockVal}>{String(timeLeft.mins).padStart(2, '0')}</Text>
                <Text style={styles.clockUnit}>MIN</Text>
            </View>
            <Text style={styles.clockColon}>:</Text>
            <View style={styles.clockPill}>
                <Text style={styles.clockVal}>{String(timeLeft.secs).padStart(2, '0')}</Text>
                <Text style={styles.clockUnit}>SEC</Text>
            </View>
        </View>
    );
};

const HistoryCardBouncer = React.memo(({ item, isUpcoming = false, navigation }: { item: BookingHistory, isUpcoming?: boolean, navigation: any }) => {
    const isConfirmed = item.status === 'CONFIRMED';
    const cleanClientName = (item.user?.name || item.clientName || 'Client User').replace(/\s+\d{10,}$/, '');
    const contactNo = item.user?.contactNo || item.clientContactNo;

    const openNavigationMaps = () => {
        if (item.latitude && item.longitude) {
            const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
            const latLng = `${item.latitude},${item.longitude}`;
            const label = 'Event Venue';
            const url = Platform.select({
                ios: `${scheme}${label}@${latLng}`,
                android: `${scheme}${latLng}(${label})`
            });
            if (url) Linking.openURL(url);
        } else if (item.location) {
            const query = encodeURIComponent(item.location);
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => navigation.navigate('BouncerBookingDetail', { bookingId: item.id })}
            style={[styles.bookingCard, isUpcoming && styles.upcomingCard]}
        >
            {/* Top Bar: Client & Status */}
            <View style={styles.cardHeaderRow}>
                <View style={styles.clientInfoWrap}>
                    <LinearGradient
                        colors={isUpcoming ? ['#FFD700', '#B8860B'] : ['#2C2C30', '#1C1C1E']}
                        style={styles.avatarCircle}
                    >
                        <Text style={[styles.avatarLetter, !isUpcoming && { color: '#ccc' }]}>
                            {cleanClientName.substring(0, 1).toUpperCase()}
                        </Text>
                    </LinearGradient>
                    <View>
                        <Text style={styles.clientNameText} numberOfLines={1}>{cleanClientName}</Text>
                        <Text style={styles.clientSubtext}>Client Duty Contact</Text>
                    </View>
                </View>

                <View style={styles.actionsRightRow}>
                    {contactNo ? (
                        <TouchableOpacity
                            style={styles.callCircleBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                Linking.openURL(`tel:${contactNo}`);
                            }}
                        >
                            <Ionicons name="call" size={14} color="#000" />
                        </TouchableOpacity>
                    ) : null}

                    <View style={[
                        styles.statusPill,
                        item.status === 'CONFIRMED' || item.status === 'COMPLETED' ? styles.statusConfirmedBg :
                        item.status === 'ACTIVE' ? styles.statusActiveBg :
                        item.status === 'REJECTED' || item.status === 'CANCELLED' ? styles.statusRejectedBg :
                        styles.statusPendingBg
                    ]}>
                        <Text style={[
                            styles.statusPillText,
                            item.status === 'CONFIRMED' || item.status === 'COMPLETED' ? styles.statusConfirmedText :
                            item.status === 'ACTIVE' ? styles.statusActiveText :
                            item.status === 'REJECTED' || item.status === 'CANCELLED' ? styles.statusRejectedText :
                            styles.statusPendingText
                        ]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Countdown Box */}
            {isUpcoming && isConfirmed && (
                <View style={styles.countdownBox}>
                    <View style={styles.countdownHeaderRow}>
                        <Ionicons name="time" size={14} color="#FFD700" />
                        <Text style={styles.countdownTitle}>Time to Destination</Text>
                    </View>
                    <CountdownTimer targetDate={item.date} targetTime={item.time || '00:00'} />
                    <Text style={styles.countdownNotice}>* Reach location 30 mins before scheduled time.</Text>
                </View>
            )}

            {/* Date, Time & Venue Meta */}
            <View style={styles.dutyMetaSection}>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="rgba(255,215,0,0.8)" />
                        <Text style={styles.metaText}>
                            {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color="rgba(255,215,0,0.8)" />
                        <Text style={styles.metaText}>
                            {item.time || '10:00 AM'} <Text style={styles.metaShiftDuration}>({item.duration || 4}h Shift)</Text>
                        </Text>
                    </View>
                </View>

                <View style={[styles.metaRow, { marginTop: 4 }]}>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color="rgba(255,215,0,0.8)" />
                        <Text style={styles.metaText} numberOfLines={1}>
                            {item.location || 'Location shared privately'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Card Footer: Payout & Actions */}
            <View style={styles.cardFooterBar}>
                <View>
                    <Text style={styles.payoutLabel}>PAYOUT</Text>
                    <Text style={styles.payoutValue}>₹{item.totalPrice || 2000}</Text>
                </View>

                {isUpcoming ? (
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={styles.chatActionBtn}
                            onPress={() => navigation.navigate('BouncerBookingDetail', { bookingId: item.id })}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chatbubbles-outline" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                            <Text style={styles.chatActionBtnText}>Duty Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={{ overflow: 'hidden', borderRadius: 12 }} 
                            onPress={openNavigationMaps}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.navActionBtn}
                            >
                                <Ionicons name="navigate-outline" size={14} color="#000" style={{ marginRight: 5 }} />
                                <Text style={styles.navActionBtnText}>Navigate</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.packageTag}>
                        <Text style={styles.packageTagText}>
                            {item.package === 'VIP_BODYGUARD' ? 'VIP ESCORT' : 'STANDARD SHIFT'}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
});

export default function BouncerHistoryScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState<BookingHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAST'>('ACTIVE');


    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/bookings/bouncer/history');
            setHistory(response.data || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
            setHistory([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const upcomingEvents = history.filter(item => {
        const eventDate = new Date(item.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return eventDate >= now && item.status !== 'REJECTED' && item.status !== 'CANCELLED' && item.status !== 'COMPLETED';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastEvents = history.filter(item => {
        const eventDate = new Date(item.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return eventDate < now || item.status === 'REJECTED' || item.status === 'CANCELLED' || item.status === 'COMPLETED';
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const completedCount = pastEvents.filter(t => t.status === 'COMPLETED').length;
    const totalEarnings = pastEvents.filter(t => t.status === 'COMPLETED').reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const displayRating = user?.bouncerProfile?.rating ? user.bouncerProfile.rating.toFixed(1) : '4.8';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            {/* Top Executive Header */}
            <View style={styles.topHeader}>
                <View style={styles.headerTitleRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {navigation.canGoBack() && (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
                                <Ionicons name="chevron-back" size={22} color="#fff" />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.headerTitleText}>Assignments</Text>
                    </View>

                    <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
                        <Ionicons name="refresh" size={16} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                {/* Segmented Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'ACTIVE' && styles.activeTabButton]}
                        onPress={() => setActiveTab('ACTIVE')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'ACTIVE' && styles.activeTabButtonText]}>
                            Active Duties
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'PAST' && styles.activeTabButton]}
                        onPress={() => setActiveTab('PAST')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'PAST' && styles.activeTabButtonText]}>
                            Past History
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Premium Metric Grid - Only on Past History tab */}
                {activeTab === 'PAST' && (
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#888" />
                            </View>
                            <Text style={styles.metricValText}>{completedCount}</Text>
                            <Text style={styles.metricLblText}>Shifts Done</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <MaterialCommunityIcons name="wallet-outline" size={14} color="#4ade80" />
                            </View>
                            <Text style={[styles.metricValText, { color: '#4ade80' }]}>₹{totalEarnings}</Text>
                            <Text style={styles.metricLblText}>Earnings</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <View style={styles.metricHeader}>
                                <MaterialCommunityIcons name="star-outline" size={14} color="#FFD700" />
                            </View>
                            <Text style={[styles.metricValText, { color: '#FFD700' }]}>{displayRating}</Text>
                            <Text style={styles.metricLblText}>Rating</Text>
                        </View>
                    </View>
                )}
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingMsg}>Loading Duty Assignments...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollBody}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab === 'ACTIVE' ? (
                        <View style={styles.sectionBlock}>
                            {upcomingEvents.length === 0 ? (
                                <View style={styles.activeEmptyCard}>
                                    <View style={styles.radarPulseContainer}>
                                        <View style={styles.radarRing1} />
                                        <View style={styles.radarRing2} />
                                        <MaterialCommunityIcons name="shield-key-outline" size={44} color="#FFD700" />
                                    </View>
                                    <Text style={styles.emptyTitle}>Ready for Duty</Text>
                                    <Text style={styles.emptyDesc}>
                                        No active duties scheduled right now. We'll send a push notification when a client hires you!
                                    </Text>
                                </View>
                            ) : (
                                upcomingEvents.map(item => (
                                    <HistoryCardBouncer key={item.id} item={item} isUpcoming={true} navigation={navigation} />
                                ))
                            )}
                        </View>
                    ) : (
                        <View style={styles.sectionBlock}>
                            {pastEvents.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <MaterialCommunityIcons name="clipboard-text-clock-outline" size={40} color="#444" />
                                    <Text style={styles.emptyTitle}>No Duty Records Yet</Text>
                                    <Text style={styles.emptyDesc}>Completed security assignments will be logged here.</Text>
                                </View>
                            ) : (
                                pastEvents.map(item => (
                                    <HistoryCardBouncer key={item.id} item={item} isUpcoming={false} navigation={navigation} />
                                ))
                            )}
                        </View>
                    )}

                    <View style={{ height: 130 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    topHeader: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 50,
        paddingHorizontal: 18,
        paddingBottom: 14,
        backgroundColor: '#0A0A0A',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtnHeader: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTitleText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    syncBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#161618',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#161618',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    metricValText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
    },
    metricLblText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#8E8E93',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingMsg: {
        color: '#888',
        fontSize: 13,
        marginTop: 12,
    },
    scrollBody: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 130,
    },
    sectionBlock: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    goldBarIndicator: {
        width: 3,
        height: 14,
        backgroundColor: '#FFD700',
        borderRadius: 2,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    countBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.25)',
    },
    bookingCard: {
        backgroundColor: '#161618',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    upcomingCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
        borderColor: 'rgba(255,215,0,0.15)',
        backgroundColor: '#1A1A1E',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    clientInfoWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarLetter: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
    },
    clientNameText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    clientSubtext: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 2,
    },
    actionsRightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    callCircleBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusConfirmedBg: {
        backgroundColor: 'rgba(74,222,128,0.12)',
        borderColor: 'rgba(74,222,128,0.25)',
    },
    statusConfirmedText: {
        color: '#4ade80',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statusActiveBg: {
        backgroundColor: 'rgba(90,200,250,0.12)',
        borderColor: 'rgba(90,200,250,0.25)',
    },
    statusActiveText: {
        color: '#5AC8FA',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statusRejectedBg: {
        backgroundColor: 'rgba(248,113,113,0.12)',
        borderColor: 'rgba(248,113,113,0.25)',
    },
    statusRejectedText: {
        color: '#f87171',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statusPendingBg: {
        backgroundColor: 'rgba(251,191,36,0.12)',
        borderColor: 'rgba(251,191,36,0.25)',
    },
    statusPendingText: {
        color: '#fbbf24',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '900',
    },
    countdownBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.12)',
    },
    countdownHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    countdownTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFD700',
    },
    clockContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    clockPill: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 56,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    clockVal: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    clockUnit: {
        fontSize: 8,
        fontWeight: '800',
        color: '#8E8E93',
        marginTop: 2,
    },
    clockColon: {
        color: 'rgba(255,215,0,0.6)',
        fontSize: 18,
        fontWeight: '900',
        marginHorizontal: 8,
    },
    timerFinishedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    timerFinishedText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '800',
    },
    countdownNotice: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    dutyMetaSection: {
        gap: 6,
        marginBottom: 14,
        paddingVertical: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 16,
    },
    metaText: {
        fontSize: 12,
        color: '#E5E5EA',
        fontWeight: '600',
    },
    metaShiftDuration: {
        fontSize: 11,
        color: '#8E8E93',
    },
    cardFooterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    payoutLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        textTransform: 'uppercase',
    },
    payoutValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFD700',
        marginTop: 1,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chatActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E22',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    chatActionBtnText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '800',
    },
    navActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    navActionBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
    },
    packageTag: {
        backgroundColor: 'rgba(255,215,0,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    packageTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFD700',
    },
    emptyCard: {
        backgroundColor: '#161618',
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
        marginTop: 10,
    },
    emptyDesc: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 4,
        marginTop: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTabButton: {
        backgroundColor: '#2C2C30',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
    },
    activeTabButtonText: {
        color: '#FFD700',
    },
    activeEmptyCard: {
        backgroundColor: '#161618',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginTop: 10,
    },
    radarPulseContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 16,
    },
    radarRing1: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 215, 0, 0.15)',
    },
    radarRing2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.06)',
    },
});

