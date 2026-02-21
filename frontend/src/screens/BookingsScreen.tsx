import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Platform } from 'react-native';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function BookingsScreen() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                // If backend is same, endpoint is same
                const response = await api.get('/bookings');
                setBookings(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.bouncerName}>{item.bouncer?.name || 'Security Detail'}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.status}>{item.status}</Text>
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
        </View >
    );

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
    bouncerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statusBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    status: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
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
});
