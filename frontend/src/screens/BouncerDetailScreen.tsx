import React, { useEffect, useState, useLayoutEffect } from 'react';
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
    Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type BouncerDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'BouncerDetail'>;
type BouncerDetailScreenRouteProp = RouteProp<HomeStackParamList, 'BouncerDetail'>;

type Props = {
    navigation: BouncerDetailScreenNavigationProp;
    route: BouncerDetailScreenRouteProp;
};

// Extended mock type for the UI
interface BouncerDetails extends Bouncer {
    certifications: string[];
    reviews: { id: string; user: string; rating: number; text: string; time: string; avatar: string }[];
    specialties: string[];
}

const MOCK_EXTENDED_DATA: Record<string, Partial<BouncerDetails>> = {
    'default': {
        certifications: ['Firearms License (Class A)', 'Advanced Crowd Control', 'Red Cross First Aid', 'VIP Protection Certified'],
        specialties: ['High-Profile Event Security', 'Close Protection', 'Surveillance', 'Conflict De-escalation', 'Emergency Response'],
        gallery: [
            'https://images.unsplash.com/photo-1542407289-53e3fa51ba28?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1574768822692-adfb9b392fa9?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1629853381628-9cda81580235?q=80&w=300&auto=format&fit=crop'
        ],
        reviews: [
            { id: 'r1', user: 'James Bond', rating: 5, time: '2 weeks ago', text: 'Top notch security. Handled the crowd perfectly.', avatar: 'https://i.pravatar.cc/100?img=12' },
            { id: 'r2', user: 'Club X', rating: 5, time: '1 month ago', text: 'Very professional bouncer. No trouble all night.', avatar: 'https://i.pravatar.cc/100?img=33' },
            { id: 'r3', user: 'Sarah Connor', rating: 4, time: '2 months ago', text: 'Felt very safe with him as my bodyguard.', avatar: 'https://i.pravatar.cc/100?img=5' }
        ]
    }
};

export default function BouncerDetailScreen({ navigation, route }: Props) {
    const { bouncerId } = route.params;
    const [bouncer, setBouncer] = useState<BouncerDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '',
            headerTransparent: true,
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        const fetchBouncer = async () => {
            try {
                // Try to get real data first
                let bouncerData: any = null;
                try {
                    const response = await api.get<any>(`/api/bouncers/${bouncerId}`);
                    const bouncer: any = response.data;

                    // Map Bouncer to Security UI structure
                    bouncerData = {
                        ...bouncer,
                        bio: bouncer.bio || `Professional ${bouncer.isGunman ? 'Armed Security Officer' : 'Bouncer'} with verification status: ${bouncer.verificationStatus}. Dedicated to ensuring safety and order.`,
                        certifications: bouncer.hasGunLicense ? ['Firearms License', 'Crowd Control', 'First Aid'] : ['Crowd Control', 'First Aid', 'Conflict Resolution']
                    };
                } catch (e) {
                    console.log('Error fetching bouncer details', e);
                    // Fallback Mock Logic
                    bouncerData = {
                        id: bouncerId,
                        name: 'Guard Name',
                        isGunman: false,
                        rating: 4.9,
                        experience: 5,
                        isAvailable: true,
                        bio: 'Highly trained security professional with years of experience in crowd control, VIP protection, and threat assessment. Dedicated to ensuring safety and order.'
                    };
                }

                // Merge with UI-specific mock data
                const extended = MOCK_EXTENDED_DATA['default']!;

                setBouncer({
                    ...bouncerData,
                    ...extended,
                    certifications: bouncerData.certifications || extended.certifications,
                    bio: bouncerData.bio || 'Highly trained security professional with years of experience in crowd control, VIP protection, and threat assessment.',
                });

            } catch (error) {
                Alert.alert('Error', 'Failed to load details');
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
            </View>
        );
    }

    if (!bouncer) return null;

    const currentPrice = bouncer.isGunman ? 3500 : 2000;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.backgroundContainer} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Header Image Background */}
                <View style={styles.headerImageContainer}>
                    <Image
                        source={{ uri: bouncer.profilePhoto || `https://i.pravatar.cc/300?u=${bouncer.id}` }}
                        style={styles.headerImage}
                        blurRadius={4}
                    />
                    <View style={styles.headerOverlay} />

                    <View style={styles.profileInfoCentered}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: bouncer.profilePhoto || `https://i.pravatar.cc/300?u=${bouncer.id}` }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineBadge} />
                        </View>
                        <Text style={styles.name}>{bouncer.name}</Text>
                        <View style={styles.specBadge}>
                            <Text style={styles.specText}>{bouncer.isGunman ? 'Gunman' : 'Bouncer'}</Text>
                        </View>

                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons key={s} name="star" size={14} color="#FFD700" />
                            ))}
                            <Text style={styles.ratingText}>{bouncer.rating.toFixed(1)} (75 Verified Jobs)</Text>
                        </View>
                    </View>
                </View>

                {/* Main Content Body */}
                <View style={styles.bodyContent}>

                    {/* Certifications Horizontal Scroll */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Licenses & Certifications</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 5 }}>
                            {bouncer.certifications.map((cert, index) => (
                                <View key={index} style={styles.certPill}>
                                    <MaterialCommunityIcons name="license" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.certText}>{cert}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* About */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About Security Profile</Text>
                        <Text style={styles.bodyText}>
                            {bouncer.bio}
                        </Text>
                    </View>

                    {/* Skills Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tactical Skills</Text>
                        <View style={styles.skillsGrid}>
                            {bouncer.specialties.map((spec, index) => (
                                <View key={index} style={styles.skillItem}>
                                    <View style={styles.skillIconBox}>
                                        <Ionicons name="checkmark" size={14} color="#000" />
                                    </View>
                                    <Text style={styles.skillText}>{spec}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Photo Gallery */}
                    {bouncer.gallery && bouncer.gallery.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                                {bouncer.gallery.map((photoUrl, index) => (
                                    <Image
                                        key={index}
                                        source={{ uri: photoUrl }}
                                        style={styles.galleryImage}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Services / Plans */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hiring Packages</Text>

                        {/* Event Guard */}
                        <View style={styles.planCard}>
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>Single Event Shift</Text>
                                <Text style={styles.planPrice}>₹{currentPrice}</Text>
                            </View>
                            <Text style={styles.planSub}>Up to 6 hours active duty.</Text>
                            <View style={styles.divider} />
                            <View style={styles.planFeature}><Text style={styles.planFeatureText}>• Crowd Control</Text></View>
                            <View style={styles.planFeature}><Text style={styles.planFeatureText}>• Entry Screening</Text></View>
                        </View>

                        {/* VIP Protection */}
                        <View style={[styles.planCard, styles.goldPlan]}>
                            <View style={styles.planHeader}>
                                <Text style={[styles.planName, { color: '#000' }]}>VIP Bodyguard</Text>
                                <Text style={[styles.planPrice, { color: '#000' }]}>₹{currentPrice * 2}</Text>
                            </View>
                            <Text style={[styles.planSub, { color: '#333' }]}>Full day personal protection.</Text>
                            <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
                            <View style={styles.planFeature}><Text style={[styles.planFeatureText, { color: '#000' }]}>• Close Protection</Text></View>
                            <View style={styles.planFeature}><Text style={[styles.planFeatureText, { color: '#000' }]}>• Threat Assessment</Text></View>
                            <View style={styles.planFeature}><Text style={[styles.planFeatureText, { color: '#000' }]}>• Armed Response (if licensed)</Text></View>
                        </View>
                    </View>

                    {/* Client Reviews */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Client Feedback</Text>
                        {bouncer.reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                                    <View>
                                        <Text style={styles.reviewUser}>{review.user}</Text>
                                        <Text style={styles.reviewTime}>{review.time}</Text>
                                    </View>
                                    <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
                                        <Ionicons name="star" size={14} color="#FFD700" />
                                        <Text style={{ color: '#FFD700', marginLeft: 4, fontWeight: 'bold' }}>{review.rating}.0</Text>
                                    </View>
                                </View>
                                <Text style={styles.reviewText}>{review.text}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.priceLabel}>Starting from</Text>
                    <Text style={styles.priceValue}>₹{currentPrice}<Text style={{ fontSize: 14, color: '#888', fontWeight: '400' }}>/shift</Text></Text>
                </View>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('BookingFlow', { bouncerId: bouncer.id, price: currentPrice })}
                >
                    <Text style={styles.bookBtnText}>HIRE SECURITY</Text>
                    <Ionicons name="shield-checkmark" size={20} color="#000" style={{ marginLeft: 8 }} />
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
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0F0F0F',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
    },
    backButton: {
        marginLeft: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    // Header
    headerImageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 30,
    },
    headerImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,15,15,0.7)',
        // gradient effect could be added here
    },
    profileInfoCentered: {
        alignItems: 'center',
        zIndex: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4ade80',
        borderWidth: 3,
        borderColor: '#0F0F0F',
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    specBadge: {
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 12,
    },
    specText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 13,
        color: '#ccc',
        marginLeft: 6,
        fontWeight: '500',
    },
    // Body
    bodyContent: {
        paddingHorizontal: 20,
        transform: [{ translateY: -20 }],
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
        paddingLeft: 10,
    },
    // Certs
    certPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    certText: {
        color: '#eee',
        fontSize: 13,
        fontWeight: '500',
    },
    // Body Text
    bodyText: {
        fontSize: 15,
        color: '#aaa',
        lineHeight: 24,
    },
    // Skills
    skillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        marginBottom: 12,
        width: '45%',
    },
    skillIconBox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    skillText: {
        color: '#ddd',
        fontSize: 14,
    },
    // Gallery
    galleryScroll: {
        paddingVertical: 5,
    },
    galleryImage: {
        width: 140,
        height: 140,
        borderRadius: 16,
        marginRight: 15,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#333',
    },
    // Plans
    planCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    goldPlan: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    planName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    planPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    planSub: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginBottom: 12,
    },
    planFeature: {
        marginBottom: 6,
    },
    planFeatureText: {
        color: '#ccc',
        fontSize: 14,
    },
    // Reviews
    reviewCard: {
        padding: 16,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    reviewUser: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    reviewTime: {
        fontSize: 11,
        color: '#666',
    },
    reviewText: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 24 : 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    bookButton: {
        flexDirection: 'row',
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '800',
    },
});
