import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Linking, Platform, Alert, Image, Modal, TextInput } from 'react-native';

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
    userNotes?: string;
    transactionId?: string;
    paymentStatus?: string;
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
    const [rateModalVisible, setRateModalVisible] = useState(false);
    const [selectedRating, setSelectedRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    const handleRateSubmit = async () => {
        try {
            setSubmittingRating(true);
            const res = await api.post(`/bookings/${bookingId}/rate`, { rating: selectedRating, reviewText });
            Alert.alert('Rating Submitted! ⭐', `Thank you! Guard rating updated to ${res.data?.newRating || selectedRating}.`);
            setRateModalVisible(false);
        } catch (e: any) {
            Alert.alert('Notice', e.response?.data?.error || 'Failed to submit rating');
        } finally {
            setSubmittingRating(false);
        }
    };


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

    const handleCancel = async () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.patch(`/bookings/${bookingId}/status`, { status: 'CANCELLED' });
                            Alert.alert('Success', 'Booking has been cancelled.');
                            fetchBookingDetail();
                        } catch (error) {
                            console.error('Failed to cancel booking:', error);
                            Alert.alert('Error', 'Failed to cancel booking.');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
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
                    booking.status === 'ACTIVE' ? styles.statusActiveBg :
                    booking.status === 'COMPLETED' ? styles.statusConfirmedBg :
                    booking.status === 'PENDING' ? styles.statusPendingBg : styles.statusCancelledBg
                ]}>
                    <Ionicons 
                        name={
                            booking.status === 'CONFIRMED' ? "checkmark-circle" :
                            booking.status === 'ACTIVE' ? "flash" :
                            booking.status === 'COMPLETED' ? "checkmark-done-circle" :
                            booking.status === 'PENDING' ? "time" : "close-circle"
                        } 
                        size={20} 
                        color={
                            booking.status === 'CONFIRMED' ? "#4ade80" :
                            booking.status === 'ACTIVE' ? "#38bdf8" :
                            booking.status === 'COMPLETED' ? "#4ade80" :
                            booking.status === 'PENDING' ? "#fbbf24" : "#ef4444"
                        } 
                    />
                    <Text style={[
                        styles.statusBadgeText,
                        booking.status === 'CONFIRMED' ? styles.statusConfirmedText :
                        booking.status === 'ACTIVE' ? styles.statusActiveText :
                        booking.status === 'COMPLETED' ? styles.statusConfirmedText :
                        booking.status === 'PENDING' ? styles.statusPendingText : styles.statusCancelledText
                    ]}>
                        {booking.status}
                    </Text>
                </View>

                {/* Chat Button */}
                <TouchableOpacity
                    style={styles.chatButtonContainer}
                    onPress={() => (navigation as any).navigate('Chat', { bookingId: booking.id })}
                >
                    <Ionicons name="chatbubbles-outline" size={22} color="#000" />
                    <Text style={styles.chatButtonText}>CHAT & DISCUSS DETAILS</Text>
                </TouchableOpacity>

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
                {(booking.userNotes || booking.notes) && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={20} color="#FFD700" />
                            <Text style={styles.cardTitle}>Special Instructions</Text>
                        </View>
                        <Text style={styles.notesText}>{booking.userNotes || booking.notes}</Text>
                    </View>
                )}

                {/* Payment Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="card" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Payment Details</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Amount Paid</Text>
                        <Text style={[styles.detailValue, { color: '#FFD700', fontWeight: 'bold' }]}>₹{booking.totalPrice}</Text>
                    </View>
                    {booking.transactionId ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>UPI Transaction ID</Text>
                            <Text style={[styles.detailValue, { fontFamily: 'monospace' }]}>{booking.transactionId}</Text>
                        </View>
                    ) : null}
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Verification</Text>
                        <Text style={[
                            styles.detailValue, 
                            { 
                                color: booking.paymentStatus === 'PAID' ? '#4ade80' : 
                                       booking.paymentStatus === 'FAILED' ? '#ef4444' : '#fbbf24',
                                fontWeight: 'bold'
                            }
                        ]}>
                            {booking.paymentStatus || 'PENDING'}
                        </Text>
                    </View>
                </View>
                
                {/* Booking Reference */}
                <View style={styles.referenceContainer}>
                    <Text style={styles.referenceLabel}>Booking Reference ID</Text>
                    <Text style={styles.referenceText}>{booking.id}</Text>
                </View>

                {/* Rate Security Guard Action */}
                {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                    <TouchableOpacity
                        style={styles.rateGuardBtn}
                        onPress={() => setRateModalVisible(true)}
                        activeOpacity={0.88}
                    >
                        <Ionicons name="star" size={20} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.rateGuardBtnText}>RATE SECURITY GUARD</Text>
                    </TouchableOpacity>
                )}

                {/* Cancel Booking Action */}
                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <TouchableOpacity 
                        style={[styles.cancelButton, { marginTop: 12 }]} 
                        onPress={handleCancel}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>CANCEL BOOKING</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Interactive Rating Modal */}
            <Modal
                visible={rateModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setRateModalVisible(false)}
            >
                <View style={styles.rateModalOverlay}>
                    <View style={styles.rateModalContent}>
                        <TouchableOpacity style={styles.rateModalCloseBtn} onPress={() => setRateModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#aaa" />
                        </TouchableOpacity>

                        <MaterialCommunityIcons name="star-circle" size={54} color="#FFD700" style={{ alignSelf: 'center', marginBottom: 8 }} />
                        <Text style={styles.rateModalTitle}>Rate Security Guard</Text>
                        <Text style={styles.rateModalSub}>How was your security service experience with {booking.bouncer?.name || 'your guard'}?</Text>

                        {/* Interactive Stars */}
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity key={s} onPress={() => setSelectedRating(s)} style={{ padding: 4 }}>
                                    <Ionicons
                                        name={s <= selectedRating ? "star" : "star-outline"}
                                        size={36}
                                        color={s <= selectedRating ? "#FFD700" : "#555"}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Review Comment Input */}
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Add a feedback review (optional)..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={3}
                            value={reviewText}
                            onChangeText={setReviewText}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitRateBtn}
                            onPress={handleRateSubmit}
                            disabled={submittingRating}
                            activeOpacity={0.88}
                        >
                            {submittingRating ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text style={styles.submitRateBtnText}>SUBMIT RATING & NOTIFY GUARD</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#070708',
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
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        borderColor: 'rgba(52, 199, 89, 0.2)',
    },
    statusPendingBg: {
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        borderColor: 'rgba(255, 149, 0, 0.2)',
    },
    statusCancelledBg: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderColor: 'rgba(255, 59, 48, 0.2)',
    },
    statusBadgeText: {
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
        letterSpacing: 1,
    },
    statusConfirmedText: {
        color: '#34C759',
    },
    statusPendingText: {
        color: '#FF9500',
    },
    statusCancelledText: {
        color: '#FF3B30',
    },
    // Cards
    card: {
        backgroundColor: '#121214',
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
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
        color: '#8E8E93',
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
        borderColor: 'rgba(255, 255, 255, 0.04)',
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
    statusActiveBg: {
        backgroundColor: 'rgba(90, 200, 250, 0.1)',
        borderColor: 'rgba(90, 200, 250, 0.2)',
    },
    statusActiveText: {
        color: '#5AC8FA',
    },
    chatButtonContainer: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        marginHorizontal: 16,
        marginVertical: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    chatButtonText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 14,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 10,
        letterSpacing: 1,
    },
    rateGuardBtn: {
        backgroundColor: '#FFD700',
        borderRadius: 14,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        elevation: 4,
    },
    rateGuardBtnText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    rateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    rateModalContent: {
        width: '100%',
        backgroundColor: '#161618',
        borderRadius: 22,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        position: 'relative',
    },
    rateModalCloseBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 10,
    },
    rateModalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    rateModalSub: {
        fontSize: 13,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    reviewInput: {
        backgroundColor: '#222226',
        borderRadius: 14,
        padding: 14,
        color: '#fff',
        fontSize: 14,
        height: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    submitRateBtn: {
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    submitRateBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        color: '#888',
        fontSize: 14,
    },
    detailValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
