import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
    bgPrimary: '#090909',
    bgSecondary: '#121212',
    card: '#1A1A1A',
    cardBorder: 'rgba(255, 215, 0, 0.12)',
    gold: '#FFD700',
    goldDark: '#FFC107',
    goldDim: 'rgba(255, 215, 0, 0.15)',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#666666',
    border: 'rgba(255, 255, 255, 0.08)',
};

const CONTACT = {
    phone: '+91 XXXXXXXXXX',
    email: 'support@shieldhire.in',
    businessEmail: 'business@shieldhire.in',
    address: '14th Floor, Tower B, DLF Cyber City,\nGurugram, Haryana - 122002, India',
    website: 'https://shieldhire.in',
    whatsapp: '+91 XXXXXXXXXX',
    instagram: 'https://instagram.com/shieldhire',
    facebook: 'https://facebook.com/shieldhire',
    linkedin: 'https://linkedin.com/company/shieldhire',
    twitter: 'https://twitter.com/shieldhire',
    youtube: 'https://youtube.com/@shieldhire',
};

const HOURS = [
    { day: 'Monday - Friday', time: '9:00 AM - 8:00 PM', active: true },
    { day: 'Saturday', time: '10:00 AM - 6:00 PM', active: true },
    { day: 'Sunday', time: 'Emergency Only', active: false },
];

const APP_VERSION = '1.0.0';
const COMPANY_NAME = 'ShieldHire Technologies Pvt. Ltd.';

// ─── Animated Card ────────────────────────────────────────────────────────────

const AnimatedCard = React.memo(({
    children,
    delay = 0,
    style,
}: {
    children: React.ReactNode;
    delay?: number;
    style?: any;
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 500, delay, useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0, duration: 500, delay, useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
});

// ─── Info Row ─────────────────────────────────────────────────────────────────

const PressableRow = React.memo(({
    iconName,
    label,
    value,
    sub,
    onPress,
}: {
    iconName: string;
    label: string;
    value: string;
    sub?: string;
    onPress?: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
    const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
            accessibilityLabel={`${label}: ${value}`}
        >
            <Animated.View style={[styles.infoRow, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.iconCircle}>
                    <Ionicons name={iconName} size={20} color={THEME.gold} />
                </View>
                <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                    {sub ? <Text style={styles.infoSub}>{sub}</Text> : null}
                </View>
                {onPress ? <Ionicons name="chevron-forward" size={16} color={THEME.textMuted} /> : null}
            </Animated.View>
        </TouchableOpacity>
    );
});

// ─── CTA Button ───────────────────────────────────────────────────────────────

const CTAButton = React.memo(({
    icon,
    label,
    colors,
    onPress,
    style,
}: {
    icon: string;
    label: string;
    colors: string[];
    onPress: () => void;
    style?: any;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start();
    const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
            style={style}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <LinearGradient
                    colors={colors as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaBtn}
                >
                    <Ionicons name={icon} size={18} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.ctaBtnText}>{label}</Text>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
});

// ─── Social Icon ──────────────────────────────────────────────────────────────

const SocialIcon = React.memo(({
    icon,
    color,
    onPress,
    label,
}: {
    icon: string;
    color: string;
    onPress: () => void;
    label: string;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 40 }).start();
    const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    return (
        <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1} accessibilityLabel={label}>
            <Animated.View style={[styles.socialCircle, { borderColor: color + '44', transform: [{ scale: scaleAnim }] }]}>
                <Ionicons name={icon} size={22} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ContactUsScreen() {
    const navigation = useNavigation<any>();
    const headerFade = useRef(new Animated.Value(0)).current;
    const heroScale = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.spring(heroScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        ]).start();
    }, []);

    const openPhone = useCallback(() => Linking.openURL(`tel:${CONTACT.phone.replace(/\s/g, '')}`), []);
    const openEmail = useCallback((addr: string) => Linking.openURL(`mailto:${addr}`), []);
    const openMaps = useCallback(() => {
        const q = encodeURIComponent(CONTACT.address.replace(/\n/g, ', '));
        Linking.openURL(Platform.OS === 'ios' ? `maps:?q=${q}` : `geo:0,0?q=${q}`);
    }, []);
    const openWhatsApp = useCallback(() => Linking.openURL(`https://wa.me/${CONTACT.whatsapp.replace('+', '')}`), []);
    const openWebsite = useCallback(() => Linking.openURL(CONTACT.website), []);
    const openLink = useCallback((url: string) => Linking.openURL(url), []);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bgPrimary} />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={22} color={THEME.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Us</Text>
                <View style={styles.backBtn} />
            </Animated.View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero */}
                <AnimatedCard delay={0}>
                    <Animated.View style={[styles.heroCard, { transform: [{ scale: heroScale }] }]}>
                        <LinearGradient
                            colors={['rgba(255,215,0,0.10)', 'rgba(255,193,7,0.04)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.heroIconWrap}>
                            <LinearGradient
                                colors={[THEME.gold, THEME.goldDark]}
                                style={styles.heroIconGrad}
                            >
                                <Ionicons name="shield-checkmark" size={48} color="#000" />
                            </LinearGradient>
                            <View style={styles.pulseRing1} />
                            <View style={styles.pulseRing2} />
                        </View>
                        <Text style={styles.heroTitle}>Contact Us</Text>
                        <Text style={styles.heroSubtitle}>
                            {"We'd love to hear from you. Reach out anytime\nand our team will be happy to assist you."}
                        </Text>
                        <View style={styles.badgeRow}>
                            {['24x7 Support', 'Quick Response', 'Verified Experts'].map((b) => (
                                <View key={b} style={styles.badge}>
                                    <Text style={styles.badgeText}>{b}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                </AnimatedCard>

                {/* Contact Info */}
                <AnimatedCard delay={80}>
                    <View style={styles.card}>
                        <SectionHeader icon="call" title="Contact Information" />
                        <PressableRow iconName="call-outline" label="Phone" value={CONTACT.phone} sub="Tap to call" onPress={openPhone} />
                        <View style={styles.divider} />
                        <PressableRow iconName="mail-outline" label="Support Email" value={CONTACT.email} sub="Tap to open mail app" onPress={() => openEmail(CONTACT.email)} />
                        <View style={styles.divider} />
                        <PressableRow iconName="briefcase-outline" label="Business Email" value={CONTACT.businessEmail} sub="Tap to open mail app" onPress={() => openEmail(CONTACT.businessEmail)} />
                        <View style={styles.divider} />
                        <PressableRow iconName="location-outline" label="Office Address" value={CONTACT.address} sub="Tap to open Maps" onPress={openMaps} />
                    </View>
                </AnimatedCard>

                {/* Working Hours */}
                <AnimatedCard delay={160}>
                    <View style={styles.card}>
                        <SectionHeader icon="time" title="Working Hours" />
                        {HOURS.map((h, i) => (
                            <View key={i}>
                                <View style={styles.hourRow}>
                                    <View style={styles.hourLeft}>
                                        <View style={[styles.hourDot, !h.active && styles.hourDotOff]} />
                                        <Text style={styles.hourDay}>{h.day}</Text>
                                    </View>
                                    <Text style={[styles.hourTime, !h.active && styles.hourTimeOff]}>{h.time}</Text>
                                </View>
                                {i < HOURS.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                        <LinearGradient
                            colors={['rgba(255,215,0,0.10)', 'rgba(255,215,0,0.03)']}
                            style={styles.emergencyBanner}
                        >
                            <Ionicons name="flash" size={16} color={THEME.gold} />
                            <Text style={styles.emergencyText}>24x7 Emergency Security Support Available</Text>
                        </LinearGradient>
                    </View>
                </AnimatedCard>

                {/* Quick Contact */}
                <AnimatedCard delay={240}>
                    <View style={styles.card}>
                        <SectionHeader icon="flash" title="Quick Contact" />
                        <View style={styles.ctaGrid}>
                            <CTAButton
                                icon="call"
                                label="Call Us"
                                colors={[THEME.gold, THEME.goldDark]}
                                onPress={openPhone}
                                style={styles.ctaFull}
                            />
                            <View style={styles.ctaRow}>
                                <CTAButton
                                    icon="mail"
                                    label="Email Support"
                                    colors={['#2a2a2a', '#1a1a1a']}
                                    onPress={() => openEmail(CONTACT.email)}
                                    style={styles.ctaHalf}
                                />
                                <CTAButton
                                    icon="logo-whatsapp"
                                    label="WhatsApp"
                                    colors={['#075e54', '#128c7e']}
                                    onPress={openWhatsApp}
                                    style={styles.ctaHalf}
                                />
                            </View>
                            <CTAButton
                                icon="globe-outline"
                                label="Visit Website"
                                colors={['#1e1e1e', '#2a2a2a']}
                                onPress={openWebsite}
                                style={styles.ctaFull}
                            />
                        </View>
                    </View>
                </AnimatedCard>

                {/* Customer Support Stats */}
                <AnimatedCard delay={300}>
                    <View style={styles.card}>
                        <SectionHeader icon="headset" title="Customer Support" />
                        <View style={styles.supportGrid}>
                            {[
                                { icon: 'flash-outline', label: '24x7 Support', desc: 'Emergency security response' },
                                { icon: 'time-outline', label: 'Avg. Response', desc: '< 2 hours reply time' },
                                { icon: 'shield-checkmark-outline', label: 'Verified Team', desc: 'Background-checked agents' },
                                { icon: 'star-outline', label: 'Rated 4.9', desc: 'Trusted by 10,000+ clients' },
                            ].map((item, i) => (
                                <View key={i} style={styles.supportCard}>
                                    <Ionicons name={item.icon as any} size={22} color={THEME.gold} />
                                    <Text style={styles.supportCardLabel}>{item.label}</Text>
                                    <Text style={styles.supportCardDesc}>{item.desc}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </AnimatedCard>

                {/* Social Media */}
                <AnimatedCard delay={380}>
                    <View style={styles.card}>
                        <SectionHeader icon="share-social" title="Follow Us" />
                        <View style={styles.socialRow}>
                            <SocialIcon icon="logo-instagram" color="#E1306C" onPress={() => openLink(CONTACT.instagram)} label="Instagram" />
                            <SocialIcon icon="logo-facebook" color="#1877F2" onPress={() => openLink(CONTACT.facebook)} label="Facebook" />
                            <SocialIcon icon="logo-linkedin" color="#0A66C2" onPress={() => openLink(CONTACT.linkedin)} label="LinkedIn" />
                            <SocialIcon icon="logo-twitter" color="#1DA1F2" onPress={() => openLink(CONTACT.twitter)} label="X / Twitter" />
                            <SocialIcon icon="logo-youtube" color="#FF0000" onPress={() => openLink(CONTACT.youtube)} label="YouTube" />
                        </View>
                    </View>
                </AnimatedCard>

                {/* Company Info */}
                <AnimatedCard delay={460}>
                    <View style={[styles.card, styles.infoCard]}>
                        <LinearGradient colors={['rgba(255,215,0,0.06)', 'transparent']} style={StyleSheet.absoluteFill} />
                        <Text style={styles.companyName}>{COMPANY_NAME}</Text>
                        <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
                        <View style={styles.legalRow}>
                            <TouchableOpacity onPress={() => openLink(CONTACT.website + '/terms')}>
                                <Text style={styles.legalLink}>Terms of Service</Text>
                            </TouchableOpacity>
                            <View style={styles.legalDot} />
                            <TouchableOpacity onPress={() => openLink(CONTACT.website + '/privacy')}>
                                <Text style={styles.legalLink}>Privacy Policy</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.copyright}>
                            {'\u00A9'} {new Date().getFullYear()} ShieldHire. All rights reserved.
                        </Text>
                    </View>
                </AnimatedCard>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Section Header Helper ────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <View style={styles.cardHeader}>
            <LinearGradient colors={['#FFD700', '#FFC107']} style={styles.cardIconBadge}>
                <Ionicons name={icon as any} size={14} color="#000" />
            </LinearGradient>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bgPrimary },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: THEME.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: THEME.card,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: THEME.border,
    },
    headerTitle: {
        fontSize: 17, fontWeight: '700', color: THEME.textPrimary, letterSpacing: 0.3,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

    // Hero
    heroCard: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 20,
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: THEME.card,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.14)',
        overflow: 'hidden',
    },
    heroIconWrap: {
        width: 110, height: 110,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
    },
    heroIconGrad: {
        width: 90, height: 90, borderRadius: 45,
        alignItems: 'center', justifyContent: 'center',
        elevation: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    pulseRing1: {
        position: 'absolute',
        width: 102, height: 102, borderRadius: 51,
        borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.25)',
    },
    pulseRing2: {
        position: 'absolute',
        width: 118, height: 118, borderRadius: 59,
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)',
    },
    heroTitle: {
        fontSize: 26, fontWeight: '800',
        color: THEME.textPrimary, letterSpacing: 0.4, marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 14, color: THEME.textSecondary,
        textAlign: 'center', lineHeight: 22, marginBottom: 20,
    },
    badgeRow: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'center', gap: 8,
    },
    badge: {
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.15)',
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    },
    badgeText: {
        fontSize: 11, color: THEME.gold,
        fontWeight: '600', letterSpacing: 0.2,
    },

    // Card
    card: {
        backgroundColor: THEME.card,
        borderRadius: 20, padding: 20,
        marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.12)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 18,
    },
    cardIconBadge: {
        width: 28, height: 28, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    cardTitle: {
        fontSize: 16, fontWeight: '700',
        color: THEME.textPrimary, letterSpacing: 0.2,
    },

    // Info Row
    infoRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    },
    iconCircle: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: 'rgba(255,215,0,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
    },
    infoText: { flex: 1 },
    infoLabel: {
        fontSize: 10, color: THEME.textMuted,
        fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: 0.9, marginBottom: 3,
    },
    infoValue: {
        fontSize: 14, color: THEME.textPrimary,
        fontWeight: '600', lineHeight: 20,
    },
    infoSub: {
        fontSize: 11, color: THEME.gold, marginTop: 2, fontWeight: '500',
    },
    divider: {
        height: 1, backgroundColor: THEME.border, marginLeft: 56,
    },

    // Hours
    hourRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 13,
    },
    hourLeft: { flexDirection: 'row', alignItems: 'center' },
    hourDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: THEME.gold, marginRight: 12,
    },
    hourDotOff: { backgroundColor: THEME.textMuted },
    hourDay: { fontSize: 14, color: THEME.textPrimary, fontWeight: '500' },
    hourTime: { fontSize: 13, color: THEME.gold, fontWeight: '600' },
    hourTimeOff: { color: THEME.textMuted },
    emergencyBanner: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 14, paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
        gap: 8,
    },
    emergencyText: {
        fontSize: 12, color: THEME.gold, fontWeight: '600', flex: 1,
    },

    // CTA
    ctaGrid: { gap: 10 },
    ctaRow: { flexDirection: 'row', gap: 10 },
    ctaFull: { width: '100%' },
    ctaHalf: { flex: 1 },
    ctaBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14,
        elevation: 4,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 8,
    },
    ctaBtnText: {
        fontSize: 14, fontWeight: '700', color: '#000', letterSpacing: 0.3,
    },

    // Support Grid
    supportGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    supportCard: {
        width: (SCREEN_WIDTH - 32 - 40 - 10) / 2,
        backgroundColor: THEME.bgSecondary,
        borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: THEME.border, gap: 6,
    },
    supportCardLabel: {
        fontSize: 13, fontWeight: '700', color: THEME.textPrimary,
    },
    supportCardDesc: {
        fontSize: 11, color: THEME.textSecondary, lineHeight: 16,
    },

    // Social
    socialRow: {
        flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8,
    },
    socialCircle: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: THEME.bgSecondary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },

    // Info footer card
    infoCard: { alignItems: 'center', paddingVertical: 28 },
    companyName: {
        fontSize: 14, fontWeight: '700',
        color: THEME.textPrimary, textAlign: 'center', marginBottom: 4,
    },
    appVersion: {
        fontSize: 12, color: THEME.textMuted, marginBottom: 16,
    },
    legalRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10,
    },
    legalLink: {
        fontSize: 13, color: THEME.gold,
        fontWeight: '600', textDecorationLine: 'underline',
    },
    legalDot: {
        width: 4, height: 4, borderRadius: 2, backgroundColor: THEME.textMuted,
    },
    copyright: {
        fontSize: 11, color: THEME.textMuted, textAlign: 'center',
    },
});
