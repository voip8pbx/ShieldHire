import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur';

type PaymentScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentScreen'>;
type PaymentScreenRouteProp = RouteProp<HomeStackParamList, 'PaymentScreen'>;

type Props = {
    navigation: PaymentScreenNavigationProp;
    route: PaymentScreenRouteProp;
};

const { width } = Dimensions.get('window');

// Premium Theme Constants
const THEME = {
    background: '#050505',
    card: '#121212',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
    gold: '#FFD700',
    goldLight: '#FFE34D',
    goldDark: '#CCAC00',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#666666',
    success: '#00C853',
    error: '#FF3B30',
};

export default function PaymentScreen({ navigation, route }: Props) {
    const {
        bouncerId,
        date,
        time,
        location,
        latitude,
        longitude,
        duration,
        totalPrice,
        package: bookingPackage,
        notes,
    } = route.params;

    // Fees Calculation
    const platformFee = 99;
    const gst = Math.round(totalPrice * 0.18);
    const convenienceFee = 29;
    const finalTotal = totalPrice + platformFee + gst + convenienceFee;

    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const copyBounce = useRef(new Animated.Value(1)).current;
    const successFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleCopyUPI = () => {
        // Visual bounce feedback
        Animated.sequence([
            Animated.timing(copyBounce, { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.timing(copyBounce, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();
        
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleConfirmBooking = async () => {
        if (!transactionId.trim() || transactionId.length < 6) {
            Alert.alert('Verification Required', 'Please enter a valid UPI Transaction ID to proceed.');
            return;
        }

        if (bouncerId === 'setup-only') {
            setShowSuccess(true);
            Animated.timing(successFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
            setTimeout(() => {
                navigation.goBack();
            }, 2500);
            return;
        }

        setLoading(true);
        try {
            // Re-using existing booking endpoint. We append the transaction ID to the notes.
            await api.post('/bookings', {
                bouncerId,
                date,
                time,
                location,
                latitude,
                longitude,
                duration,
                totalPrice,
                package: bookingPackage,
                notes: notes ? notes + `\nTxn ID: ${transactionId}` : `Txn ID: ${transactionId}`,
            });

            // Success Animation
            setShowSuccess(true);
            Animated.timing(successFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();

            setTimeout(() => {
                navigation.popToTop();
            }, 2500);

        } catch (error: any) {
            console.log('Payment Error:', error.response?.data || error.message);
            Alert.alert('Payment Error', error.response?.data?.error || 'Failed to verify payment and create booking.');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Complete Payment</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        
                        {/* Hero Header */}
                        <View style={styles.lottieContainer}>
                            <View style={styles.lottieCircle}>
                                <Ionicons name="shield-checkmark" size={48} color={THEME.gold} />
                            </View>
                            <Text style={styles.lottieSubtitle}>Secure your booking by completing the payment below.</Text>
                        </View>

                        {/* Booking Summary Card */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Booking Summary</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Booking Amount</Text>
                                <Text style={styles.summaryValue}>₹{totalPrice}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Platform Fee</Text>
                                <Text style={styles.summaryValue}>₹{platformFee}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>GST (18%)</Text>
                                <Text style={styles.summaryValue}>₹{gst}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Convenience Fee</Text>
                                <Text style={styles.summaryValue}>₹{convenienceFee}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Payable</Text>
                                <Text style={styles.totalValue}>₹{finalTotal}</Text>
                            </View>
                        </View>

                        {/* Payment Method Card */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Pay using UPI</Text>
                            <View style={styles.upiContainer}>
                                <Text style={styles.upiId}>8602254165@sbi</Text>
                                <Animated.View style={{ transform: [{ scale: copyBounce }] }}>
                                    <TouchableOpacity 
                                        style={[styles.copyButton, copied && styles.copyButtonSuccess]} 
                                        onPress={handleCopyUPI}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={16} color={copied ? THEME.success : THEME.gold} />
                                        <Text style={[styles.copyButtonText, copied && { color: THEME.success }]}>
                                            {copied ? 'Copied' : 'Copy UPI ID'}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>

                            <View style={styles.qrContainer}>
                                <View style={styles.qrBox}>
                                    <Ionicons name="qr-code-outline" size={60} color={THEME.textSecondary} />
                                    <Text style={styles.qrText}>Scan QR to Pay</Text>
                                </View>
                            </View>
                        </View>

                        {/* Payment Proof Section */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Payment Proof</Text>
                            <Text style={styles.proofSubtitle}>Enter your 12-digit UPI Transaction ID after payment.</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="bank-transfer" size={24} color={THEME.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 123456789ABCDE"
                                    placeholderTextColor={THEME.textMuted}
                                    value={transactionId}
                                    onChangeText={setTransactionId}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        {/* Verification Notice */}
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={24} color={THEME.gold} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Verification Process</Text>
                                <Text style={styles.infoDesc}>Your booking will be confirmed after our team verifies your payment. Verification usually takes only a few minutes.</Text>
                            </View>
                        </View>

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Confirm Button Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                    onPress={handleConfirmBooking}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Success Overlay */}
            {showSuccess && (
                <Animated.View style={[styles.successOverlay, { opacity: successFade }]}>
                    <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={10} />
                    <View style={styles.successContent}>
                        <Ionicons name="checkmark-circle" size={80} color={THEME.success} />
                        <Text style={styles.successTitle}>Payment Submitted!</Text>
                        <Text style={styles.successDesc}>Your booking request has been sent for verification.</Text>
                    </View>
                </Animated.View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: THEME.background,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.textPrimary,
        letterSpacing: 0.5,
    },
    placeholder: {
        width: 34,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    lottieContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    lottieCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    lottieSubtitle: {
        fontSize: 14,
        color: THEME.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: THEME.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginBottom: 16,
        letterSpacing: 0.3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: THEME.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        color: THEME.textPrimary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: THEME.cardBorder,
        marginVertical: 15,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.textPrimary,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.gold,
    },
    upiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    upiId: {
        fontSize: 16,
        color: THEME.textPrimary,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    copyButtonSuccess: {
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        borderColor: 'rgba(0, 200, 83, 0.3)',
    },
    copyButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: THEME.gold,
        marginLeft: 6,
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    qrBox: {
        width: 150,
        height: 150,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrText: {
        marginTop: 12,
        fontSize: 12,
        color: THEME.textSecondary,
        fontWeight: '500',
    },
    proofSubtitle: {
        fontSize: 13,
        color: THEME.textSecondary,
        marginBottom: 15,
        lineHeight: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        borderRadius: 12,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: THEME.textPrimary,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 1,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.15)',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.gold,
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 13,
        color: THEME.textSecondary,
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: THEME.card,
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
    },
    confirmButton: {
        backgroundColor: THEME.gold,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: THEME.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmButtonDisabled: {
        backgroundColor: THEME.textMuted,
        shadowOpacity: 0,
        elevation: 0,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 0.5,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    successContent: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: THEME.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 83, 0.3)',
        width: width * 0.85,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.textPrimary,
        marginTop: 20,
        marginBottom: 10,
    },
    successDesc: {
        fontSize: 14,
        color: THEME.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    }
});
