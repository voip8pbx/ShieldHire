import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Linking, Platform, Alert, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import api from '../services/api';

type BookingDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingDetails'>;
type BookingDetailsScreenRouteProp = RouteProp<RootStackParamList, 'BookingDetails'>;

type Props = {
    navigation: BookingDetailsScreenNavigationProp;
    route: BookingDetailsScreenRouteProp;
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
    package?: string;
    notes?: string;
    clientName?: string;
    clientContactNo?: string;
    bouncer?: {
        id: string;
        name: string;
        contactNo: string;
        profilePhoto: string | null;
    };
    user?: {
        id: string;
        name: string;
        contactNo: string;
        email: string;
        profilePhoto: string | null;
    };
}

export default function BookingDetailsScreen({ navigation, route }: Props) {
    const { bookingId } = route.params;
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBookingDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/bookings/${bookingId}`);
            setBooking(response.data);
        } catch (error: any) {
            console.error('Failed to fetch booking detail:', error);
            Alert.alert('Error', 'Could not load booking details.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingDetail();
    }, [bookingId]);

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading Booking Details...</Text>
            </View>
        );
    }

    if (!booking) return null;

    const bouncerName = booking.bouncer?.name || 'Security Personnel';
    const bouncerContact = booking.bouncer?.contactNo || '';
    const bouncerPhoto = booking.bouncer?.profilePhoto;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Status Indicator */}
                <View style={[
                    styles.statusBadgeContainer,
                    booking.status === 'CONFIRMED' ? styles.statusConfirmedBg :
                    booking.status === 'PENDING' ? styles.statusPendingBg : styles.statusCancelledBg
                ]}>
                    <Ionicons 
                        name={
                            booking.status === 'CONFIRMED' ? "checkmark-circle" :
                            booking.status === 'PENDING' ? "time" : "close-circle"
                        } 
                        size={20} 
                        color={
                            booking.status === 'CONFIRMED' ? "#4ade80" :
                            booking.status === 'PENDING' ? "#fbbf24" : "#ef4444"
                        } 
                    />
                    <Text style={[
                        styles.statusBadgeText,
                        booking.status === 'CONFIRMED' ? styles.statusConfirmedText :
                        booking.status === 'PENDING' ? styles.statusPendingText : styles.statusCancelledText
                    ]}>
                        {booking.status}
                    </Text>
                </View>

                {/* Bouncer Info */}
                {booking.bouncer && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="shield-account" size={20} color="#FFD700" />
                            <Text style={styles.cardTitle}>Assigned Security</Text>
                        </View>
                        <View style={styles.personnelRow}>
                            {bouncerPhoto ? (
                                <Image source={{ uri: bouncerPhoto }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{bouncerName.substring(0, 1).toUpperCase()}</Text>
                                </View>
                            )}
                            
                            <View style={styles.personnelInfo}>
                                <Text style={styles.personnelName}>{bouncerName}</Text>
                            </View>
                            {bouncerContact ? (
                                <TouchableOpacity 
                                    style={styles.callBtn}
                                    onPress={() => Linking.openURL(`tel:${bouncerContact}`)}
                                >
                                    <Ionicons name="call" size={20} color="#000" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                )}

                {/* Event Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Event Schedule</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>DATE</Text>
                            <Text style={styles.scheduleValue}>{new Date(booking.date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>TIME</Text>
                            <Text style={styles.scheduleValue}>{booking.time}</Text>
                        </View>
                    </View>
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>DURATION</Text>
                            <Text style={styles.scheduleValue}>{booking.duration} Hours</Text>
                        </View>
                        <View style={styles.scheduleItem}>
                            <Text style={styles.scheduleLabel}>TOTAL PRICE</Text>
                            <Text style={[styles.scheduleValue, { color: '#FFD700' }]}>₹{booking.totalPrice}</Text>
                        </View>
                    </View>
                    {/* Package row */}
                    <View style={styles.packageRow}>
                        <Text style={styles.scheduleLabel}>PACKAGE</Text>
                        <View style={[
                            styles.packageBadge,
                            booking.package === 'VIP_BODYGUARD' && styles.packageBadgeVip,
                        ]}>
                            <Ionicons
                                name={booking.package === 'VIP_BODYGUARD' ? 'shield' : 'shield-outline'}
                                size={12}
                                color={booking.package === 'VIP_BODYGUARD' ? '#000' : '#FFD700'}
                            />
                            <Text style={[
                                styles.packageBadgeText,
                                booking.package === 'VIP_BODYGUARD' && { color: '#000' },
                            ]}>
                                {booking.package === 'VIP_BODYGUARD' ? 'VIP Bodyguard' : 'Single Event Shift'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Location Map */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="map-marker-radius" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Event Location</Text>
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
                    ) : null}
                </View>
                
                {/* Notes / Special Instructions */}
                {booking.notes && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={20} color="#FFD700" />
                            <Text style={styles.cardTitle}>Special Instructions</Text>
                        </View>
                        <Text style={styles.notesText}>{booking.notes}</Text>
                    </View>
                )}
                
                {/* Booking Reference */}
                <View style={styles.referenceContainer}>
                    <Text style={styles.referenceLabel}>Booking Reference ID</Text>
                    <Text style={styles.referenceText}>{booking.id}</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0F0F0F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#888',
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
        backgroundColor: '#1E1E1E',
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
    statusBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
    },
    statusConfirmedBg: {
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        borderColor: 'rgba(74, 222, 128, 0.4)',
    },
    statusPendingBg: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderColor: 'rgba(251, 191, 36, 0.4)',
    },
    statusCancelledBg: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    statusBadgeText: {
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
        letterSpacing: 1,
    },
    statusConfirmedText: {
        color: '#4ade80',
    },
    statusPendingText: {
        color: '#fbbf24',
    },
    statusCancelledText: {
        color: '#ef4444',
    },
    // Cards
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    personnelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    avatarText: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
    },
    personnelInfo: {
        flex: 1,
        marginLeft: 15,
    },
    personnelName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
        borderWidth: 1,
        borderColor: '#333',
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
    notesText: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 22,
    },
    referenceContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    referenceLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    referenceText: {
        color: '#444',
        fontSize: 10,
    },
    packageRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    packageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    packageBadgeVip: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    packageBadgeText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
});
