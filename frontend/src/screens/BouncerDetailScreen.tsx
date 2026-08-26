import React, { useEffect, useState, useLayoutEffect, useContext } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    StatusBar,
    Alert,
    Modal,
    Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';

type BouncerDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'BouncerDetail'>;
type BouncerDetailScreenRouteProp = RouteProp<HomeStackParamList, 'BouncerDetail'>;

type Props = {
    navigation: BouncerDetailScreenNavigationProp;
    route: BouncerDetailScreenRouteProp;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BouncerDetails extends Bouncer {
    certifications: string[];
    specialties: string[];
    galleryPhotos: string[];
}

export default function BouncerDetailScreen({ navigation, route }: Props) {
    const { bouncerId } = route.params;
    const [bouncer, setBouncer] = useState<BouncerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<'SINGLE_SHIFT' | 'VIP_BODYGUARD'>('SINGLE_SHIFT');
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '',
            headerTransparent: true,
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBackBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>

            ),
        });
    }, [navigation]);

    useEffect(() => {
        const fetchBouncer = async () => {
            try {
                const response = await api.get<any>(`/api/bouncers/${bouncerId}`);
                const bouncerData: any = response.data;

                const defaultCerts = ['Govt Security License', 'Background Checked', 'Liveness Verified'];
                if (bouncerData.hasGunLicense || bouncerData.isGunman) {
                    defaultCerts.push('Armed Carry Permit');
                }

                const defaultSkills = bouncerData.skills && bouncerData.skills.length > 0
                    ? bouncerData.skills
                    : ['Access Control', 'VIP Escort', 'Crowd Management', 'Emergency Response', 'Event Protection'];

                // High-quality duty photo fallbacks if gallery is empty
                const defaultDutyPhotos = [
                    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=500&q=80',
                    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=500&q=80',
                    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&q=80',
                ];

                const gallery = (bouncerData.gallery && bouncerData.gallery.length > 0)
                    ? bouncerData.gallery
                    : defaultDutyPhotos;

                setBouncer({
                    ...bouncerData,
                    name: bouncerData.name || bouncerData.user?.name || 'Security Officer',
                    profilePhoto: bouncerData.profilePhoto || bouncerData.profile_image_url || bouncerData.user?.profilePhoto,
                    bio: bouncerData.bio || `Certified security professional specializing in executive protection, private event management, and access control. Verified by ShieldHire.`,
                    certifications: defaultCerts,
                    specialties: defaultSkills,
                    galleryPhotos: gallery,
                });

            } catch (error) {
                console.error('[BouncerDetail] Load Error:', error);
                Alert.alert('Notice', 'Failed to load guard profile');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        fetchBouncer();
    }, [bouncerId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading Security Profile...</Text>
            </View>
        );
    }

    if (!bouncer) return null;

    const isGunman = bouncer.isGunman || bouncer.hasGunLicense;
    const SINGLE_SHIFT_PRICE = (bouncer as any).singleShiftPrice || (isGunman ? 3500 : 2000);
    const VIP_BODYGUARD_PRICE = (bouncer as any).vipBodyguardPrice || 4000;
    const selectedBasePrice = selectedPackage === 'VIP_BODYGUARD' ? VIP_BODYGUARD_PRICE : SINGLE_SHIFT_PRICE;
    const displayRating = bouncer.rating && bouncer.rating > 0 ? bouncer.rating.toFixed(1) : '4.8';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero Profile Banner */}
                <View style={styles.heroContainer}>
                    {bouncer.profilePhoto ? (
                        <Image source={{ uri: bouncer.profilePhoto }} style={styles.heroBlurImage} blurRadius={12} />
                    ) : (
                        <View style={[styles.heroBlurImage, { backgroundColor: '#1A1A1E' }]} />
                    )}
                    <LinearGradient colors={['rgba(10,10,10,0.3)', 'rgba(10,10,10,0.85)', '#0A0A0A']} style={styles.heroGradientOverlay} />

                    {/* Back Button */}
                    <TouchableOpacity style={styles.topBackBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Center Avatar & Info */}
                    <View style={styles.profileHeaderBox}>
                        <View style={styles.avatarWrap}>
                            {bouncer.profilePhoto ? (
                                <Image source={{ uri: bouncer.profilePhoto }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialCommunityIcons name="account-shield" size={60} color="#FFD700" />
                                </View>
                            )}
                            <View style={styles.verifiedBadgeIcon}>
                                <MaterialCommunityIcons name="check-decagram" size={22} color="#FFD700" />
                            </View>
                        </View>

                        <Text style={styles.guardName}>{bouncer.name}</Text>

                        <View style={styles.roleTagWrap}>
                            <View style={[styles.roleTagPill, isGunman ? styles.gunmanPill : styles.bouncerPill]}>
                                <MaterialCommunityIcons name={isGunman ? 'shield-cross' : 'shield-account'} size={14} color={isGunman ? '#f87171' : '#FFD700'} style={{ marginRight: 5 }} />
                                <Text style={[styles.roleTagLabel, { color: isGunman ? '#f87171' : '#FFD700' }]}>
                                    {isGunman ? 'ARMED GUNMAN' : 'ELITE BOUNCER'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingScore}>{displayRating}</Text>
                            <Text style={styles.ratingSubText}>(75 Verified Hires)</Text>
                        </View>
                    </View>
                </View>

                {/* Key Metrics Stats Row */}
                <View style={styles.statsMetricsRow}>
                    <View style={styles.metricCard}>
                        <Ionicons name="briefcase-outline" size={18} color="#FFD700" />
                        <Text style={styles.metricValue}>{bouncer.experience || 5}+ Yrs</Text>
                        <Text style={styles.metricLabel}>Experience</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#4ade80" />
                        <Text style={styles.metricValue}>100%</Text>
                        <Text style={styles.metricLabel}>Verified</Text>
                    </View>

                    <View style={styles.metricCard}>
                        <Ionicons name="time-outline" size={18} color="#5AC8FA" />
                        <Text style={styles.metricValue}>Instant</Text>
                        <Text style={styles.metricLabel}>Dispatch</Text>
                    </View>
                </View>

                {/* Main Section Content */}
                <View style={styles.contentBody}>

                    {/* Verified Credentials */}
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionHeaderTitle}>Verified Credentials</Text>
                        <View style={styles.certsGrid}>
                            {bouncer.certifications.map((cert, idx) => (
                                <View key={idx} style={styles.certBadgePill}>
                                    <MaterialCommunityIcons name="certificate" size={15} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.certBadgeText}>{cert}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* About Security Profile */}
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionHeaderTitle}>About Security Profile</Text>
                        <View style={styles.bioCard}>
                            <Text style={styles.bioText}>{bouncer.bio}</Text>
                        </View>
                    </View>

                    {/* Tactical Skills */}
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionHeaderTitle}>Tactical Skills</Text>
                        <View style={styles.skillsGridWrap}>
                            {bouncer.specialties.map((skill, idx) => (
                                <View key={idx} style={styles.skillPill}>
                                    <Ionicons name="checkmark-circle" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.skillPillText}>{skill}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Duty Photos Gallery */}
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionHeaderTitle}>Duty & Field Photos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                            {bouncer.galleryPhotos.map((photoUrl, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.galleryCard}
                                    onPress={() => setSelectedImageIndex(idx)}
                                    activeOpacity={0.88}
                                >
                                    <Image source={{ uri: photoUrl }} style={styles.galleryImage} resizeMode="cover" />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.galleryOverlay} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Hiring Package Selection */}
                    <View style={styles.sectionWrap}>
                        <Text style={styles.sectionHeaderTitle}>Hiring Packages</Text>

                        {/* Single Shift Card */}
                        <TouchableOpacity
                            style={[
                                styles.packageCard,
                                selectedPackage === 'SINGLE_SHIFT' && styles.packageCardSelected
                            ]}
                            onPress={() => setSelectedPackage('SINGLE_SHIFT')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.packageHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.packageTitle}>Single Event Shift</Text>
                                    <Text style={styles.packageSubtitle}>4-Hour Standard Event Security Detail</Text>
                                </View>
                                <Text style={styles.packagePriceText}>₹{SINGLE_SHIFT_PRICE}</Text>
                            </View>

                            <View style={styles.packageDivider} />

                            <View style={styles.packageFeaturesList}>
                                <View style={styles.featureItemRow}>
                                    <Ionicons name="checkmark" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.featureItemText}>Entry Screening & Access Control</Text>
                                </View>
                                <View style={styles.featureItemRow}>
                                    <Ionicons name="checkmark" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.featureItemText}>Crowd Control & Venue De-escalation</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* VIP Bodyguard Card */}
                        <TouchableOpacity
                            style={[
                                styles.packageCard,
                                styles.vipCard,
                                selectedPackage === 'VIP_BODYGUARD' && styles.vipCardSelected
                            ]}
                            onPress={() => setSelectedPackage('VIP_BODYGUARD')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.packageHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={[styles.packageTitle, { color: '#000' }]}>VIP Bodyguard Escort</Text>
                                        <MaterialCommunityIcons name="shield-crown" size={16} color="#000" style={{ marginLeft: 6 }} />
                                    </View>
                                    <Text style={[styles.packageSubtitle, { color: '#222' }]}>Dedicated Close Protection & Escort</Text>
                                </View>
                                <Text style={[styles.packagePriceText, { color: '#000' }]}>₹{VIP_BODYGUARD_PRICE}</Text>
                            </View>

                            <View style={[styles.packageDivider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />

                            <View style={styles.packageFeaturesList}>
                                <View style={styles.featureItemRow}>
                                    <Ionicons name="checkmark" size={14} color="#000" style={{ marginRight: 6 }} />
                                    <Text style={[styles.featureItemText, { color: '#111' }]}>Personal Escort & Threat Assessment</Text>
                                </View>
                                <View style={styles.featureItemRow}>
                                    <Ionicons name="checkmark" size={14} color="#000" style={{ marginRight: 6 }} />
                                    <Text style={[styles.featureItemText, { color: '#111' }]}>Armed Defense Protection (if licensed)</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 110 }} />
                </View>
            </ScrollView>

            {/* Bottom Sticky Action Footer */}
            <View style={styles.stickyFooterBar}>
                <View>
                    <Text style={styles.footerPriceLabel}>Selected Shift Rate</Text>
                    <Text style={styles.footerPriceValue}>₹{selectedBasePrice} <Text style={styles.footerPerShift}>/ shift</Text></Text>
                </View>

                <TouchableOpacity
                    style={styles.hireGuardBtn}
                    onPress={() => navigation.navigate('BookingFlow', { bouncerId: bouncer.id, price: selectedBasePrice, package: selectedPackage })}
                    activeOpacity={0.88}
                >
                    <Text style={styles.hireGuardBtnText}>HIRE GUARD NOW</Text>
                    <Ionicons name="shield-checkmark" size={18} color="#000" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            {/* Fullscreen Image Preview Modal */}
            <Modal
                visible={selectedImageIndex !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImageIndex(null)}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedImageIndex(null)}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    {selectedImageIndex !== null && (
                        <Image
                            source={{ uri: bouncer.galleryPhotos[selectedImageIndex] }}
                            style={styles.modalFullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
    },
    loadingText: {
        fontSize: 14,
        color: '#888',
        marginTop: 12,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    heroContainer: {
        width: '100%',
        height: 290,
        position: 'relative',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    heroBlurImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    heroGradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    topBackBtn: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 14 : 44,
        left: 18,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 10,
    },
    profileHeaderBox: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 10,
    },
    avatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2.5,
        borderColor: '#FFD700',
    },
    avatarPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#1E1E22',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    verifiedBadgeIcon: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
    },
    guardName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
    },
    roleTagWrap: {
        marginTop: 6,
        marginBottom: 8,
    },
    roleTagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
    },
    bouncerPill: {
        backgroundColor: 'rgba(255,215,0,0.12)',
        borderColor: 'rgba(255,215,0,0.3)',
    },
    gunmanPill: {
        backgroundColor: 'rgba(248,113,113,0.12)',
        borderColor: 'rgba(248,113,113,0.3)',
    },
    roleTagLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingScore: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
        marginLeft: 5,
    },
    ratingSubText: {
        fontSize: 12,
        color: '#888',
        marginLeft: 6,
    },
    statsMetricsRow: {
        flexDirection: 'row',
        marginHorizontal: 18,
        marginTop: -10,
        marginBottom: 20,
        backgroundColor: '#161618',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'space-around',
        elevation: 3,
    },
    metricCard: {
        alignItems: 'center',
        flex: 1,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
        marginTop: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    contentBody: {
        paddingHorizontal: 18,
    },
    sectionWrap: {
        marginBottom: 24,
    },
    sectionHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    certsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    certBadgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161618',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    certBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ddd',
    },
    bioCard: {
        backgroundColor: '#161618',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    bioText: {
        fontSize: 13,
        color: '#ccc',
        lineHeight: 20,
    },
    skillsGridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161618',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    skillPillText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    galleryRow: {
        gap: 12,
    },
    galleryCard: {
        width: 140,
        height: 100,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    galleryOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    packageCard: {
        backgroundColor: '#161618',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    packageCardSelected: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.04)',
    },
    vipCard: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    vipCardSelected: {
        borderWidth: 2,
        borderColor: '#FFF',
    },
    packageHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    packageSubtitle: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    packagePriceText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFD700',
    },
    packageDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: 12,
    },
    packageFeaturesList: {
        gap: 6,
    },
    featureItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureItemText: {
        fontSize: 12,
        color: '#ccc',
    },
    stickyFooterBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#161618',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerPriceLabel: {
        fontSize: 11,
        color: '#888',
    },
    footerPriceValue: {
        fontSize: 19,
        fontWeight: '900',
        color: '#FFD700',
    },
    footerPerShift: {
        fontSize: 12,
        color: '#888',
        fontWeight: '400',
    },
    hireGuardBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 16,
        elevation: 4,
    },
    hireGuardBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalFullImage: {
        width: SCREEN_WIDTH * 0.92,
        height: SCREEN_WIDTH * 0.92,
        borderRadius: 16,
    },
});
