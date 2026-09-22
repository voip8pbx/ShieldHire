import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Linking, Platform, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import api from '../services/api';

const mapStyle = [
  { "elementType": "geometry", "stylers": [{"color": "#212121"}] },
  { "elementType": "labels.icon", "stylers": [{"visibility": "off"}] },
  { "elementType": "labels.text.fill", "stylers": [{"color": "#757575"}] },
  { "elementType": "labels.text.stroke", "stylers": [{"color": "#212121"}] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{"color": "#757575"}] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{"color": "#181818"}] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{"color": "#2c2c2c"}] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{"color": "#8a8a8a"}] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{"color": "#000000"}] }
];

type BouncerBookingDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BouncerBookingDetail'>;
type BouncerBookingDetailScreenRouteProp = RouteProp<RootStackParamList, 'BouncerBookingDetail'>;

type Props = {
    navigation: BouncerBookingDetailScreenNavigationProp;
    route: BouncerBookingDetailScreenRouteProp;
};

interface BookingDetail {
    id: string;
    date: string;
    time: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    duration: number;
    totalPrice: number;
    status: string;
    paymentStatus?: string;
    user: {
        id: string;
        name: string;
        contactNo: string;
        email: string;
        profilePhoto: string | null;
    };
}

export default function BouncerBookingDetailScreen({ navigation, route }: Props) {
    const { bookingId } = route.params;
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [isStarted, setIsStarted] = useState(true);

    useEffect(() => {
        fetchBookingDetail();
    }, [bookingId]);

    const fetchBookingDetail = async () => {
        try {
            const response = await api.get(`/bookings/${bookingId}`);
            setBooking(response.data);
        } catch (error: any) {
            console.error('Failed to fetch booking detail:', error);
            Alert.alert('Error', 'Could not load booking details. You might not have permission to view this assignment.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!booking) return;

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
            const time24 = convertTo24Hour(booking.time);
            const dateTimeStr = `${booking.date.split('T')[0]}T${time24}:00`;
            const eventTime = new Date(dateTimeStr).getTime();
            const now = new Date().getTime();
            const difference = eventTime - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    mins: Math.floor((difference / 1000 / 60) % 60),
                    secs: Math.floor((difference / 1000) % 60)
                });
                setIsStarted(false);
                return true;
            } else {
                setIsStarted(true);
                return false;
            }
        };

        const isFuture = calculateTimeLeft();
        
        let timer: NodeJS.Timeout;
        if (isFuture) {
            timer = setInterval(calculateTimeLeft, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [booking]);

    const openInMaps = () => {
        if (!booking?.latitude || !booking?.longitude) return;
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${booking.latitude},${booking.longitude}`;
        const label = 'Event Venue';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) Linking.openURL(url);
    };

    const handleStatusUpdate = async (newStatus: 'CONFIRMED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED') => {
        try {
            setLoading(true);
            await api.patch(`/bookings/${booking?.id}/status`, { status: newStatus });
            Alert.alert('Success', `Shift status updated to ${newStatus.toLowerCase()}.`);
            fetchBookingDetail(); // Reload booking
        } catch (error) {
            console.error('Failed to update status:', error);
            Alert.alert('Error', 'Failed to update booking status.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Fetching Assignment...</Text>
            </View>
        );
    }

    if (!booking) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assignment Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Status Indicator for Confirmed Bookings */}
                {booking.status === 'CONFIRMED' && (
                    <View style={styles.confirmedBadgeContainer}>
                        <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                        <Text style={styles.confirmedBadgeText}>ASSIGNMENT CONFIRMED</Text>
                    </View>
                )}

                {/* Reverse Timer Section */}
                {!isStarted && (
                    <View style={styles.timerSection}>
                        <Text style={styles.timerHeader}>EVENT STARTING IN</Text>
                        <View style={styles.timerGrid}>
                            <View style={styles.timerUnit}>
                                <Text style={styles.timerValue}>{timeLeft.days}</Text>
                                <Text style={styles.timerLabel}>Days</Text>
                            </View>
                            <View style={styles.timerUnit}>
                                <Text style={styles.timerValue}>{String(timeLeft.hours).padStart(2, '0')}</Text>
                                <Text style={styles.timerLabel}>Hrs</Text>
                            </View>
                            <View style={styles.timerUnit}>
                                <Text style={styles.timerValue}>{String(timeLeft.mins).padStart(2, '0')}</Text>
                                <Text style={styles.timerLabel}>Mins</Text>
                            </View>
                            <View style={styles.timerUnit}>
                                <Text style={styles.timerValue}>{String(timeLeft.secs).padStart(2, '0')}</Text>
                                <Text style={styles.timerLabel}>Secs</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Chat Button */}
                <TouchableOpacity
                    style={styles.chatButtonContainer}
                    onPress={() => (navigation as any).navigate('Chat', { bookingId: booking.id })}
                >
                    <Ionicons name="chatbubbles-outline" size={22} color="#000" />
                    <Text style={styles.chatButtonText}>CHAT & DISCUSS DETAILS</Text>
                </TouchableOpacity>

                {/* Client Info */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="account-tie" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Client Information</Text>
                    </View>
                    <View style={styles.clientRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{booking.user.name.substring(0, 1).toUpperCase()}</Text>
                        </View>
                        <View style={styles.clientInfo}>
                            <Text style={styles.clientName}>{booking.user.name}</Text>
                            <Text style={styles.clientEmail}>{booking.user.email}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.callBtn}
                            onPress={() => Linking.openURL(`tel:${booking.user.contactNo}`)}
                        >
                            <Ionicons name="call" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Event Schedule */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Schedule & Payout</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>DATE</Text>
                            <Text style={styles.scheduleValue}>{new Date(booking.date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>START TIME</Text>
                            <Text style={styles.scheduleValue}>{booking.time}</Text>
                        </View>
                    </View>
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>DURATION</Text>
                            <Text style={styles.scheduleValue}>{booking.duration} Hours</Text>
                        </View>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>EST. PAYOUT</Text>
                            <Text style={[styles.scheduleValue, { color: '#FFD700' }]}>₹{booking.totalPrice}</Text>
                        </View>
                    </View>
                </View>

                {/* Location Map */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="map-marker-radius" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Precise Location</Text>
                    </View>
                    <Text style={styles.locationText}>{booking.location}</Text>
                    
                    {booking.latitude !== null && booking.longitude !== null && !isNaN(Number(booking.latitude)) && !isNaN(Number(booking.longitude)) ? (
                        <View style={styles.mapWrapper}>
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                liteMode={true}
                                googleRenderer="LATEST"
                                style={styles.map}
                                initialRegion={{
                                    latitude: Number(booking.latitude),
                                    longitude: Number(booking.longitude),
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                loadingEnabled={true}
                                customMapStyle={mapStyle}
                            >
                                <Marker coordinate={{ 
                                    latitude: Number(booking.latitude), 
                                    longitude: Number(booking.longitude) 
                                }} />
                            </MapView>
                            <TouchableOpacity style={styles.mapOverlay} onPress={openInMaps}>
                                <Ionicons name="navigate-circle" size={40} color="#FFD700" />
                                <Text style={styles.mapOverlayText}>Open Navigation</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.noMap}>
                            <Text style={styles.noMapText}>Exact coordinates not provided by client.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 20 }} />

                {booking.status === 'PENDING' && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rejectButton]} 
                            onPress={() => handleStatusUpdate('REJECTED')}
                        >
                            <Ionicons name="close-circle" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>REJECT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.acceptButton]} 
                            onPress={() => handleStatusUpdate('CONFIRMED')}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                            <Text style={[styles.actionButtonText, { color: '#000' }]}>ACCEPT</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'CONFIRMED' && (
                    <View style={styles.actionButtonsContainer}>
                        {booking.paymentStatus === 'PAID' ? (
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.acceptButton]} 
                                onPress={() => handleStatusUpdate('ACTIVE')}
                            >
                                <Ionicons name="play-circle" size={20} color="#000" />
                                <Text style={[styles.actionButtonText, { color: '#000' }]}>START SHIFT</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.pendingPaymentBanner}>
                                <Ionicons name="time-outline" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                                <Text style={styles.pendingPaymentText}>Waiting for client payment verification...</Text>
                            </View>
                        )}
                    </View>
                )}

                {booking.status === 'ACTIVE' && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: '#4ade80' }]} 
                            onPress={() => handleStatusUpdate('COMPLETED')}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                            <Text style={[styles.actionButtonText, { color: '#000' }]}>COMPLETE SHIFT</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121214',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#121214',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#8E8E93',
        marginTop: 15,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#121214',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 15,
    },
    // Status Badge
    confirmedBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.08)',
        padding: 12,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.25)',
    },
    confirmedBadgeText: {
        color: '#4ade80',
        fontWeight: '800',
        fontSize: 12,
        marginLeft: 8,
        letterSpacing: 1,
    },
    // Timer
    timerSection: {
        backgroundColor: '#1A1A1E',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.25)',
    },
    timerHeader: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 15,
    },
    timerGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    timerUnit: {
        alignItems: 'center',
        flex: 1,
    },
    timerValue: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '800',
    },
    timerLabel: {
        color: '#888',
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    // Cards
    card: {
        backgroundColor: '#1A1A1E',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#121214',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    avatarText: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
    },
    clientInfo: {
        flex: 1,
        marginLeft: 15,
    },
    clientName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clientEmail: {
        color: '#888',
        fontSize: 12,
    },
    callBtn: {
        backgroundColor: '#FFD700',
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    scheduleItem: {
        flex: 1,
    },
    scheduleLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    scheduleValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    locationText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 15,
    },
    mapWrapper: {
        height: 180,
        borderRadius: 15,
        // overflow: 'hidden', // Some Android devices crash when overflow: 'hidden' is used with MapView
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapOverlayText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
    },
    noMap: {
        height: 100,
        backgroundColor: '#121214',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    noMapText: {
        color: '#444',
        fontSize: 12,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 24,
        marginHorizontal: 5,
    },
    rejectButton: {
        backgroundColor: '#ef4444',
    },
    acceptButton: {
        backgroundColor: '#FFD700',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },
    chatButtonContainer: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 24,
        marginHorizontal: 16,
        marginVertical: 12,
    },
    chatButtonText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },
    pendingPaymentBanner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        marginHorizontal: 5,
    },
    pendingPaymentText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
