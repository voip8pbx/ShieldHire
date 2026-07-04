import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, ActivityIndicator, FlatList, PermissionsAndroid, Platform, Linking, ScrollView, ImageBackground, Dimensions, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../services/api';
import Geolocation from 'react-native-geolocation-service';
import { notificationService } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingTooltip from '../../components/OnboardingTooltip';

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

const QUOTES = [
    "Security is not a product, but a process.",
    "Preparedness is the best protection.",
    "Safety starts with awareness.",
    "The best defense is early detection.",
    "Vigilance today saves lives tomorrow."
];

const FACTS = [
    "Professional bodyguards are trained to observe threats before they become visible.",
    "Situational awareness is one of the most important protective skills.",
    "VIP protection teams plan exit routes before arrival.",
    "Effective security relies on 90% preparation and 10% reaction.",
    "The finest security teams go unnoticed until they are needed."
];

const TESTIMONIALS = [
    { id: '1', name: "Rahul Sharma", text: "Booked a bodyguard within minutes. Professional and reliable service.", rating: 5 },
    { id: '2', name: "Priya Desai", text: "Felt incredibly safe during our corporate event. Highly recommended.", rating: 5 },
    { id: '3', name: "Amit Patel", text: "Top-notch VIP protection. The team was discreet and highly skilled.", rating: 5 },
];

const SERVICES = [
    { id: '1', title: "Personal Bodyguard", icon: "account-tie" },
    { id: '2', title: "Event Security", icon: "party-popper" },
    { id: '3', title: "Bouncer", icon: "shield-account" },
    { id: '4', title: "VIP Protection", icon: "star-circle" },
    { id: '5', title: "Female Officer", icon: "shield-half-full" },
];

const TRUST_INDICATORS = [
    { id: '1', title: "Verified Pro", icon: "check-decagram" },
    { id: '2', title: "Background Checked", icon: "text-box-check" },
    { id: '3', title: "24/7 Support", icon: "clock-check" },
    { id: '4', title: "Emergency Ready", icon: "car-emergency" },
];

const DUMMY_NOTIFICATIONS = [
    { id: '1', title: 'New VIP Assignment', message: 'You have been requested for an event in Downtown. Review details ASAP.', time: '2 mins ago', read: false, icon: 'star-circle' },
    { id: '2', title: 'System Alert', message: 'Please update your background verification documents to maintain Pro status.', time: '1 hour ago', read: false, icon: 'alert-decagram' },
    { id: '3', title: 'Payment Received', message: 'Earnings for your last assignment have been securely deposited.', time: 'Yesterday', read: true, icon: 'currency-usd' },
];

let hasShownHomeTooltipThisSession = false;

const BookingCardBouncer = React.memo(({ item, navigation, onResponse }: { item: BouncerBooking, navigation: any, onResponse: (id: string, status: 'CONFIRMED' | 'REJECTED') => void }) => {
    return (
        <TouchableOpacity
            style={styles.bookingCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BouncerBookingDetail', { bookingId: item.id })}
        >
            <View style={styles.bookingHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.user.name.substring(0, 1).toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.user.name}</Text>
                        <Text style={styles.userSubtext}>Priority Client</Text>
                    </View>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>NEW REQUEST</Text>
                </View>
            </View>

            <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color="#D4AF37" />
                    <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Ionicons name="time-outline" size={18} color="#D4AF37" style={{ marginLeft: 20 }} />
                    <Text style={styles.detailText}>{item.time || 'N/A'}</Text>
                </View>
                <View style={[styles.detailRow, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="timer-sand" size={18} color="#D4AF37" />
                        <Text style={styles.detailText}>{item.duration || 0} Hours</Text>
                    </View>
                    <View style={styles.payoutBadge}>
                        <Text style={styles.payoutLabel}>Est. Payout: </Text>
                        <Text style={styles.payoutAmount}>₹{item.totalPrice || 0}</Text>
                    </View>
                </View>
                <View style={[styles.detailRow, { marginBottom: 0 }]}>
                    <Ionicons name="location-outline" size={18} color="#D4AF37" />
                    <Text style={styles.detailText}>{item.location || 'Location Pending'}</Text>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => onResponse(item.id, 'REJECTED')}
                >
                    <Text style={[styles.btnText, { color: '#ef4444' }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => onResponse(item.id, 'CONFIRMED')}
                >
                    <Text style={[styles.btnText, { color: '#000' }]}>Accept Assignment</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

export default function BouncerHomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState<BouncerBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [sosLoading, setSosLoading] = useState(false);
    const [locationName, setLocationName] = useState('Locating...');

    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { width, height } = Dimensions.get('window');

    // Dynamic Content State
    const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const [fact] = useState(FACTS[Math.floor(Math.random() * FACTS.length)]);

    const openNotifications = () => {
        navigation.navigate('Notifications' as any);
    };

    const checkOnboarding = async () => {
        try {
            const isApproved = user?.bouncerProfile?.verificationStatus === 'APPROVED';
            const isProfileComplete = !!user?.bouncerProfile?.bio && (user?.bouncerProfile?.skills?.length || 0) > 0;
            
            if (isApproved && !isProfileComplete && !hasShownHomeTooltipThisSession) {
                hasShownHomeTooltipThisSession = true;
                setTimeout(() => setShowOnboarding(true), 1000);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const handleOnboardingNext = async () => {
        setShowOnboarding(false);
        navigation.navigate('Profile' as any);
    };

    const handleOnboardingSkip = async () => {
        setShowOnboarding(false);
    };

    useEffect(() => {
        const socket = io(BASE_URL);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('new-alert', (newAlert: any) => {
            if (newAlert.userId === user?.id) return;

            Alert.alert(
                '🚨 EMERGENCY ALERT 🚨',
                `${newAlert.user?.name || 'Someone'} needs help!\nLocation: ${newAlert.location || 'Unknown'}\n\nCoordinate: ${newAlert.latitude?.toFixed(4)}, ${newAlert.longitude?.toFixed(4)}`,
                [
                    { text: 'OK', onPress: () => console.log('Alert acknowledged') }
                ],
                { cancelable: false }
            );
        });

        socket.on('new-booking', async (data: any) => {
            if (data.bouncerId === user?.bouncerProfile?.id) {
                const bookingDate = new Date(data.booking.date).toLocaleDateString();
                await notificationService.displayBookingNotification(
                    data.clientName,
                    bookingDate,
                    data.booking.id
                );
                fetchPendingBookings();
            }
        });

        const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.ACTION_PRESS && detail.notification?.id) {
                const bookingId = detail.notification.data?.bookingId as string;
                if (!bookingId) return;

                if (detail.pressAction?.id === 'confirm') {
                    handleBookingResponse(bookingId, 'CONFIRMED');
                    notifee.cancelNotification(detail.notification.id);
                } else if (detail.pressAction?.id === 'decline') {
                    handleBookingResponse(bookingId, 'REJECTED');
                    notifee.cancelNotification(detail.notification.id);
                }
            }
        });

        return () => {
            socket.disconnect();
            unsubscribeNotifee();
        };
    }, [user?.bouncerProfile?.id]);

    useEffect(() => {
        fetchPendingBookings();
        getCurrentLocation();
        notificationService.requestPermission();
        checkOnboarding();
    }, []);

    const getCurrentLocation = async () => {
        const hasPermission = await requestLocationPermission();
        if (hasPermission) {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                            headers: { 'User-Agent': 'ShieldOfSecurityApp/1.0' }
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
                        setLocationName(`Lat: ${latitude.toFixed(2)}, Long: ${longitude.toFixed(2)}`);
                    }
                },
                (error) => setLocationName('Location Unavailable'),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } else {
            setLocationName('Permission Denied');
        }
    };

    const fetchPendingBookings = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/bookings/pending');
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleBookingResponse = React.useCallback(async (id: string, status: 'CONFIRMED' | 'REJECTED') => {
        try {
            await api.patch(`/bookings/${id}/status`, { status });
            Alert.alert('Success', `Booking ${status.toLowerCase()} successfully`);
            fetchPendingBookings();

            if (status === 'CONFIRMED') {
                navigation.navigate('BouncerBookingDetail', { bookingId: id });
            }
        } catch (error) {
            Alert.alert('Error', `Failed to ${status.toLowerCase()} booking`);
        }
    }, [navigation, fetchPendingBookings]);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') return await Geolocation.requestAuthorization('whenInUse') === 'granted';

        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission Required",
                        message: "Shield Of Security needs access to your location to send accurate SOS alerts.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
                if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                    Alert.alert('Permission Required', 'Location permission is required for SOS.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]);
                    return false;
                }
                return false;
            } catch (err) {
                return false;
            }
        }
        return false;
    };

    const sendSOS = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return Alert.alert('Permission Denied', 'Location permission is required for SOS.');

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
                    Alert.alert('SOS Sent', 'Admin has been notified of your emergency and location.');
                } catch (error) {
                    Alert.alert('Error', 'Failed to send SOS alert');
                } finally {
                    setSosLoading(false);
                }
            },
            (error) => {
                Alert.alert('Error', 'Failed to get location: ' + error.message);
                setSosLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleSOS = () => {
        Alert.alert('SOS Alert', 'Are you sure you want to send an emergency alert?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'SEND ALERT', style: 'destructive', onPress: sendSOS }
        ]);
    };

    // UI Renderers
    const headerComponent = React.useMemo(() => (
        <View style={styles.headerWrapper}>
            <View style={styles.topRow}>
                <View style={styles.logoAndTitle}>
                    <View style={styles.logoBox}>
                        <MaterialCommunityIcons name="shield-crown" size={24} color="#D4AF37" />
                    </View>
                    <View>
                        <Text style={styles.appName}>SHIELD<Text style={{ color: '#D4AF37' }}>HIRE</Text></Text>
                        <Text style={styles.locationText}>{locationName}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notifBtn} onPress={openNotifications} activeOpacity={0.8}>
                    <Ionicons name="notifications" size={22} color="#fff" />
                    <View style={styles.redDot} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <Text style={styles.heroGreeting}>Welcome Back,</Text>
                <Text style={styles.heroTitle}>{user?.name || 'Officer'}</Text>
                <Text style={styles.heroSubtitle}>Your Safety, Our Priority</Text>

                <TouchableOpacity style={styles.heroCTA} activeOpacity={0.8}>
                    <Text style={styles.heroCTAText}>Hire Trusted Security Professionals Instantly</Text>
                    <View style={styles.ctaArrow}>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
                    </View>
                </TouchableOpacity>

                <View style={styles.statusRow}>
                    <View style={styles.rolePill}>
                        <MaterialCommunityIcons name="shield-check" size={16} color="#000" />
                        <Text style={styles.rolePillText}>{user?.role || 'PREMIUM PRO'}</Text>
                    </View>
                    <View style={styles.statusPill}>
                        <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
                        <Text style={styles.statusPillText}>Online & Ready</Text>
                    </View>
                </View>
            </View>

            <View style={styles.trustSection}>
                {TRUST_INDICATORS.map(item => (
                    <View key={item.id} style={styles.trustItem}>
                        <View style={styles.trustIconWrap}>
                            <MaterialCommunityIcons name={item.icon} size={24} color="#D4AF37" />
                        </View>
                        <Text style={styles.trustText}>{item.title}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.servicesSection}>
                <Text style={styles.sectionHeader}>Services we Provide</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
                    {SERVICES.map(item => (
                        <TouchableOpacity key={item.id} style={styles.serviceCard} activeOpacity={0.8}>
                            <MaterialCommunityIcons name={item.icon} size={28} color="#D4AF37" />
                            <Text style={styles.serviceTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <Text style={[styles.sectionHeader, { paddingHorizontal: 20, marginTop: 10 }]}>Booking Requests</Text>

            {loading && <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 20, marginBottom: 20 }} />}

            {!loading && bookings.length === 0 && (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={60} color="#333" />
                    <Text style={styles.emptyText}>No pending assignments right now.</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchPendingBookings}>
                        <Text style={styles.refreshBtnText}>Refresh List</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    ), [locationName, user, loading, bookings.length, fetchPendingBookings]);

    const footerComponent = React.useMemo(() => (
        <View style={styles.footerWrapper}>
            {/* Thought of the Day */}
            <View style={styles.quoteCard}>
                <MaterialCommunityIcons name="format-quote-open" size={50} color="rgba(212, 175, 55, 0.15)" style={styles.quoteIcon} />
                <View style={styles.quoteHeader}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#D4AF37" />
                    <Text style={styles.quoteTitle}>Thought of the Day</Text>
                </View>
                <Text style={styles.quoteText}>"{quote}"</Text>
            </View>

            {/* Testimonials */}
            <View style={styles.testimonialSection}>
                <Text style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>Client Experiences</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testimonialScroll}>
                    {TESTIMONIALS.map(item => (
                        <View key={item.id} style={styles.testimonialCard}>
                            <View style={styles.testimonialHeader}>
                                <View style={styles.testimonialAvatar}>
                                    <Text style={styles.testimonialAvatarText}>{item.name.charAt(0)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.testimonialName}>{item.name}</Text>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <MaterialCommunityIcons key={star} name="star" size={12} color="#D4AF37" />
                                        ))}
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.testimonialText}>"{item.text}"</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Amazing Facts */}
            <View style={styles.factCard}>
                <View style={styles.factHeader}>
                    <MaterialCommunityIcons name="shield-search" size={20} color="#D4AF37" />
                    <Text style={styles.factTitle}>Amazing Security Fact</Text>
                </View>
                <Text style={styles.factText}>{fact}</Text>
            </View>

            <View style={{ height: 120 }} />
        </View>
    ), [quote, fact]);

    const renderBookingItem = React.useCallback(({ item }: { item: BouncerBooking }) => (
        <BookingCardBouncer item={item} navigation={navigation} onResponse={handleBookingResponse} />
    ), [navigation, handleBookingResponse]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            <FlatList
                data={bookings}
                ListHeaderComponent={headerComponent}
                ListFooterComponent={footerComponent}
                renderItem={renderBookingItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
            />

            {/* Redesigned Floating SOS Button */}
            <TouchableOpacity
                style={[styles.sosButton, sosLoading && styles.sosLoading]}
                onPress={handleSOS}
                disabled={sosLoading}
                activeOpacity={0.8}
            >
                {sosLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="car-emergency" size={26} color="#fff" />
                        <Text style={styles.sosText}>SOS</Text>
                    </>
                )}
            </TouchableOpacity>


            {/* First-Time Onboarding Tooltip */}
            <OnboardingTooltip
                visible={showOnboarding}
                title="Profile Setup"
                message="Complete your profile to start receiving booking opportunities and improve your visibility."
                targetPosition={{ top: height - 100, left: width - 80, width: 60, height: 60 }}
                highlightPosition={{ top: height - 90, left: width - 80, width: 60, height: 60 }}
                arrowDirection="down"
                arrowPosition="right"
                align="right"
                nextLabel="Go to Profile"
                onNext={handleOnboardingNext}
                onSkip={handleOnboardingSkip}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A', // Deep premium black
    },
    headerWrapper: {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    logoAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: 44,
        height: 44,
        backgroundColor: '#161616',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#262626',
    },
    appName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    locationText: {
        fontSize: 12,
        color: '#A0A0A0',
        fontWeight: '500',
    },
    notifBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#161616',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    redDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: '#161616',
    },
    heroSection: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    heroGreeting: {
        fontSize: 16,
        color: '#A0A0A0',
        fontWeight: '500',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#D4AF37',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 20,
    },
    heroCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#D4AF37',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    heroCTAText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
        paddingRight: 10,
    },
    ctaArrow: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 6,
        borderRadius: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rolePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4AF37',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
    },
    rolePillText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 11,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.2)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusPillText: {
        color: '#4ade80',
        fontSize: 11,
        fontWeight: '700',
    },
    trustSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    trustItem: {
        alignItems: 'center',
        width: '23%',
    },
    trustIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#262626',
    },
    trustText: {
        color: '#A0A0A0',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    servicesSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 15,
        letterSpacing: 0.5,
        paddingHorizontal: 20,
    },
    servicesScroll: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    serviceCard: {
        width: 130,
        backgroundColor: '#161616',
        borderRadius: 16,
        padding: 15,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#262626',
        height: 110,
    },
    serviceTitle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
    },
    // Bookings
    bookingCard: {
        backgroundColor: '#161616',
        borderRadius: 16,
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#262626',
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#D4AF37',
    },
    avatarText: {
        color: '#D4AF37',
        fontWeight: '800',
        fontSize: 18,
    },
    userName: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    userSubtext: {
        color: '#A0A0A0',
        fontSize: 12,
        fontWeight: '500',
    },
    statusBadge: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    statusText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bookingDetails: {
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailText: {
        color: '#ccc',
        marginLeft: 8,
        fontSize: 13,
        fontWeight: '500',
    },
    payoutBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    payoutLabel: {
        fontSize: 11,
        color: '#4ade80',
        fontWeight: '600',
    },
    payoutAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#4ade80',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    rejectBtn: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    acceptBtn: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    btnText: {
        fontWeight: '800',
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#A0A0A0',
        marginTop: 15,
        fontSize: 15,
        fontWeight: '500',
    },
    refreshBtn: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#161616',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#262626',
    },
    refreshBtnText: {
        color: '#D4AF37',
        fontWeight: '700',
    },
    // Footer Sections
    footerWrapper: {
        paddingTop: 10,
    },
    quoteCard: {
        backgroundColor: '#161616',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#262626',
        position: 'relative',
        overflow: 'hidden',
    },
    quoteIcon: {
        position: 'absolute',
        top: -10,
        right: 10,
    },
    quoteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    quoteTitle: {
        color: '#D4AF37',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    quoteText: {
        color: '#fff',
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 24,
        fontWeight: '500',
    },
    testimonialSection: {
        marginBottom: 30,
    },
    testimonialScroll: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    testimonialCard: {
        width: 280,
        backgroundColor: '#161616',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#262626',
    },
    testimonialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    testimonialAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    testimonialAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    testimonialName: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 2,
    },
    starsRow: {
        flexDirection: 'row',
    },
    testimonialText: {
        color: '#A0A0A0',
        fontSize: 13,
        lineHeight: 20,
    },
    factCard: {
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        marginBottom: 30,
    },
    factHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    factTitle: {
        color: '#D4AF37',
        fontWeight: '800',
        fontSize: 14,
        marginLeft: 8,
    },
    factText: {
        color: '#E0E0E0',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    sosButton: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    sosLoading: {
        opacity: 0.8,
    },
    sosText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 11,
        marginTop: 2,
        letterSpacing: 0.5,
    },
    // Notification Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationModal: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#161616',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#262626',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    closeBtn: {
        padding: 4,
    },
    notificationList: {
        paddingBottom: 10,
    },
    notifItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#0A0A0A',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#262626',
    },
    notifItemUnread: {
        borderColor: 'rgba(212, 175, 55, 0.4)',
        backgroundColor: '#121212',
    },
    notifIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#D4AF37',
        marginBottom: 4,
    },
    notifMessage: {
        fontSize: 13,
        color: '#A0A0A0',
        lineHeight: 18,
        marginBottom: 8,
    },
    notifTime: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D4AF37',
        marginTop: 4,
    },
});
