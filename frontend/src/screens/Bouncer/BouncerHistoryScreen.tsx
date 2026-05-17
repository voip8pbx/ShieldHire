import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

interface BookingHistory {
    id: string;
    date: string;
    time?: string;
    location?: string;
    duration?: number;
    totalPrice?: number;
    status: string;
    user: {
        name: string;
        contactNo?: string;
        email: string;
        profilePhoto?: string;
    };
}

// Separate component for the live countdown timer
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

            if (modifier.toUpperCase() === 'PM' && hrs < 12) {
                hrs += 12;
            }
            if (modifier.toUpperCase() === 'AM' && hrs === 12) {
                hrs = 0;
            }

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

    if (!timeLeft) return <Text style={styles.timerFinished}>Event Started</Text>;

    return (
        <View style={styles.timerContainer}>
            <View style={styles.timerSegment}>
                <Text style={styles.timerVal}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>hrs</Text>
            </View>
            <Text style={styles.timerDivider}>:</Text>
            <View style={styles.timerSegment}>
                <Text style={styles.timerVal}>{String(timeLeft.mins).padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>min</Text>
            </View>
            <Text style={styles.timerDivider}>:</Text>
            <View style={styles.timerSegment}>
                <Text style={styles.timerVal}>{String(timeLeft.secs).padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>sec</Text>
            </View>
        </View>
    );
};

export default function BouncerHistoryScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [history, setHistory] = useState<BookingHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/bookings/bouncer/history');
            setHistory(response.data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
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
        return eventDate >= now && item.status !== 'REJECTED' && item.status !== 'CANCELLED';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastEvents = history.filter(item => {
        const eventDate = new Date(item.date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return eventDate < now || item.status === 'REJECTED' || item.status === 'CANCELLED';
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const renderHistoryItem = ({ item, isUpcoming = false }: { item: BookingHistory, isUpcoming?: boolean }) => {
        const isConfirmed = item.status === 'CONFIRMED';
        const isRejected = item.status === 'REJECTED' || item.status === 'CANCELLED';

        return (
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('BouncerBookingDetail', { bookingId: item.id })}
                style={[styles.bookingCard, isUpcoming && styles.upcomingCard]}
            >
                {isUpcoming && (
                    <View style={styles.upcomingBadge}>
                        <MaterialCommunityIcons name="clock-fast" size={14} color="#000" />
                        <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
                    </View>
                )}

                <View style={styles.bookingHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{item.user.name.substring(0, 1).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            <Text style={styles.userSubtext}>Client Contact</Text>
                        </View>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        isConfirmed ? styles.statusConfirmed : (isRejected ? styles.statusRejected : styles.statusPending)
                    ]}>
                        <Text style={[
                            styles.statusText,
                            isConfirmed ? styles.textConfirmed : (isRejected ? styles.textRejected : styles.textPending)
                        ]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {isUpcoming && isConfirmed && (
                    <View style={styles.timerSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <MaterialCommunityIcons name="bell-ring" size={16} color="#FFD700" />
                            <Text style={styles.timerTitle}>Time to Destination</Text>
                        </View>
                        <CountdownTimer targetDate={item.date} targetTime={item.time || '00:00'} />
                        <Text style={styles.timerSubtext}>* Please reach the location 30 mins before the scheduled time.</Text>
                    </View>
                )}

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="calendar" size={16} color="#FFD700" />
                        </View>
                        <Text style={styles.detailText}>
                            {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                        <View style={[styles.iconBox, { marginLeft: 20 }]}>
                            <Ionicons name="time" size={16} color="#FFD700" />
                        </View>
                        <Text style={styles.detailText}>
                            {item.time || 'TBD'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="location" size={16} color="#FFD700" />
                        </View>
                        <Text style={styles.detailText} numberOfLines={1}>
                            {item.location || 'Location shared privately'}
                        </Text>
                    </View>

                    <View style={styles.payoutRow}>
                        <View style={styles.durationBox}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#888" />
                            <Text style={styles.durationText}>{item.duration || 0} Hours Shift</Text>
                        </View>
                        <View style={styles.payoutAmountContainer}>
                            <Text style={styles.payoutLabel}>PAYOUT</Text>
                            <Text style={styles.payoutAmount}>₹{item.totalPrice || 0}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Assignment Dashboard</Text>
                <Text style={styles.headerSubtitle}>Manage your upcoming and past bookings</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Syncing Schedule...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {upcomingEvents.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionLine} />
                                <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
                                <View style={styles.sectionLine} />
                            </View>
                            {upcomingEvents.map(item => (
                                <View key={item.id}>
                                    {renderHistoryItem({ item, isUpcoming: true })}
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionLine} />
                            <Text style={styles.sectionTitle}>JOB HISTORY</Text>
                            <View style={styles.sectionLine} />
                        </View>

                        {pastEvents.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="clipboard-text-clock-outline" size={40} color="#333" />
                                <Text style={styles.emptyText}>No previous job records found</Text>
                            </View>
                        ) : (
                            pastEvents.map(item => (
                                <View key={item.id}>
                                    {renderHistoryItem({ item, isUpcoming: false })}
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 25,
        backgroundColor: '#161616',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#888',
        marginTop: 15,
        fontSize: 14,
    },
    section: {
        marginTop: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        opacity: 0.6,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333',
    },
    sectionTitle: {
        color: '#888',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 2,
        paddingHorizontal: 15,
    },
    bookingCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    upcomingCard: {
        borderColor: '#FFD700',
        backgroundColor: '#252525',
    },
    upcomingBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    upcomingBadgeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#444',
    },
    avatarText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 20,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
    },
    userSubtext: {
        color: '#666',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusConfirmed: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.5)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 160, 0, 0.1)',
        borderColor: 'rgba(255, 160, 0, 0.5)',
    },
    statusRejected: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    textConfirmed: {
        color: '#4ade80',
    },
    textPending: {
        color: '#ffb74d',
    },
    textRejected: {
        color: '#f87171',
    },
    timerSection: {
        backgroundColor: '#161616',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    timerTitle: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
    },
    timerSegment: {
        alignItems: 'center',
        width: 50,
    },
    timerVal: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    timerLabel: {
        color: '#666',
        fontSize: 9,
        textTransform: 'uppercase',
    },
    timerDivider: {
        color: '#333',
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 5,
        marginTop: -15,
    },
    timerSubtext: {
        color: '#666',
        fontSize: 10,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
    timerFinished: {
        color: '#4ade80',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    bookingDetails: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailText: {
        color: '#bbb',
        marginLeft: 12,
        fontSize: 14,
        flex: 1,
    },
    payoutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
    },
    durationBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationText: {
        color: '#888',
        fontSize: 12,
        marginLeft: 6,
    },
    payoutAmountContainer: {
        alignItems: 'flex-end',
    },
    payoutLabel: {
        fontSize: 9,
        color: '#666',
        fontWeight: 'bold',
    },
    payoutAmount: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFD700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#161616',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: '#444',
        marginTop: 10,
        fontSize: 14,
    },
});
