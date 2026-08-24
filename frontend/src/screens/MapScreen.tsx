import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Image, ActivityIndicator, Dimensions, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import LinearGradient from 'react-native-linear-gradient';

type MapScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'MapScreen'>;
type MapScreenRouteProp = RouteProp<HomeStackParamList, 'MapScreen'>;

type Props = {
    navigation: MapScreenNavigationProp;
    route: MapScreenRouteProp;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#141416' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252528' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1c1c1e' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09090a' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function MapScreen({ navigation, route }: Props) {
    const params = route.params || {};
    const mode = params.mode || (params.bouncerId ? 'pin' : 'explore');
    const initialLat = params.initialLatitude || 19.0760;
    const initialLng = params.initialLongitude || 72.8777;

    const [userCoords, setUserCoords] = useState({ latitude: initialLat, longitude: initialLng });
    const [pinCoords, setPinCoords] = useState({ latitude: initialLat, longitude: initialLng });
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [selectedBouncer, setSelectedBouncer] = useState<Bouncer | null>(null);
    const [loading, setLoading] = useState(mode === 'explore');
    const mapRef = useRef<MapView>(null);
    const cardAnim = useRef(new Animated.Value(200)).current;

    // Fetch user location
    useEffect(() => {
        const fetchLocation = () => {
            Geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setUserCoords(coords);
                    if (mode === 'pin' && initialLat === 19.0760) {
                        setPinCoords(coords);
                    }
                    mapRef.current?.animateToRegion({
                        ...coords,
                        latitudeDelta: 0.04,
                        longitudeDelta: 0.04,
                    }, 1000);
                },
                (err) => console.log('[MapScreen] Location error:', err.message),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        };

        if (Platform.OS === 'android') {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((granted) => {
                if (granted) fetchLocation();
            });
        } else {
            Geolocation.requestAuthorization('whenInUse').then((res) => {
                if (res === 'granted') fetchLocation();
            });
        }
    }, []);

    // Fetch guards for explore mode
    useEffect(() => {
        if (mode === 'explore') {
            fetchNearbyGuards();
        }
    }, [mode]);

    const fetchNearbyGuards = async () => {
        setLoading(true);
        try {
            const res = await api.get<Bouncer[]>('/api/bouncers');
            const data = res.data || [];
            setBouncers(data);
            if (data.length > 0 && !selectedBouncer) {
                setSelectedBouncer(data[0]);
            }
        } catch (e) {
            console.log('[MapScreen] Fetch bouncers error:', e);
            setBouncers([]);
        } finally {
            setLoading(false);
        }
    };

    const getGuardCoords = (bouncer: Bouncer): { latitude: number; longitude: number } | null => {
        const lat = (bouncer as any).latitude;
        const lng = (bouncer as any).longitude;
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
        }
        return null;
    };

    const handleConfirmPin = () => {
        navigation.navigate('BookingFlow', {
            bouncerId: params.bouncerId || '',
            price: params.price || 2000,
            package: params.package || 'SINGLE_SHIFT',
            selectedCoordinate: pinCoords,
        });
    };

    const handleBookGuard = (b: Bouncer) => {
        navigation.navigate('BookingFlow', {
            bouncerId: b.id,
            price: b.isGunman ? 3500 : 2000,
            package: 'SINGLE_SHIFT',
        });
    };

    const handleViewProfile = (b: Bouncer) => {
        navigation.navigate('BouncerDetail', { bouncerId: b.id });
    };

    return (
        <View style={styles.container}>
            {/* Header Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>
                        {mode === 'explore' ? 'Nearby Security Radar' : 'Pin Event Location'}
                    </Text>
                    {mode === 'explore' && (
                        <Text style={styles.headerSubtitle}>
                            {bouncers.filter(b => getGuardCoords(b) !== null).length} guards with live location
                        </Text>
                    )}
                </View>
                {mode === 'explore' ? (
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchNearbyGuards}>
                        <Ionicons name="refresh" size={18} color="#FFD700" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: userCoords.latitude,
                        longitude: userCoords.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    customMapStyle={darkMapStyle}
                    onPress={(e) => {
                        if (mode === 'pin' && e.nativeEvent?.coordinate) {
                            setPinCoords(e.nativeEvent.coordinate);
                        }
                    }}
                >
                    {/* Mode: Pin Venue */}
                    {mode === 'pin' && (
                        <Marker
                            draggable
                            coordinate={pinCoords}
                            onDragEnd={(e) => e.nativeEvent?.coordinate && setPinCoords(e.nativeEvent.coordinate)}
                            title="Event Venue"
                            description="Drag marker to exact entrance"
                        />
                    )}

                    {/* User yellow dot */}
                    {mode === 'explore' && (
                        <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={styles.userDotOuter}>
                                <View style={styles.userDotInner} />
                            </View>
                        </Marker>
                    )}

                    {/* Mode: Explore Guards */}
                    {mode === 'explore' &&
                        bouncers.map((b) => {
                            const coords = getGuardCoords(b);
                            if (!coords) return null; // skip bouncers with no real location
                            const isSelected = selectedBouncer?.id === b.id;
                            const isGunman = b.isGunman || (b as any).hasGunLicense;

                            return (
                                <Marker
                                    key={b.id}
                                    coordinate={coords}
                                    onPress={() => {
                                        setSelectedBouncer(b);
                                        mapRef.current?.animateToRegion({
                                            ...coords,
                                            latitudeDelta: 0.02,
                                            longitudeDelta: 0.02,
                                        }, 500);
                                        cardAnim.setValue(200);
                                        Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
                                    }}
                                >
                                    <View style={[styles.customPin, isSelected && styles.customPinSelected]}>
                                        <MaterialCommunityIcons
                                            name={isGunman ? 'shield-cross' : 'shield-account'}
                                            size={20}
                                            color="#000"
                                        />
                                    </View>
                                </Marker>
                            );
                        })}
                </MapView>

                {/* Loading indicator */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.loadingText}>Scanning Nearby Security Personnel...</Text>
                    </View>
                )}

                {/* Instruction Banner for Pin Mode */}
                {mode === 'pin' && (
                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>Drag marker to exact entrance or venue spot.</Text>
                    </View>
                )}
            </View>

            {/* Footer / Floating Card Sheet */}
            {mode === 'pin' ? (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPin}>
                        <Text style={styles.confirmBtnText}>CONFIRM VENUE LOCATION</Text>
                    </TouchableOpacity>
                </View>
            ) : selectedBouncer ? (
                <Animated.View style={[styles.selectedCardSheet, { transform: [{ translateY: cardAnim }] }]}>
                    <TouchableOpacity onPress={() => handleViewProfile(selectedBouncer)} activeOpacity={0.95}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.guardCardHeader}>
                        {selectedBouncer.profilePhoto || (selectedBouncer as any).profileImageUrl ? (
                            <Image
                                source={{ uri: selectedBouncer.profilePhoto || (selectedBouncer as any).profileImageUrl }}
                                style={styles.guardAvatar}
                            />
                        ) : (
                            <View style={styles.guardAvatarPlaceholder}>
                                <MaterialCommunityIcons name="account-shield" size={28} color="#FFD700" />
                            </View>
                        )}
                        <View style={styles.guardInfoWrap}>
                            <View style={styles.guardTitleRow}>
                                <Text style={styles.guardName} numberOfLines={1}>
                                    {selectedBouncer.name || selectedBouncer.user?.name || 'Security Professional'}
                                </Text>
                                <MaterialCommunityIcons name="check-decagram" size={16} color="#FFD700" style={{ marginLeft: 6 }} />
                            </View>
                            <Text style={styles.guardRole}>
                                {selectedBouncer.isGunman ? 'Armed Gunman' : 'Elite Bouncer'} • {selectedBouncer.experience || 5} Yrs Exp
                            </Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={12} color="#FFD700" />
                                <Text style={styles.ratingValue}>
                                    {selectedBouncer.rating ? selectedBouncer.rating.toFixed(1) : '4.8'}
                                </Text>
                                <Text style={styles.statusDotText}>• Tap card for profile</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sheetDivider} />

                    <View style={styles.sheetFooterRow}>
                        <View>
                            <Text style={styles.priceLabel}>Shift Rate</Text>
                            <Text style={styles.priceValue}>₹{selectedBouncer.isGunman ? 3500 : 2000}<Text style={{ fontSize: 11, color: '#888' }}>/shift</Text></Text>
                        </View>

                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={styles.profileBtn} onPress={() => handleViewProfile(selectedBouncer)}>
                                <Text style={styles.profileBtnText}>Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.bookNowBtn} onPress={() => handleBookGuard(selectedBouncer)}>
                                <Ionicons name="shield-checkmark" size={16} color="#000" style={{ marginRight: 6 }} />
                                <Text style={styles.bookNowBtnText}>Book Guard</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    </TouchableOpacity>
                </Animated.View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 14 : 40,
        paddingBottom: 12,
        backgroundColor: '#161618',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#FFD700',
        marginTop: 2,
        fontWeight: '600',
    },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,215,0,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(22,22,24,0.92)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    loadingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    instructionBox: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(22,22,24,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    instructionText: {
        color: '#fff',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    customPin: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
        elevation: 6,
    },
    customPinSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFD700',
        transform: [{ scale: 1.25 }],
    },
    footer: {
        padding: 16,
        backgroundColor: '#161618',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    confirmBtn: {
        backgroundColor: '#FFD700',
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    selectedCardSheet: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#161618',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        elevation: 10,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
        marginBottom: 12,
    },
    guardCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guardAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: '#FFD700',
        marginRight: 14,
    },
    guardAvatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#252528',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.4)',
    },
    guardInfoWrap: {
        flex: 1,
    },
    guardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guardName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        flex: 1,
    },
    guardRole: {
        fontSize: 12,
        color: '#FFD700',
        fontWeight: '600',
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 4,
    },
    statusDotText: {
        fontSize: 11,
        color: '#4ade80',
        marginLeft: 8,
        fontWeight: '600',
    },
    sheetDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: 14,
    },
    sheetFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceLabel: {
        fontSize: 11,
        color: '#888',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFD700',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileBtn: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
    },
    profileBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    bookNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
    },
    bookNowBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '800',
    },
    userDotOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    userDotInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFD700',
    },
});
