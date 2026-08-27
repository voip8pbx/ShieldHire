import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, ActivityIndicator, FlatList, PermissionsAndroid, Platform, Linking, ScrollView, ImageBackground, Dimensions, Modal, Animated, TouchableWithoutFeedback, Image } from 'react-native';
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
import SOSConfirmationModal, { SOSModalState } from '../../components/SOSConfirmationModal';


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

// Mock arrays removed for production

let hasShownHomeTooltipThisSession = false;

const BookingCardBouncer = React.memo(({ item, navigation, onResponse }: { item: BouncerBooking, navigation: any, onResponse: (id: string, status: 'CONFIRMED' | 'REJECTED') => void }) => {
    return (
        <TouchableOpacity style={styles.bookingCard} activeOpacity={0.9} onPress={() => navigation.navigate('BouncerBookingDetail', { bookingId: item.id })}>
            <View style={styles.bookingPillRow}>
                {item.user.profilePhoto ? (
                    <Image source={{ uri: item.user.profilePhoto }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.user.name.substring(0, 1).toUpperCase()}</Text>
                    </View>
                )}

                <View style={styles.bookingContent}>
                    <Text style={styles.userName}>{item.user.name}</Text>
                    <View style={styles.detailPillRow}>
                        <Ionicons name="location-outline" size={12} color="#FFD700" />
                        <Text style={styles.detailText} numberOfLines={1}>{item.location || 'Pending'}</Text>
                    </View>
                    <View style={styles.detailPillRow}>
                        <Ionicons name="time-outline" size={12} color="#FFD700" />
                        <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString()} • {item.time}</Text>
                    </View>
                </View>

                <View style={styles.bookingRight}>
                    <Text style={styles.payoutAmount}>₹{item.totalPrice || 0}</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => onResponse(item.id, 'CONFIRMED')}>
                            <Text style={[styles.btnText, { color: '#000' }]}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default function BouncerHomeScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState<BouncerBooking[]>([]);
    const [loading, setLoading] = useState(true);

    // SOS Modal State
    const [sosModalVisible, setSosModalVisible] = useState(false);
    const [sosModalState, setSosModalState] = useState<SOSModalState>('INITIAL');
    const [sosErrorMessage, setSosErrorMessage] = useState('');

    const [locationName, setLocationName] = useState('Locating...');

    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { width, height } = Dimensions.get('window');

    // Dynamic Content State removed for production

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

        socket.on('connect', async () => {
            console.log('Connected to socket server');
            const bouncerId = user?.bouncerProfile?.id;
            if (!bouncerId) return;

            const sharingPref = await AsyncStorage.getItem('@location_sharing_enabled');
            if (sharingPref === 'false') {
                socket.emit('register-bouncer', { bouncerId, lat: 0, lng: 0 });
                return;
            }

            Geolocation.getCurrentPosition(
                (pos) => {
                    socket.emit('register-bouncer', {
                        bouncerId,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                () => {
                    socket.emit('register-bouncer', { bouncerId, lat: 0, lng: 0 });
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
            );
        });

        socket.on('new-alert', (newAlert: any) => {
            if (newAlert.userId === user?.id) return;

            Alert.alert(
                '🚨 EMERGENCY ALERT 🚨',
                `${newAlert.user?.name || 'Someone'} needs help!\nLocation: ${newAlert.location || 'Unknown'}\n\nCoordinates: ${newAlert.latitude?.toFixed(4)}, ${newAlert.longitude?.toFixed(4)}`,
                [{ text: 'OK' }],
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
    }, []);

    const getCurrentLocation = async () => {
        const sharingPref = await AsyncStorage.getItem('@location_sharing_enabled');
        if (sharingPref === 'false') {
            setLocationName('Location Disabled');
            return;
        }

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
            const [pendingRes, historyRes] = await Promise.all([
                api.get('/bookings/pending').catch(() => ({ data: [] })),
                api.get('/bookings/bouncer/history').catch(() => ({ data: [] }))
            ]);

            const pendingList = pendingRes.data || [];
            const historyList = historyRes.data || [];

            const activeDuty = historyList.filter((b: any) =>
                b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'PENDING'
            );

            const combinedMap = new Map();
            [...pendingList, ...activeDuty].forEach((item: any) => {
                if (item && item.id) combinedMap.set(item.id, item);
            });

            setBookings(Array.from(combinedMap.values()));
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            setBookings([]);
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
                        message: "SOS Guard needs access to your location to send accurate SOS alerts.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
                return false;
            } catch (err) {
                return false;
            }
        }
        return false;
    };

    const sendSOS = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            setSosModalState('PERMISSION');
            return;
        }

        setSosModalState('LOADING');
        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await api.post('/api/alerts', {
                        location: `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`,
                        latitude,
                        longitude
                    });
                    setSosModalState('SUCCESS');
                } catch (error) {
                    setSosErrorMessage('Failed to send SOS alert. Please check your connection and try again.');
                    setSosModalState('ERROR');
                }
            },
            (error) => {
                setSosErrorMessage('Failed to get your precise location: ' + error.message);
                setSosModalState('ERROR');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleSOS = () => {
        setSosModalState('INITIAL');
        setSosModalVisible(true);
    };

    // UI Renderers
    const headerComponent = React.useMemo(() => (
        <View style={styles.headerWrapper}>
            {/* Top Nav - Pill Style */}
            <View style={styles.topRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TouchableOpacity style={styles.topPillBtn}>
                        <Ionicons name="location" size={14} color="#FFD700" />
                        <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
                    </TouchableOpacity>
                </View>


                <View style={styles.headerRightControls}>
                    <TouchableOpacity style={styles.iconPillBtn} onPress={openNotifications} activeOpacity={0.8}>
                        <Ionicons name="notifications-outline" size={18} color="#fff" />
                        <View style={styles.redDot} />
                    </TouchableOpacity>
                    <Image source={{ uri: user?.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop' }} style={styles.avatarPill} />
                </View>
            </View>


            {/* Title & Analytics Row */}
            <View style={styles.titleRow}>
                <Text style={styles.mainTitle}>Assignments</Text>
                <View style={styles.analyticsBar}>
                    <View style={styles.analyticsFill} />
                </View>
            </View>

            <View style={styles.heroSection}>
                <View style={styles.heroTextContent}>
                    <Text style={styles.heroGreeting}>Command Center</Text>
                    <Text style={styles.heroTitle}>{user?.name || 'Officer'}</Text>
                </View>

                <View style={styles.statusRow}>
                    <View style={styles.rolePill}>
                        <MaterialCommunityIcons name="shield-account" size={16} color="#000" />
                        <Text style={styles.rolePillText}>{user?.role || 'EXECUTIVE AGENT'}</Text>
                    </View>
                    <View style={styles.statusPill}>
                        <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
                        <Text style={styles.statusPillText}>On Duty</Text>
                    </View>
                </View>
            </View>

            {user?.bouncerProfile?.verificationStatus !== 'APPROVED' && (
                <View style={[
                    styles.verificationWarningBanner,
                    user?.bouncerProfile?.verificationStatus === 'REJECTED' && styles.verificationRejectedBanner
                ]}>
                    <Ionicons
                        name={user?.bouncerProfile?.verificationStatus === 'REJECTED' ? "alert-circle" : "time"}
                        size={22}
                        color={user?.bouncerProfile?.verificationStatus === 'REJECTED' ? "#ff4d4d" : "#ffd700"}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[
                            styles.verificationWarningTitle,
                            user?.bouncerProfile?.verificationStatus === 'REJECTED' && { color: '#ff4d4d' }
                        ]}>
                            {user?.bouncerProfile?.verificationStatus === 'REJECTED' ? 'Verification Rejected' : 'Verification Pending'}
                        </Text>
                        <Text style={styles.verificationWarningMsg}>
                            {user?.bouncerProfile?.verificationStatus === 'REJECTED'
                                ? `Reason: ${user?.bouncerProfile?.rejectionReason || 'Documents mismatch. Please update profile details.'}`
                                : 'Admin is currently reviewing your documents. You will start receiving bookings once approved.'}
                        </Text>
                    </View>
                </View>
            )}

            {/* Removed Trust and Services sections */}

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
            <View style={{ height: 120 }} />
        </View>
    ), []);

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
                style={styles.sosButton}
                onPress={handleSOS}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="car-emergency" size={26} color="#fff" />
                <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>

            <SOSConfirmationModal
                isVisible={sosModalVisible}
                state={sosModalState}
                errorMessage={sosErrorMessage}
                onCancel={() => setSosModalVisible(false)}
                onClose={() => setSosModalVisible(false)}
                onSend={sendSOS}
                onOpenSettings={() => {
                    Linking.openSettings();
                    setSosModalVisible(false);
                }}
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
        paddingHorizontal: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtnHeader: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    topPillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#262626',
    },
    locationText: {
        fontSize: 12,
        color: '#fff',
        marginLeft: 6,
        maxWidth: 100,
        fontWeight: '600',
    },
    headerRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconPillBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    avatarPill: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    redDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    titleRow: {
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 10,
    },
    analyticsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 6,
        backgroundColor: '#161616',
        borderRadius: 3,
        width: '80%',
    },
    analyticsFill: {
        height: '100%',
        width: '40%',
        backgroundColor: '#FFD700',
        borderRadius: 3,
    },
    heroSection: {
        marginBottom: 25,
        backgroundColor: '#161616',
        borderRadius: 30,
        padding: 20,
        borderWidth: 1,
        borderColor: '#262626',
    },
    heroTextContent: {
        marginBottom: 15,
    },
    heroGreeting: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
    },
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
    // Bookings - Pill Style
    bookingCard: {
        backgroundColor: '#161616',
        borderRadius: 24,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#262626',
        overflow: 'hidden',
    },
    bookingPillRow: {
        flexDirection: 'row',
        padding: 14,
        alignItems: 'center',
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 14,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    avatarText: {
        color: '#FFD700',
        fontWeight: '800',
        fontSize: 18,
    },
    bookingContent: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
        marginBottom: 4,
    },
    detailPillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        color: '#A0A0A0',
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '500',
    },
    bookingRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 55,
    },
    payoutAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFD700',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    acceptBtn: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    btnText: {
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: 0.5,
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
        color: '#FFD700',
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
        bottom: 95,
        right: 20,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.3)',
        zIndex: 999,
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
    verificationWarningBanner: {
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        borderColor: '#C5A059',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 20,
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    verificationRejectedBanner: {
        backgroundColor: 'rgba(255, 77, 77, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    verificationWarningTitle: {
        color: '#C5A059',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    verificationWarningMsg: {
        color: '#ccc',
        fontSize: 12,
        lineHeight: 16,
    },
});
