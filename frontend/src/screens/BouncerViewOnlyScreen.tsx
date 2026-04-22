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
    StatusBar,
    Alert,
    Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type BouncerViewOnlyScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'BouncerViewOnly'>;
type BouncerViewOnlyScreenRouteProp = RouteProp<HomeStackParamList, 'BouncerViewOnly'>;

type Props = {
    navigation: BouncerViewOnlyScreenNavigationProp;
    route: BouncerViewOnlyScreenRouteProp;
};

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

export default function BouncerViewOnlyScreen({ navigation, route }: Props) {
    const { bouncerId } = route.params;
    const [bouncer, setBouncer] = useState<BouncerDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Security Detail',
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
                let bouncerData: any = null;
                try {
                    const response = await api.get<any>(`/api/bouncers/${bouncerId}`);
                    const b = response.data;
                    bouncerData = {
                        ...b,
                        bio: b.bio || `Professional ${b.isGunman ? 'Armed Security Officer' : 'Bouncer'} with verification status: ${b.verificationStatus}. Dedicated to ensuring safety and order.`,
                        certifications: b.hasGunLicense ? ['Firearms License', 'Crowd Control', 'First Aid'] : ['Crowd Control', 'First Aid', 'Conflict Resolution']
                    };
                } catch (e) {
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

                const extended = MOCK_EXTENDED_DATA['default']!;
                setBouncer({
                    ...extended,
                    ...bouncerData,
                    gallery: (bouncerData.gallery && bouncerData.gallery.length > 0) ? bouncerData.gallery : extended.gallery,
                    specialties: (bouncerData.skills && bouncerData.skills.length > 0) ? bouncerData.skills : extended.specialties,
                    certifications: bouncerData.certifications || extended.certifications,
                } as BouncerDetails);
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

                <View style={styles.bodyContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Licenses & Certifications</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {bouncer.certifications.map((cert, index) => (
                                <View key={index} style={styles.certPill}>
                                    <MaterialCommunityIcons name="license" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                                    <Text style={styles.certText}>{cert}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About Security Professional</Text>
                        <Text style={styles.bodyText}>{bouncer.bio}</Text>
                    </View>

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

                    {bouncer.gallery && bouncer.gallery.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {bouncer.gallery.map((photoUrl, index) => (
                                    <Image key={index} source={{ uri: photoUrl }} style={styles.galleryImage} />
                                ))}
                            </ScrollView>
                        </View>
                    )}

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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0F0F0F' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' },
    backButton: { marginLeft: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
    scrollContent: { paddingBottom: 40 },
    headerImageContainer: { height: 320, width: '100%', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 },
    headerImage: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,15,15,0.7)' },
    profileInfoCentered: { alignItems: 'center', zIndex: 10 },
    avatarContainer: { marginBottom: 16 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FFD700' },
    name: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
    specBadge: { backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
    specText: { color: '#FFD700', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 13, color: '#ccc', marginLeft: 6 },
    bodyContent: { paddingHorizontal: 20, transform: [{ translateY: -20 }] },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#FFD700', paddingLeft: 10 },
    certPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#333' },
    certText: { color: '#eee', fontSize: 13 },
    bodyText: { fontSize: 15, color: '#aaa', lineHeight: 24 },
    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    skillItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 12, width: '45%' },
    skillIconBox: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    skillText: { color: '#ddd', fontSize: 14 },
    galleryImage: { width: 140, height: 140, borderRadius: 16, marginRight: 15, backgroundColor: '#1E1E1E' },
    reviewCard: { padding: 16, backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    reviewAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
    reviewUser: { fontSize: 14, fontWeight: '700', color: '#fff' },
    reviewTime: { fontSize: 11, color: '#666' },
    reviewText: { fontSize: 13, color: '#999', lineHeight: 18 },
});
