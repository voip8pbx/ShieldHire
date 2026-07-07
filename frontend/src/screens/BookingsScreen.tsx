import React, { useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const BookingCardClient = React.memo(({ item, navigation }: { item: any, navigation: any }) => {
    const bouncerId = item.bouncer?.id || item.bouncerId;

    const handlePress = () => {
        if (item.id) {
            navigation.navigate('BookingDetails', { bookingId: item.id } as any);
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={handlePress}
            activeOpacity={item.id ? 0.75 : 1}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.bouncerName}>{item.bouncer?.name || 'Security Detail'}</Text>
                <View style={styles.headerRight}>
                    <View style={[styles.statusBadge, item.status === 'CONFIRMED' && styles.statusConfirmed, item.status === 'PENDING' && styles.statusPending, item.status === 'CANCELLED' && styles.statusCancelled]}>
                        <Text style={[styles.status, item.status === 'PENDING' && styles.statusTextPending, item.status === 'CANCELLED' && styles.statusTextCancelled]}>{item.status}</Text>
                    </View>
                    {bouncerId && (
                        <Ionicons name="chevron-forward" size={18} color="#FFD700" style={{ marginLeft: 8 }} />
                    )}
                </View>
            </View>
            <View style={styles.row}>
                <Ionicons name="calendar-outline" size={16} color="#888" />
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
                <Ionicons name="time-outline" size={16} color="#888" />
                <Text style={styles.date}>{item.time} ({item.duration} hrs)</Text>
            </View>
            <View style={styles.row}>
                <Ionicons name="location-outline" size={16} color="#888" />
                <Text style={styles.date}>{item.location || 'N/A'}</Text>
            </View>
            <View style={styles.priceRow}>
                <Text style={styles.costLabel}>Total Cost</Text>
                <Text style={styles.price}>₹{item.totalPrice}</Text>
            </View>
        </TouchableOpacity>
    );
});

export default function BookingsScreen() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp<any>>();
    const { token, requireAuth } = useContext(AuthContext);
    const isGuest = token === 'guest_token';

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bookings');
            console.log(`[Bookings] Fetched ${response.data.length} records`);
            const sortedBookings = response.data.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.date).getTime();
                const dateB = new Date(b.createdAt || b.date).getTime();
                return dateB - dateA;
            });
            setBookings(sortedBookings);
        } catch (error) {
            console.error('[Bookings] Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            if (!isGuest) {
                fetchBookings();
            }
        }, [isGuest])
    );

    const renderItem = React.useCallback(({ item }: any) => {
        return <BookingCardClient item={item} navigation={navigation} />;
    }, [navigation]);

    if (isGuest) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
                <View style={styles.guestContainer}>
                    <View style={styles.guestIconWrap}>
                        <Ionicons name="shield-checkmark" size={72} color="#FFD700" />
                    </View>
                    <Text style={styles.guestTitle}>Your Hires Await</Text>
                    <Text style={styles.guestSubtitle}>Login to Hire Our Bouncers</Text>
                    <Text style={styles.guestDesc}>
                        Sign in to book professional security personnel, track your hires, and manage all your bookings in one place.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        activeOpacity={0.85}
                        onPress={() => requireAuth(navigation, 'Bookings')}
                    >
                        <Ionicons name="log-in-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.loginBtnText}>Login / Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
            <Text style={styles.header}>Confirmed Hires</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#FFD700" />
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shield-outline" size={64} color="#333" />
                            <Text style={styles.empty}>No security personnel hired yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 20,
        marginVertical: 20,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        padding: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bouncerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusConfirmed: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
    },
    statusPending: {
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
    },
    statusCancelled: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    status: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusTextPending: {
        color: '#fbbf24',
    },
    statusTextCancelled: {
        color: '#ef4444',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    date: {
        color: '#ccc',
        marginLeft: 8,
        fontSize: 14,
    },
    priceRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10,
    },
    costLabel: {
        color: '#888',
        fontSize: 12,
    },
    price: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    empty: {
        textAlign: 'center',
        marginTop: 16,
        color: '#666',
        fontSize: 16,
    },
    guestContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    guestIconWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.25)',
    },
    guestTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    guestSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFD700',
        marginBottom: 16,
        textAlign: 'center',
    },
    guestDesc: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 36,
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    loginBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
