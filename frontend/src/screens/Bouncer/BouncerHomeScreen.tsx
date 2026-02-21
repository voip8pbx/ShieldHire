import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, FlatList, PermissionsAndroid, Platform, Linking } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../services/api';
import Geolocation from 'react-native-geolocation-service';

interface BouncerBooking {
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

export default function BouncerHomeScreen() {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState<BouncerBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [sosLoading, setSosLoading] = useState(false);
    const [locationName, setLocationName] = useState('Mumbai, India');

    useEffect(() => {
        const socket = io(BASE_URL);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('new-alert', (newAlert: any) => {
            if (newAlert.userId === user?.id) return; // Don't alert self if testing on same device/account

            Alert.alert(
                '🚨 EMERGENCY ALERT 🚨',
                `${newAlert.user?.name || 'Someone'} needs help!\nLocation: ${newAlert.location || 'Unknown'}\n\nCoordinate: ${newAlert.latitude?.toFixed(4)}, ${newAlert.longitude?.toFixed(4)}`,
                [
                    { text: 'OK', onPress: () => console.log('Alert acknowledged') }
                ],
                { cancelable: false }
            );
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        fetchPendingBookings();
        getCurrentLocation();
    }, []);

    const getCurrentLocation = () => {
        if (Platform.OS === 'android') {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(granted => {
                if (granted) {
                    setLocationName('Locating...');
                    Geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;

                            try {
                                // Basic reverse geocoding using OpenStreetMap Nominatim (Free, no key required for low usage)
                                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                                    headers: {
                                        'User-Agent': 'ShieldHireApp/1.0'
                                    }
                                });
                                const data = await response.json();
                                if (data && data.address) {
                                    const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Location';
                                    const country = data.address.country || '';
                                    setLocationName(`${city}, ${country}`);
                                } else {
                                    setLocationName(`Lat: ${latitude.toFixed(2)}, Long: ${longitude.toFixed(2)}`);
                                }
                            } catch (err) {
                                console.log('Reverse geocoding error:', err);
                                setLocationName(`Lat: ${latitude.toFixed(2)}, Long: ${longitude.toFixed(2)}`);
                            }
                        },
                        (error) => {
                            console.log(error.code, error.message);
                            setLocationName('Location Unavailable');
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                } else {
                    setLocationName('Permission Denied');
                }
            });
        }
    };

    const fetchPendingBookings = async () => {
        try {
            const response = await api.get('/bookings/pending');
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            // Alert.alert('Error', 'Failed to load booking requests');
        } finally {
            setLoading(false);
        }
    };

    const handleBookingResponse = async (id: string, status: 'CONFIRMED' | 'REJECTED') => {
        try {
            await api.patch(`/bookings/${id}/status`, { status });
            Alert.alert('Success', `Booking ${status.toLowerCase()} successfully`);
            fetchPendingBookings(); // Refresh list
        } catch (error) {
            console.error(`Failed to ${status} booking:`, error);
            Alert.alert('Error', `Failed to ${status.toLowerCase()} booking`);
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        }

        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission Required",
                        message: "ShieldHire needs access to your location to send accurate SOS alerts to the control room.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    return true;
                } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                    Alert.alert(
                        'Permission Required',
                        'Location permission is required for SOS. Please enable it in app settings.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() }
                        ]
                    );
                    return false;
                } else {
                    return false;
                }
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return false;
    };

    const sendSOS = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Location permission is required for SOS.');
            return;
        }

        setSosLoading(true);

        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await api.post('/api/alerts', {
                        location: `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`,
                        latitude,
                        longitude
                    });
                    Alert.alert('Alert Sent', 'Admin has been notified of your emergency and location.');
                } catch (error) {
                    console.error('Failed to send SOS:', error);
                    Alert.alert('Error', 'Failed to send SOS alert');
                } finally {
                    setSosLoading(false);
                }
            },
            (error) => {
                console.log(error.code, error.message);
                Alert.alert('Error', 'Failed to get location: ' + error.message);
                setSosLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleSOS = async () => {
        Alert.alert(
            'SOS Alert',
            'Are you sure you want to send an emergency alert to the admin dashboard?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'SEND ALERT',
                    style: 'destructive',
                    onPress: sendSOS
                }
            ]
        );
    };

    const renderBookingItem = ({ item }: { item: BouncerBooking }) => (
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
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PENDING</Text>
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

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleBookingResponse(item.id, 'REJECTED')}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}>Deny</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleBookingResponse(item.id, 'CONFIRMED')}
                >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#202020" />

            {/* Header */}
            <View style={styles.headerContainer}>
                {/* Top Row */}
                <View style={styles.topRow}>
                    <View style={styles.logoAndTitle}>
                        <View style={styles.logoBox}>
                            <MaterialCommunityIcons name="shield-account" size={26} color="#FFD700" />
                        </View>
                        <View>
                            <Text style={styles.appName}>SHIELD<Text style={{ color: '#FFD700' }}>HIRE</Text></Text>
                            <Text style={styles.locationText}>{locationName}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notifBtn}>
                        <Ionicons name="notifications" size={22} color="#fff" />
                        <View style={styles.redDot} />
                    </TouchableOpacity>
                </View>

                {/* Hero Text */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.heroTitle}>Welcome Back,{'\n'}<Text style={{ color: '#FFD700' }}>{user?.name || 'Officer'}</Text></Text>
                </View>

                {/* Status/Role Badge - Moved here as a summary card or pill */}
                <View style={styles.statusRow}>
                    <View style={styles.rolePill}>
                        <MaterialCommunityIcons name="shield-check" size={16} color="#000" />
                        <Text style={styles.rolePillText}>{user?.role || 'BOUNCER'}</Text>
                    </View>
                    <View style={styles.statusPill}>
                        <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
                        <Text style={styles.statusPillText}>Active Status</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Booking Requests</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 50 }} />
                ) : bookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="calendar-check-outline" size={60} color="#333" />
                        <Text style={styles.emptyText}>No pending requests</Text>
                        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPendingBookings}>
                            <Text style={styles.refreshBtnText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderBookingItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>

            {/* SOS Button */}
            <TouchableOpacity
                style={[styles.sosButton, sosLoading && styles.sosLoading]}
                onPress={handleSOS}
                disabled={sosLoading}
            >
                {sosLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="alert-octagon" size={30} color="#fff" />
                        <Text style={styles.sosText}>SOS</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    // Header Styles
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 10,
        marginBottom: 5,
        backgroundColor: '#202020',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: 44,
        height: 44,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    appName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    locationText: {
        fontSize: 12,
        color: '#888',
    },
    notifBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    redDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Status Row
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
    },
    rolePillText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusPillText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '600',
    },

    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        paddingBottom: 100, // Space for FAB
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
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    statusText: {
        color: '#FFC107',
        fontSize: 10,
        fontWeight: 'bold',
    },
    bookingDetails: {
        backgroundColor: '#121212',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
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
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    rejectBtn: {
        backgroundColor: '#D32F2F',
    },
    acceptBtn: {
        backgroundColor: '#388E3C',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
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
    sosButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#ff0000',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        borderWidth: 3,
        borderColor: '#fff',
    },
    sosLoading: {
        opacity: 0.7,
    },
    sosText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
});
