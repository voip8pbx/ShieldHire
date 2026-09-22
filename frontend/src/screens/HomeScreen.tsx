import React, { useEffect, useState, useLayoutEffect, useRef, useContext } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet,
    ActivityIndicator, TextInput, Dimensions, SafeAreaView,
    Platform, StatusBar, Alert, Linking, Animated, ScrollView, FlatList, RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { MainTabParamList, HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';
import SOSConfirmationModal, { SOSModalState } from '../components/SOSConfirmationModal';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'HomeStack'>,
    StackNavigationProp<HomeStackParamList>
>;

type Props = { navigation: HomeScreenNavigationProp };

const FILTERS = ['All', 'Bouncer', 'Gunman', 'VIP'];

const BouncerCard = React.memo(({ item, onPress }: { item: Bouncer; onPress: (id: string) => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const { colors } = useContext(ThemeContext);

    const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

    // Safe fallbacks for data
    const displayName = item.name || item.user?.name || 'Security Professional';
    const displayPhoto = item.profilePhoto || (item as any).profileImageUrl || item.user?.profilePhoto;
    const displayRating = item.rating && item.rating > 0 ? item.rating.toFixed(1) : '4.8';
    const displayExp = item.experience ? `${item.experience} yrs exp` : '5+ yrs exp';
    const isGunman = item.isGunman || (item as any).hasGunLicense;

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onPress(item.id)}>
            <Animated.View style={[styles.execCard, { transform: [{ scale }] }]}>
                <View style={styles.execImageWrap}>
                    {displayPhoto ? (
                        <Image source={{ uri: displayPhoto }} style={styles.execImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.execImage, styles.cardImagePlaceholder]}>
                            <MaterialCommunityIcons name="account-shield" size={56} color="#444" />
                        </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.execGradientOverlay} />

                    {/* Top Badges */}
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#FFD700" />
                        <Text style={styles.ratingText}>{displayRating}</Text>
                    </View>

                    <View style={styles.availableBadge}>
                        <View style={[styles.availableDot, { backgroundColor: item.isAvailable !== false ? '#4ade80' : '#f87171' }]} />
                        <Text style={styles.availableText}>{item.isAvailable !== false ? 'AVAILABLE' : 'BUSY'}</Text>
                    </View>
                </View>

                {/* Card Content */}
                <View style={styles.execCardBody}>
                    <Text style={styles.execCardName} numberOfLines={1}>{displayName}</Text>

                    <View style={styles.badgeRow}>
                        <View style={[styles.roleTag, { backgroundColor: isGunman ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)' }]}>
                            <MaterialCommunityIcons name={isGunman ? 'pistol' : 'shield-account'} size={12} color={isGunman ? '#f87171' : '#D4AF37'} style={{ marginRight: 4 }} />
                            <Text style={[styles.roleTagText, { color: isGunman ? '#f87171' : '#D4AF37' }]}>{isGunman ? 'Gunman' : 'Elite Bouncer'}</Text>
                        </View>
                        <View style={styles.expTag}>
                            <Text style={styles.expTagText}>{displayExp}</Text>
                        </View>
                    </View>

                    <View style={styles.execFooter}>
                        <Text style={styles.viewProfileText}>View Profile</Text>
                        <Ionicons name="arrow-forward" size={13} color="#D4AF37" />
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
});

const SkeletonCard = () => {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
    return (
        <View style={styles.execCard}>
            <Animated.View style={[styles.execImage, { backgroundColor: '#2a2a2a', opacity }]} />
            <View style={{ padding: 12 }}>
                <Animated.View style={[styles.skeletonText, { width: 120, opacity }]} />
                <Animated.View style={[styles.skeletonText, { width: 80, opacity }]} />
            </View>
        </View>
    );
};

export default function HomeScreen({ navigation }: Props) {
    const { user, requireAuth } = useContext(AuthContext);
    const { colors, theme } = useContext(ThemeContext);
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [locationCoords, setLocationCoords] = useState({ latitude: 19.0760, longitude: 72.8777 });
    const [locationName, setLocationName] = useState('Detecting...');
    const [sosModalVisible, setSosModalVisible] = useState(false);
    const [sosModalState, setSosModalState] = useState<SOSModalState>('INITIAL');
    const [sosErrorMessage, setSosErrorMessage] = useState('');

    const sosPulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(sosPulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
                Animated.timing(sosPulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => { getCurrentLocation(); }, []);

    const getCurrentLocation = async () => {
        const sharingPref = await AsyncStorage.getItem('@location_sharing_enabled');
        if (sharingPref === 'false') {
            setLocationName('Location Disabled');
            return;
        }

        let hasPermission = false;
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            hasPermission = auth === 'granted';
        } else {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    { title: 'Location Permission', message: 'ShieldHire needs your location.', buttonNeutral: 'Ask Me Later', buttonNegative: 'Cancel', buttonPositive: 'OK' }
                );
                hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (_) {}
        }
        if (!hasPermission) { setLocationName('Location Denied'); return; }
        Geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocationCoords({ latitude, longitude });
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { 'User-Agent': 'ShieldHireApp/1.0' } });
                    const data = await res.json();
                    const city = data?.address?.city || data?.address?.town || data?.address?.village || 'Unknown';
                    const country = data?.address?.country || '';
                    setLocationName(`${city}, ${country}`);
                } catch (_) { setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`); }
            },
            () => setLocationName('Location Unavailable'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

    const fetchBouncers = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get<Bouncer[]>('/api/bouncers');
            setBouncers(res.data || []);
        } catch (_) { setBouncers([]); }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => fetchBouncers(), 300);
        return () => clearTimeout(t);
    }, [search]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBouncers(true);
    };

    const filtered = React.useMemo(() => {
        return bouncers.filter(b => {
            const nameStr = (b.name || b.user?.name || '').toLowerCase();
            if (search && !nameStr.includes(search.toLowerCase())) return false;
            const isGunman = b.isGunman || (b as any).hasGunLicense;
            if (activeFilter === 'Bouncer') return !isGunman;
            if (activeFilter === 'Gunman') return isGunman;
            if (activeFilter === 'VIP') return (b.rating >= 4.0 || b.rating === 0 || b.verificationStatus === 'APPROVED');
            return true;
        });
    }, [bouncers, search, activeFilter]);

    const handleBouncerPress = React.useCallback((id: string) => {
        navigation.navigate('BouncerDetail', { bouncerId: id });
    }, [navigation]);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        }
        try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, { title: 'Location', message: 'SOS needs location.', buttonNeutral: 'Later', buttonNegative: 'Cancel', buttonPositive: 'OK' });
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (_) { return false; }
    };

    const sendSOS = async () => {
        const ok = await requestLocationPermission();
        if (!ok) { setSosModalState('PERMISSION'); return; }
        setSosModalState('LOADING');
        Geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await api.post('/api/alerts', { location: `Lat: ${pos.coords.latitude.toFixed(6)}, Long: ${pos.coords.longitude.toFixed(6)}`, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                    setSosModalState('SUCCESS');
                } catch (_) { setSosErrorMessage('Failed to send SOS. Check connection.'); setSosModalState('ERROR'); }
            },
            (err) => { setSosErrorMessage('Location error: ' + err.message); setSosModalState('ERROR'); },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const BG = '#0A0A0A';
    const CARD_BG = '#161616';
    const GOLD = '#D4AF37';
    const BORDER = 'rgba(255,255,255,0.07)';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />
            <ScrollView
                style={{ flex: 1, backgroundColor: BG }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[GOLD]} />
                }
            >

                {/* ── TOP BAR ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={[styles.locationPill, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                        <Ionicons name="location-outline" size={13} color={GOLD} />
                        <Text style={[styles.locationPillText, { color: '#fff' }]} numberOfLines={1}>{locationName}</Text>
                    </TouchableOpacity>
                    <View style={styles.topBarRight}>
                        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: CARD_BG, borderColor: BORDER }]} onPress={() => navigation.navigate('Notifications' as any)}>
                            <Ionicons name="notifications-outline" size={20} color="#fff" />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile' as any)}>
                            <View style={[styles.avatarRing, { borderColor: GOLD }]}>
                                {user?.profilePhoto
                                    ? <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
                                    : <View style={[styles.avatar, { backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center' }]}>
                                        <MaterialCommunityIcons name="account" size={22} color="#888" />
                                      </View>
                                }
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── TITLE ── */}
                <View style={styles.titleSection}>
                    <Text style={styles.titleText}>Security</Text>
                    <View style={[styles.titleUnderline, { backgroundColor: GOLD }]} />
                </View>

                {/* ── SEARCH ── */}
                <View style={[styles.searchBar, { backgroundColor: CARD_BG, borderColor: BORDER }]}>
                    <Ionicons name="search-outline" size={18} color="#666" style={{ marginRight: 10 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search security guards..."
                        placeholderTextColor="#555"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* ── LIVE COVERAGE MAP ── */}
                <TouchableOpacity
                    style={[styles.mapCard, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                    onPress={() => navigation.navigate('MapScreen', { mode: 'explore', initialLatitude: locationCoords.latitude, initialLongitude: locationCoords.longitude })}
                    activeOpacity={0.9}
                >
                    <View style={styles.mapCardHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.liveRadarPulseDot}>
                                <View style={styles.liveRadarDotCore} />
                            </View>
                            <Text style={styles.mapCardLabel}>Live Radar & Guard Coverage</Text>
                        </View>

                        <View style={styles.mapBadge}>
                            <Text style={styles.mapBadgeText}>Open Radar Map ➔</Text>
                        </View>
                    </View>
                    <View style={styles.mapWrap}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={StyleSheet.absoluteFillObject}
                            initialRegion={{ latitude: locationCoords.latitude, longitude: locationCoords.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
                            region={{ latitude: locationCoords.latitude, longitude: locationCoords.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            loadingEnabled
                            loadingBackgroundColor={CARD_BG}
                            loadingIndicatorColor={GOLD}
                            customMapStyle={darkMapStyle}
                        >
                            {/* Yellow dot for user location */}
                            <Marker coordinate={locationCoords} anchor={{ x: 0.5, y: 0.5 }}>
                                <View style={styles.userDotOuter}>
                                    <View style={styles.userDotInner} />
                                </View>
                            </Marker>
                            {bouncers.slice(0, 6).map((b) => {
                                const lat = (b as any).latitude;
                                const lng = (b as any).longitude;
                                if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
                                return (
                                    <Marker
                                        key={b.id}
                                        coordinate={{ latitude: lat, longitude: lng }}
                                        title={b.name || b.user?.name || 'Security Officer'}
                                        pinColor="#FFD700"
                                    />
                                );
                            })}
                        </MapView>

                        <View style={styles.mapOverlayButton}>
                            <View style={styles.mapOverlayDot} />
                            <Text style={styles.mapOverlayButtonText}>Search Nearby Guards on Map</Text>
                        </View>
                    </View>

                </TouchableOpacity>


                {/* ── PREMIUM EXECUTIVE BANNER ── */}
                <TouchableOpacity
                    style={[styles.premiumBanner, { backgroundColor: CARD_BG, borderColor: BORDER }]}
                    onPress={() => requireAuth(navigation, 'ExploreProfessionals')}
                    activeOpacity={0.85}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.premiumTitle}>Premium <Text style={{ color: GOLD }}>Executive</Text></Text>
                        <Text style={styles.premiumSub}>Elite protection professionals instantly.</Text>
                    </View>
                    <View style={[styles.premiumIcon, { backgroundColor: GOLD + '22', borderColor: GOLD + '44' }]}>
                        <MaterialCommunityIcons name="shield-crown" size={28} color={GOLD} />
                    </View>
                </TouchableOpacity>

                {/* ── FILTER PILLS ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {FILTERS.map(f => {
                        const active = activeFilter === f;
                        let icon = 'apps-outline';
                        if (f === 'Bouncer') icon = 'person-outline';
                        if (f === 'Gunman') icon = 'locate-outline';
                        if (f === 'VIP') icon = 'star-outline';
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterPill, { backgroundColor: active ? GOLD : CARD_BG, borderColor: active ? GOLD : BORDER }]}
                                onPress={() => setActiveFilter(f)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={icon as any} size={14} color={active ? '#000' : '#888'} style={{ marginRight: 5 }} />
                                <Text style={[styles.filterText, { color: active ? '#000' : '#aaa' }]}>{f}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── FEATURED PROFESSIONALS ── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Featured Professionals</Text>
                    <TouchableOpacity onPress={() => requireAuth(navigation, 'ExploreProfessionals')}>
                        <Text style={[styles.sectionLink, { color: GOLD }]}>Explore Guards →</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
                    {loading
                        ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
                        : filtered.length > 0
                            ? filtered.map(b => <BouncerCard key={b.id} item={b} onPress={handleBouncerPress} />)
                            : (
                                <View style={styles.emptyWrap}>
                                    <MaterialCommunityIcons name="account-search-outline" size={40} color="#444" />
                                    <Text style={styles.emptyText}>No security guards available right now</Text>
                                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBouncers()}>
                                        <Text style={styles.retryBtnText}>Refresh Guards</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                    }
                </ScrollView>

            </ScrollView>

            {/* ── SOS BUTTON ── */}
            <TouchableOpacity style={styles.sosWrapper} onPress={() => { setSosModalState('INITIAL'); setSosModalVisible(true); }} activeOpacity={0.85}>
                <Animated.View style={[styles.sosGlow, { transform: [{ scale: sosPulseAnim }] }]} />
                <LinearGradient colors={['#ff4d4d', '#cc0000']} style={styles.sosBtn}>
                    <MaterialCommunityIcons name="shield-alert-outline" size={26} color="#fff" />
                    <Text style={styles.sosText}>SOS</Text>
                </LinearGradient>
            </TouchableOpacity>

            <SOSConfirmationModal
                isVisible={sosModalVisible}
                state={sosModalState}
                errorMessage={sosErrorMessage}
                onCancel={() => setSosModalVisible(false)}
                onClose={() => setSosModalVisible(false)}
                onSend={sendSOS}
                onOpenSettings={() => { Linking.openSettings(); setSosModalVisible(false); }}
            />
        </SafeAreaView>
    );
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'android' ? 14 : 10,
        paddingBottom: 10,
    },
    locationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    locationPillText: {
        fontSize: 13,
        fontWeight: '500',
        maxWidth: 160,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    notifDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: '#0A0A0A',
    },
    avatarRing: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 2,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    titleSection: {
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 18,
    },
    titleText: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    titleUnderline: {
        width: 120,
        height: 3,
        borderRadius: 2,
        marginTop: 6,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 18,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#fff',
    },
    mapCard: {
        marginHorizontal: 18,
        marginBottom: 14,
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    mapCardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
    },
    liveRadarPulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ade80',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    liveRadarDotCore: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ade80',
    },
    mapOverlayDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#000',
        marginRight: 6,
    },
    userDotOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFD700',
    },
    userDotInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFD700',
    },

    mapCardLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    mapBadge: {
        backgroundColor: 'rgba(255,215,0,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    mapBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFD700',
    },
    mapWrap: {
        height: 180,
        position: 'relative',
    },
    mapOverlayButton: {
        position: 'absolute',
        bottom: 12,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        elevation: 4,
    },

    mapOverlayButtonText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '800',
    },
    premiumBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 18,
        marginBottom: 18,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
    },
    premiumTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    premiumSub: {
        fontSize: 12,
        color: '#888',
    },
    premiumIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterRow: {
        paddingHorizontal: 18,
        paddingBottom: 4,
        gap: 10,
        marginBottom: 8,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 22,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        marginTop: 16,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    sectionLink: {
        fontSize: 13,
        fontWeight: '600',
    },
    cardsRow: {
        paddingHorizontal: 18,
        paddingBottom: 12,
        gap: 16,
    },
    execCard: {
        width: 220,
        backgroundColor: '#161618',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        elevation: 4,
    },
    execImageWrap: {
        height: 170,
        position: 'relative',
    },
    execImage: {
        width: '100%',
        height: '100%',
    },
    execGradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
    },
    cardImagePlaceholder: {
        backgroundColor: '#1e1e1e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    availableBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 5,
    },
    availableDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    availableText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    execCardBody: {
        padding: 14,
    },
    execCardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    roleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    roleTagText: {
        fontSize: 11,
        fontWeight: '700',
    },
    expTag: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    expTagText: {
        fontSize: 11,
        color: '#aaa',
        fontWeight: '500',
    },
    execFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 10,
        marginTop: 2,
    },
    viewProfileText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D4AF37',
    },
    skeletonText: {
        height: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 4,
        marginBottom: 8,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 36,
        paddingHorizontal: 30,
    },
    emptyText: {
        color: '#777',
        fontSize: 14,
        marginTop: 10,
        marginBottom: 12,
        textAlign: 'center',
    },
    retryBtn: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    retryBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 12,
    },
    sosWrapper: {
        position: 'absolute',
        bottom: 100,
        right: 22,
        width: 68,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    sosGlow: {
        position: 'absolute',
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: 'rgba(255,0,0,0.35)',
    },
    sosBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        elevation: 10,
    },
    sosText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 10,
        marginTop: 2,
    },
});
