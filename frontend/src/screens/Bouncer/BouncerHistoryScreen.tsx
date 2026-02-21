import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

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

export default function BouncerHistoryScreen() {
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

    const renderHistoryItem = ({ item }: { item: BookingHistory }) => {
        const isConfirmed = item.status === 'CONFIRMED';
        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{item.user.name.substring(0, 1).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            <Text style={styles.userSubtext}>Client</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, isConfirmed ? styles.statusConfirmed : styles.statusRejected]}>
                        <Text style={[styles.statusText, isConfirmed ? styles.textConfirmed : styles.textRejected]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color="#FFD700" />
                        <Text style={styles.detailText}>
                            {new Date(item.date).toLocaleDateString()}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#FFD700" style={{ marginLeft: 20 }} />
                        <Text style={styles.detailText}>
                            {item.time || 'N/A'}
                        </Text>
                    </View>
                    <View style={[styles.detailRow, { justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="timer-sand" size={20} color="#FFD700" />
                            <Text style={styles.detailText}>
                                {item.duration || 0} Hours
                            </Text>
                        </View>
                        <View style={styles.payoutBadge}>
                            <Text style={styles.payoutLabel}>Earnings: </Text>
                            <Text style={styles.payoutAmount}>₹{item.totalPrice || 0}</Text>
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#FFD700" />
                        <Text style={styles.detailText}>
                            {item.location || 'No location provided'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#202020" />
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Job History</Text>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 50 }} />
                ) : history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="clipboard-text-clock-outline" size={60} color="#333" />
                        <Text style={styles.emptyText}>No previous job history available</Text>
                        <TouchableOpacity style={styles.refreshBtn} onPress={fetchHistory}>
                            <Text style={styles.refreshBtnText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        renderItem={renderHistoryItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 5,
        backgroundColor: '#202020',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    bookingCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    avatarText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 18,
    },
    userName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    userSubtext: {
        color: '#888',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
    },
    statusConfirmed: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
    },
    statusRejected: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderColor: '#F44336',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    textConfirmed: {
        color: '#4CAF50',
    },
    textRejected: {
        color: '#F44336',
    },
    bookingDetails: {
        backgroundColor: '#121212',
        borderRadius: 8,
        padding: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        color: '#ccc',
        marginLeft: 10,
        fontSize: 14,
    },
    payoutBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    payoutLabel: {
        fontSize: 11,
        color: '#888',
    },
    payoutAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#666',
        marginTop: 10,
        fontSize: 16,
    },
    refreshBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#333',
        borderRadius: 20,
    },
    refreshBtnText: {
        color: '#fff',
    },
});
