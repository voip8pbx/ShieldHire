import React, { useEffect, useState, useLayoutEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Dimensions,
    SafeAreaView,
    Platform,
    StatusBar,
    Alert,
    Linking,
    Animated,
    ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { MainTabParamList, HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';
import LottieView from 'lottie-react-native';
import SOSConfirmationModal, { SOSModalState } from '../components/SOSConfirmationModal';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { AuthContext } from '../context/AuthContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'HomeStack'>,
    StackNavigationProp<HomeStackParamList>
>;

type Props = {
    navigation: HomeScreenNavigationProp;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 160;

// --- THEME CONSTANTS ---
const THEME = {
    bgPrimary: '#090909',
    bgSecondary: '#121212',
    card: '#1A1A1A',
    gold: '#FFD700',
    goldDark: '#FFC107',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: 'rgba(255, 255, 255, 0.08)',
    glass: 'rgba(255, 255, 255, 0.03)',
};

const FilterPill = React.memo(({ item, isActive, onPress }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    // Map icons
    let iconName = 'shield-outline';
    if (item === 'All') iconName = 'apps-outline';
    if (item === 'Bouncer') iconName = 'person-outline';
    if (item === 'Gunman') iconName = 'locate-outline';
    if (item === 'VIP') iconName = 'star-outline';
    if (item === 'Top Rated') iconName = 'trophy-outline';

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onPress(item)}
        >
            <Animated.View style={[
                styles.filterPill,
                isActive && styles.activePill,
                { transform: [{ scale: scaleAnim }] }
            ]}>
                <Ionicons name={iconName} size={16} color={isActive ? '#000' : THEME.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                    {item}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

const BouncerCard = React.memo(({ item, onPress }: { item: Bouncer, onPress: (id: string) => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const { requireAuth } = useContext(AuthContext);
    const navigation = useNavigation<any>();

    const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

    const getStatusStyle = (available: boolean) => {
        if (available) return { text: 'Available', color: '#4ade80' };
        return { text: 'Busy', color: '#f87171' };
    };

    const status = getStatusStyle(item.isAvailable);
    const roleText = item.isGunman ? 'Gunman' : 'Bouncer';

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onPress(item.id)}>
            <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                <View style={styles.imageContainer}>
                    {item.profilePhoto ? (
                        <Image
                            source={{ uri: item.profilePhoto }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }]}>
                            <MaterialCommunityIcons name="account" size={60} color="#666" />
                        </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.45)']} style={styles.imageOverlay} />

                    <View style={styles.statusBadgeWrapper}>
                        <View style={styles.blurBadge}>
                            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                            <Text style={styles.statusText}>{status.text}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{roleText.toUpperCase()}</Text>
                        {item.rating >= 4.9 && (
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-decagram" size={12} color={THEME.gold} />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={12} color={THEME.gold} />
                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.expText}>• {item.experience || 0} Yrs Exp</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <View>
                            <Text style={styles.price}>₹{item.isGunman ? 3500 : 2000}<Text style={styles.perHr}>/shift</Text></Text>
                        </View>
                        <TouchableOpacity style={styles.bookBtn} onPress={() => requireAuth(navigation, 'BouncerDetail', { bouncerId: item.id })}>
                            <Text style={styles.bookBtnText}>Book</Text>
                        </TouchableOpacity>
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
                Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return (
        <View style={styles.card}>
            <Animated.View style={[styles.skeletonImage, { opacity }]} />
            <View style={styles.cardContent}>
                 <Animated.View style={[styles.skeletonText, { width: 60, opacity }]} />
                 <Animated.View style={[styles.skeletonText, { width: 120, height: 16, marginTop: 10, opacity }]} />
                 <Animated.View style={[styles.skeletonText, { width: 80, marginTop: 10, opacity }]} />
                 <Animated.View style={[styles.skeletonText, { width: '100%', height: 30, marginTop: 15, borderRadius: 8, opacity }]} />
            </View>
        </View>
    );
};

export default function HomeScreen({ navigation }: Props) {
    const { user, requireAuth } = useContext(AuthContext);
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [locationName, setLocationName] = useState('Mumbai, India');
    const [refreshing, setRefreshing] = useState(false);
    
    // SOS Modal State
    const [sosModalVisible, setSosModalVisible] = useState(false);
    const [sosModalState, setSosModalState] = useState<SOSModalState>('INITIAL');
    const [sosErrorMessage, setSosErrorMessage] = useState('');

    // Search focus animation
    const searchFocus = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        let hasPermission = false;
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            hasPermission = auth === 'granted';
        } else if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission Required",
                        message: "SOS Guard needs access to your location to show relevant security personnel near you.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
            }
        }

        if (hasPermission) {
            setLocationName('Locating...');
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
                (error) => {
                    setLocationName('Location Unavailable');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } else {
            setLocationName('Location Denied');
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const fetchSecurityPersonnel = async () => {
        setLoading(true);
        try {
            const response = await api.get<Bouncer[]>('/api/bouncers', { params: { search } });
            if (response.data) {
                setBouncers(response.data);
            } else {
                setBouncers([]);
            }
        } catch (error) {
            console.error('Error fetching security personnel:', error);
            setBouncers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayTimer = setTimeout(() => {
            fetchSecurityPersonnel();
        }, 500);
        return () => clearTimeout(delayTimer);
    }, [search]);

    const filteredPersonnel = React.useMemo(() => {
        return bouncers.filter(t => {
            const searchMatches = search.toLowerCase();
            const role = t.isGunman ? 'Gunman' : 'Bouncer';

            if (search && !t.name.toLowerCase().includes(searchMatches) &&
                !role.toLowerCase().includes(searchMatches)) {
                return false;
            }

            if (activeFilter === 'All') return true;
            if (activeFilter === 'Bouncer') return !t.isGunman;
            if (activeFilter === 'Gunman') return t.isGunman;
            if (activeFilter === 'Top Rated') return t.rating >= 4.9;

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
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission Required",
                        message: "SOS Guard needs access to your location.",
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

    const onSearchFocus = () => Animated.timing(searchFocus, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    const onSearchBlur = () => Animated.timing(searchFocus, { toValue: 0, duration: 250, useNativeDriver: false }).start();

    const searchBorderColor = searchFocus.interpolate({
        inputRange: [0, 1],
        outputRange: [THEME.border, THEME.gold]
    });

    const headerComponent = React.useMemo(() => (
        <View style={styles.headerContainer}>
            {/* Hero Section Gradient */}
            <LinearGradient colors={['#1a1a1a', THEME.bgPrimary]} style={styles.heroSection}>
                {/* Top Nav */}
                <View style={styles.topRow}>
                    <View style={styles.logoAndTitle}>
                        <Image 
                            source={{ uri: user?.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop' }} 
                            style={styles.avatar}
                        />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.welcomeText}>{user?.name || 'Welcome Back'}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.locationContainer}>
                            <Ionicons name="location" size={12} color={THEME.gold} />
                            <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
                        </View>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications' as any)}>
                            <BlurView blurType="dark" blurAmount={10} style={StyleSheet.absoluteFill} />
                            <Ionicons name="notifications-outline" size={20} color="#fff" />
                            <View style={styles.redDot} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Banner Content */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroTextContent}>
                        <Text style={styles.heroTitle}>Hire Trusted{'\n'}<Text style={{color: THEME.gold}}>Security</Text>{'\n'}Professionals</Text>
                        <Text style={styles.heroSubtitle}>Book experienced bouncers for events, VIP protection, and private parties.</Text>
                        <View style={styles.heroActions}>
                            <TouchableOpacity style={styles.primaryCta}>
                                <Text style={styles.primaryCtaText}>Explore</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryCta} onPress={() => requireAuth(navigation, 'ExploreProfessionals')}>
                                <Text style={styles.secondaryCtaText}>Hire Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.heroLottieContainer}>
                        <MaterialCommunityIcons name="shield-star" size={120} color="rgba(255, 215, 0, 0.15)" style={{position: 'absolute'}} />
                        <LottieView
                            source={{ uri: 'https://assets5.lottiefiles.com/packages/lf20_t24tpvcu.json' }} 
                            autoPlay
                            loop
                            style={styles.lottie}
                        />
                    </View>
                </View>
            </LinearGradient>


            {/* Stats Section */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
                {[
                    { title: 'Verified Guards', value: '500+', icon: 'shield-check' },
                    { title: 'Average Rating', value: '4.9★', icon: 'star' },
                    { title: 'Support', value: '24/7', icon: 'headset' },
                    { title: 'Verified', value: '100%', icon: 'check-decagram' },
                ].map((stat, idx) => (
                    <View key={idx} style={styles.statCard}>
                        <MaterialCommunityIcons name={stat.icon} size={24} color={THEME.gold} style={styles.statIcon} />
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statTitle}>{stat.title}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Top Professionals</Text>
                    <Text style={styles.sectionSubtitle}>Verified Security Experts Near You</Text>
                </View>
                <TouchableOpacity onPress={() => requireAuth(navigation, 'ExploreProfessionals')}>
                    <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {['All', 'Bouncer', 'Gunman', 'VIP', 'Top Rated'].map((item) => (
                        <FilterPill 
                            key={item} 
                            item={item} 
                            isActive={activeFilter === item} 
                            onPress={setActiveFilter} 
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Professionals Horizontal Scroll */}
            {loading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsContainer}>
                    {[1, 2, 3].map((_, i) => <SkeletonCard key={i} />)}
                </ScrollView>
            ) : filteredPersonnel.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCardsContainer}>
                    {filteredPersonnel.map((item) => (
                        <BouncerCard
                            key={item.id}
                            item={item}
                            onPress={handleBouncerPress}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="account-search-outline" size={48} color={THEME.textSecondary} />
                    <Text style={styles.emptyTitle}>No Professionals Found</Text>
                    <Text style={styles.emptyText}>Try adjusting your filters.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => { setSearch(''); setActiveFilter('All'); }}>
                        <Text style={styles.retryText}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    ), [locationName, activeFilter, loading, filteredPersonnel, navigation, handleBouncerPress, user]);

    const footerComponent = React.useMemo(() => (
        <View style={styles.footerContainer}>
            {/* SECTION 1: WHY CHOOSE SHIELD OF SECURITY */}
            <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Why Choose SOS Guard</Text>
                <Text style={styles.footerSubtitle}>Trusted by thousands of clients for premium security services across India.</Text>
                <View style={styles.featuresGrid}>
                    {[
                        { title: 'Verified Professionals', desc: 'Strict identity verification and background checks.', icon: 'shield-check-outline' },
                        { title: 'Licensed Personnel', desc: 'Professionally trained for public and private security.', icon: 'card-account-details-outline' },
                        { title: 'Instant Booking', desc: 'Book experienced bouncers within minutes securely.', icon: 'lightning-bolt-outline' },
                        { title: '24×7 Support', desc: 'Dedicated support anytime to assist every booking.', icon: 'headset' },
                        { title: 'Transparent Pricing', desc: 'No hidden charges. Know what you pay upfront.', icon: 'cash-multiple' },
                        { title: 'Trusted by Businesses', desc: 'Preferred by hotels, clubs, and luxury events.', icon: 'domain' }
                    ].map((feat, idx) => (
                        <View key={idx} style={styles.featureCard}>
                            <View style={styles.featureIconBox}>
                                <MaterialCommunityIcons name={feat.icon} size={22} color={THEME.gold} />
                            </View>
                            <Text style={styles.featureTitle}>{feat.title}</Text>
                            <Text style={styles.featureDesc}>{feat.desc}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* SECTION 2: OUR ACHIEVEMENTS */}
            <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>SOS Guard Excellence</Text>
                <View style={styles.achievementsGrid}>
                    {[
                        { title: 'Successful Bookings', value: '50,000+', icon: 'check-decagram-outline' },
                        { title: 'Verified Professionals', value: '15,000+', icon: 'account-group-outline' },
                        { title: 'Average Rating', value: '4.9★', icon: 'star-outline' },
                        { title: 'Customer Satisfaction', value: '98%', icon: 'heart-outline' },
                        { title: 'Emergency Support', value: '24×7', icon: 'phone-in-talk-outline' },
                        { title: 'Cities Covered', value: '120+', icon: 'map-marker-outline' }
                    ].map((ach, idx) => (
                        <View key={idx} style={styles.achCard}>
                            <MaterialCommunityIcons name={ach.icon} size={28} color={THEME.gold} style={{ marginBottom: 8 }} />
                            <Text style={styles.achValue}>{ach.value}</Text>
                            <Text style={styles.achTitle}>{ach.title}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* SECTION 3: CLIENT TESTIMONIALS */}
            <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Client Testimonials</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testimonialScroll}>
                    {[
                        { name: 'Rahul Sharma', role: 'Corporate Event Manager', text: 'Outstanding professionalism. The security staff arrived early, were well-dressed, polite and handled the entire event flawlessly.', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
                        { name: 'Priya Mehta', role: 'Wedding Planner', text: 'Booking through SOS Guard was effortless. Every guard was experienced and extremely professional.', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
                        { name: 'Aman Verma', role: 'Hotel Manager', text: 'The best private security platform we\'ve worked with. Highly recommended for luxury events.', img: 'https://randomuser.me/api/portraits/men/46.jpg' },
                        { name: 'Neha Kapoor', role: 'Event Organizer', text: 'The staff was disciplined, punctual and made all our guests feel safe.', img: 'https://randomuser.me/api/portraits/women/65.jpg' }
                    ].map((test, idx) => (
                        <View key={idx} style={styles.testCard}>
                            <View style={styles.testHeader}>
                                <Image source={{ uri: test.img }} style={styles.testAvatar} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.testName}>{test.name}</Text>
                                    <Text style={styles.testRole}>{test.role}</Text>
                                </View>
                                <MaterialCommunityIcons name="check-decagram" size={16} color={THEME.gold} />
                            </View>
                            <View style={styles.testStars}>
                                {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={12} color={THEME.gold} />)}
                            </View>
                            <Text style={styles.testText}>"{test.text}"</Text>
                            <Text style={styles.testDate}>Booking • Oct 2023</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* SECTION 4: TRUSTED BY */}
            <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Trusted by Leading Businesses</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logoScroll}>
                    {['Taj Hotels', 'Marriott', 'Hyatt', 'Radisson', 'JW Marriott', 'ITC Hotels', 'The Oberoi', 'Amazon', 'Infosys', 'TCS', 'Accenture', 'Deloitte'].map((logo, idx) => (
                        <View key={idx} style={styles.logoCard}>
                            <Text style={styles.logoText}>{logo}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* SECTION 5: ADVANTAGES */}
            <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Why Hire Through SOS Guard?</Text>
                <View style={styles.comparisonContainer}>
                    <View style={styles.compColumn}>
                        <Text style={styles.compHeaderBad}>Traditional Hiring</Text>
                        {['Unverified Guards', 'Cash Payments', 'No Ratings', 'Manual Search', 'No Emergency Support', 'Uncertain Pricing'].map((txt, idx) => (
                            <View key={idx} style={styles.compRow}>
                                <Ionicons name="close-circle" size={16} color="#f87171" style={{ marginRight: 8 }} />
                                <Text style={styles.compTextBad}>{txt}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.compColumn, styles.compColumnGood]}>
                        <Text style={styles.compHeaderGood}>SOS Guard</Text>
                        {['Background Verified', 'Secure Digital Payments', 'Real Customer Reviews', 'Instant Booking', '24×7 Support', 'Transparent Pricing'].map((txt, idx) => (
                            <View key={idx} style={styles.compRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" style={{ marginRight: 8 }} />
                                <Text style={styles.compTextGood}>{txt}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* SECTION 6: BOOKING PROCESS */}
            <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>How It Works</Text>
                <View style={styles.timelineContainer}>
                    {[
                        { step: 1, title: 'Search Professionals', desc: 'Find guards matching your needs.', icon: 'account-search-outline' },
                        { step: 2, title: 'Choose Your Guard', desc: 'Review profiles, ratings & prices.', icon: 'card-account-details-outline' },
                        { step: 3, title: 'Confirm Booking', desc: 'Secure payment & instant confirmation.', icon: 'check-circle-outline' },
                        { step: 4, title: 'Stay Protected', desc: 'Peace of mind with 24/7 support.', icon: 'shield-check-outline' }
                    ].map((step, idx) => (
                        <View key={idx} style={styles.timelineItem}>
                            <View style={styles.timelineIconBox}>
                                <MaterialCommunityIcons name={step.icon} size={24} color={THEME.gold} />
                            </View>
                            {idx !== 3 && <View style={styles.timelineLine} />}
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineStep}>Step {step.step}</Text>
                                <Text style={styles.timelineTitle}>{step.title}</Text>
                                <Text style={styles.timelineDesc}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* SECTION 7: SAFETY PROMISE */}
            <View style={styles.footerSection}>
                <LinearGradient colors={['#1a1a1a', THEME.bgPrimary]} style={styles.safetyBanner}>
                    <View style={styles.safetyIconBox}>
                        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={THEME.gold} />
                    </View>
                    <Text style={styles.safetyTitle}>Your Safety Is Our Highest Priority</Text>
                    <Text style={styles.safetyDesc}>Every professional is identity verified, trained, and committed to delivering exceptional security services.</Text>
                    <TouchableOpacity style={styles.safetyBtn}>
                        <Text style={styles.safetyBtnText}>Explore Security</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            {/* SECTION 8: PREMIUM CALL TO ACTION */}
            <View style={[styles.footerSection, { marginBottom: 60 }]}>
                <BlurView blurType="dark" blurAmount={15} style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>Need Professional Security Today?</Text>
                    <Text style={styles.ctaDesc}>Book experienced security professionals for weddings, corporate events, VIP protection, clubs, concerts and private parties.</Text>
                    <View style={styles.ctaActions}>
                        <TouchableOpacity style={styles.ctaBtnPrimary} onPress={() => requireAuth(navigation, 'ExploreProfessionals')}>
                            <Text style={styles.ctaBtnPrimaryText}>Hire Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ctaBtnSecondary} onPress={() => navigation.navigate('ContactUs')}>
                            <Text style={styles.ctaBtnSecondaryText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </View>
    ), [navigation]);

    // SOS Pulse Animation Hook
    const sosPulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(sosPulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
                Animated.timing(sosPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <View style={styles.mainContainer}>
                <FlatList
                    data={[] as Bouncer[]}
                    renderItem={null}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={headerComponent}
                    ListFooterComponent={footerComponent}
                />

                {/* Floating SOS Button */}
                <TouchableOpacity style={styles.sosWrapper} onPress={handleSOS} activeOpacity={0.8}>
                    <Animated.View style={[styles.sosGlow, { transform: [{ scale: sosPulseAnim }] }]} />
                    <LinearGradient colors={['#ff4d4d', '#cc0000']} style={styles.sosButton}>
                        <MaterialCommunityIcons name="shield-alert-outline" size={28} color="#fff" />
                        <Text style={styles.sosText}>SOS</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.bgPrimary,
          paddingHorizontal: 0,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: THEME.bgPrimary,

    },
    headerContainer: {
        paddingBottom: 15,
    },
    heroSection: {
        paddingTop: Platform.OS === 'android' ? 10 : 5,
        paddingHorizontal: 10,
        paddingBottom: 15,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: THEME.gold,
    },
    greetingText: {
        fontSize: 12,
        color: THEME.textSecondary,
        fontWeight: '500',
    },
    welcomeText: {
        fontSize: 16,
        color: THEME.textPrimary,
        fontWeight: '700',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    locationText: {
        fontSize: 11,
        color: THEME.textPrimary,
        marginLeft: 4,
        maxWidth: 90,
    },
    notifBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.border,
        backgroundColor: THEME.glass,
    },
    redDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    heroBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroTextContent: {
        flex: 1,
        paddingRight: 10,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: THEME.textPrimary,
        lineHeight: 34,
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 12,
        color: THEME.textSecondary,
        lineHeight: 18,
        marginBottom: 20,
    },
    heroActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryCta: {
        backgroundColor: THEME.gold,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 12,
        shadowColor: THEME.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryCtaText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 13,
    },
    secondaryCta: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    secondaryCtaText: {
        color: THEME.textPrimary,
        fontWeight: '600',
        fontSize: 13,
    },
    heroLottieContainer: {
        width: 130,
        height: 130,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: 150,
        height: 150,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        borderRadius: 22,
        paddingHorizontal: 18,
        height: 56,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 25,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: THEME.textPrimary,
        height: '100%',
    },
    filterContainer: {
        marginBottom: 25,
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: THEME.card,
        marginRight: 12,
        borderWidth: 1,
        borderColor: THEME.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    activePill: {
        backgroundColor: THEME.gold,
        borderColor: THEME.gold,
        shadowColor: THEME.gold,
        shadowOpacity: 0.2,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.textSecondary,
    },
    activeFilterText: {
        color: '#000',
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    statCard: {
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 15,
        marginRight: 15,
        minWidth: 110,
        borderWidth: 1,
        borderColor: THEME.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 11,
        color: THEME.textSecondary,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: THEME.textPrimary,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: THEME.textSecondary,
        marginTop: 4,
    },
    viewAllText: {
        fontSize: 13,
        color: THEME.gold,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: THEME.card,
        borderRadius: 24,
        marginBottom: 12,
        marginRight: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    imageContainer: {
        height: 130,
        width: '100%',
        backgroundColor: THEME.bgSecondary,
        position: 'relative',
    },
    horizontalCardsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 4,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    favBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        borderRadius: 15,
        overflow: 'hidden',
    },
    iconBlur: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    statusBadgeWrapper: {
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    blurBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'transparent',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    cardContent: {
        padding: 12,
    },
    roleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    roleText: {
        color: THEME.gold,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    verifiedBadge: {
        marginLeft: 6,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: THEME.textPrimary,
        marginLeft: 4,
    },
    expText: {
        fontSize: 11,
        color: THEME.textSecondary,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: THEME.border,
    },

    price: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.textPrimary,
    },
    perHr: {
        fontSize: 10,
        fontWeight: '500',
        color: THEME.textSecondary,
    },
    bookBtn: {
        backgroundColor: THEME.gold,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    bookBtnText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '700',
    },
    sosWrapper: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 0, 0, 0.4)',
    },
    sosButton: {
        width: 66,
        height: 66,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    sosText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 11,
        marginTop: 2,
        letterSpacing: 0.5,
    },
    skeletonImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#2A2A2A',
    },
    skeletonText: {
        height: 12,
        backgroundColor: '#2A2A2A',
        borderRadius: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginTop: 15,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: THEME.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.gold,
    },
    retryText: {
        color: THEME.gold,
        fontWeight: '600',
        fontSize: 14,
    },

    footerContainer: {
        paddingTop: 40,
        backgroundColor: THEME.bgPrimary,
    },
    footerSection: {
        paddingHorizontal: 20,
        marginBottom: 50,
    },
    footerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 8,
    },
    footerSubtitle: {
        fontSize: 13,
        color: THEME.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureCard: {
        width: '48%',
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    featureIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginBottom: 6,
    },
    featureDesc: {
        fontSize: 11,
        color: THEME.textSecondary,
        lineHeight: 16,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    achCard: {
        width: '48%',
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.border,
    },
    achValue: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 4,
    },
    achTitle: {
        fontSize: 11,
        color: THEME.textSecondary,
        fontWeight: '500',
        textAlign: 'center',
    },
    testimonialScroll: {
        paddingRight: 20,
    },
    testCard: {
        width: 280,
        backgroundColor: THEME.card,
        borderRadius: 20,
        padding: 20,
        marginRight: 16,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    testHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    testAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    testName: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.textPrimary,
    },
    testRole: {
        fontSize: 11,
        color: THEME.textSecondary,
        marginTop: 2,
    },
    testStars: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    testText: {
        fontSize: 13,
        color: THEME.textPrimary,
        lineHeight: 20,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    testDate: {
        fontSize: 10,
        color: THEME.textSecondary,
    },
    logoScroll: {
        paddingRight: 20,
    },
    logoCard: {
        backgroundColor: THEME.card,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: THEME.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#666',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    comparisonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    compColumn: {
        width: '48%',
        backgroundColor: THEME.bgSecondary,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    compColumnGood: {
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderColor: THEME.gold,
    },
    compHeaderBad: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    compHeaderGood: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.gold,
        marginBottom: 16,
        textAlign: 'center',
    },
    compRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    compTextBad: {
        fontSize: 11,
        color: THEME.textSecondary,
        flex: 1,
        lineHeight: 16,
    },
    compTextGood: {
        fontSize: 11,
        color: THEME.textPrimary,
        flex: 1,
        lineHeight: 16,
        fontWeight: '500',
    },
    timelineContainer: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timelineIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: THEME.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.gold,
        zIndex: 2,
    },
    timelineLine: {
        position: 'absolute',
        top: 44,
        left: 21,
        width: 2,
        height: '100%',
        backgroundColor: THEME.border,
        zIndex: 1,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 16,
        backgroundColor: THEME.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    timelineStep: {
        fontSize: 10,
        fontWeight: '800',
        color: THEME.gold,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 12,
        color: THEME.textSecondary,
        lineHeight: 18,
    },
    safetyBanner: {
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.border,
    },
    safetyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    safetyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: THEME.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    safetyDesc: {
        fontSize: 13,
        color: THEME.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    safetyBtn: {
        backgroundColor: THEME.gold,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    safetyBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    ctaCard: {
        padding: 30,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: THEME.border,
        backgroundColor: 'rgba(255,255,255,0.02)',
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: THEME.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    ctaDesc: {
        fontSize: 13,
        color: THEME.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    ctaActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    ctaBtnPrimary: {
        backgroundColor: THEME.gold,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 24,
        marginRight: 12,
        flex: 1,
        alignItems: 'center',
    },
    ctaBtnPrimaryText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    ctaBtnSecondary: {
        borderWidth: 1,
        borderColor: THEME.textPrimary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 24,
        flex: 1,
        alignItems: 'center',
    },
    ctaBtnSecondaryText: {
        color: THEME.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },

});