import React, { useEffect, useState, useLayoutEffect } from 'react';
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
    Linking
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MainTabParamList, HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'HomeStack'>,
    StackNavigationProp<HomeStackParamList>
>;

type Props = {
    navigation: HomeScreenNavigationProp;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function HomeScreen({ navigation }: Props) {
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [locationName, setLocationName] = useState('Mumbai, India');

    useEffect(() => {
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
                    // Optionally request permission here or rely on default
                    // setLocationName('Permission Denied');
                }
            });
        }
    };

    // Hide default header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Mock Data for Security Personnel


    const fetchSecurityPersonnel = async () => {
        setLoading(true);
        try {
            const response = await api.get<Bouncer[]>('/api/bouncers', {
                params: { search }
            });

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

    // Debounced search effect
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            fetchSecurityPersonnel();
        }, 500); // 500ms debounce

        return () => clearTimeout(delayTimer);
    }, [search]);

    const filteredPersonnel = bouncers.filter(t => {
        // Filter by Search
        const searchMatches = search.toLowerCase();
        const role = t.isGunman ? 'Gunman' : 'Bouncer';

        if (search && !t.name.toLowerCase().includes(searchMatches) &&
            !role.toLowerCase().includes(searchMatches)) {
            return false;
        }

        // Filter by Category
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Bouncer') return !t.isGunman;
        if (activeFilter === 'Gunman') return t.isGunman;
        if (activeFilter === 'Top Rated') return t.rating >= 4.9;

        return true;
    });

    const getStatusStyle = (available: boolean) => {
        if (available) return { text: 'Available', bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '#22c55e' };
        return { text: 'Busy', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '#ef4444' };
    };

    const renderHeader = () => (
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
                <Text style={styles.heroTitle}>Hire Top-Tier{'\n'}<Text style={{ color: '#FFD700' }}>Security Professionals</Text></Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Bouncers, Gunmen..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#666"
                />
            </View>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['All', 'Bouncer', 'Gunman', 'VIP', 'Top Rated']}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => {
                        const isActive = activeFilter === item;
                        return (
                            <TouchableOpacity
                                style={[styles.filterPill, isActive && styles.activePill]}
                                onPress={() => setActiveFilter(item)}
                            >
                                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingRight: 20 }}
                />
            </View>
        </View>
    );

    const renderCard = ({ item }: { item: Bouncer }) => {
        const status = getStatusStyle(item.isAvailable);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('BouncerDetail', { bouncerId: item.id })}
                activeOpacity={0.8}
            >
                {/* Image Section */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: item.profilePhoto
                                ? item.profilePhoto
                                : `https://i.pravatar.cc/300?u=${item.id}`
                        }}
                        style={styles.image}
                        resizeMode="cover"
                    />

                    {/* Dark Gradient Overlay */}
                    <View style={styles.imageOverlay} />

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>
                            {status.text}
                        </Text>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.cardContent}>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{(item.isGunman ? 'Gunman' : 'Bouncer').toUpperCase()}</Text>
                    </View>

                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.expText}>{item.experience || 0} Yrs Exp</Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{item.isGunman ? 3500 : 2000}<Text style={styles.perHr}>/shift</Text></Text>
                        <TouchableOpacity style={styles.arrowBtn}>
                            <Ionicons name="arrow-forward" size={16} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
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

    const [sosLoading, setSosLoading] = useState(false);

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
                    Alert.alert('Alert Sent', 'Admin and nearby Bouncers have been notified of your emergency.');
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
            'Are you sure you want to send an emergency alert?',
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.mainContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
                {renderHeader()}

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredPersonnel}
                        renderItem={renderCard}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.columnWrapper}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 52,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    // Filters
    filterContainer: {
        marginBottom: 10,
    },
    filterPill: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: '#1E1E1E',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    activePill: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    activeFilterText: {
        color: '#000',
    },
    // Grid
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    // Card
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    imageContainer: {
        height: 150,
        width: '100%',
        backgroundColor: '#2A2A2A',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    statusBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // fallback
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    cardContent: {
        padding: 12,
    },
    roleTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
    },
    roleText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ddd',
        marginLeft: 4,
    },
    expText: {
        fontSize: 12,
        color: '#888',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    perHr: {
        fontSize: 11,
        fontWeight: '400',
        color: '#888',
    },
    arrowBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
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
