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
    Clipboard,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../types';
import api from '../services/api';
import { ENV } from '../config/env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToBlob } from '../services/uploadService';

type PaymentScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentScreen'>;
type PaymentScreenRouteProp = RouteProp<HomeStackParamList, 'PaymentScreen'>;

type Props = {
    navigation: PaymentScreenNavigationProp;
    route: PaymentScreenRouteProp;
};

const { width } = Dimensions.get('window');

// Premium Theme Constants
const THEME = {
    background: '#121214',
    card: '#1A1A1E',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    gold: '#FFD700',
    goldLight: '#FFE34D',
    goldDark: '#CCAC00',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: '#666666',
    success: '#34C759',
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
        bookingId,
    } = route.params;

    // Fees Calculation
    const platformFee = 99;
    const gst = Math.round(totalPrice * 0.18);
    const convenienceFee = 29;
    const finalTotal = totalPrice + platformFee + gst + convenienceFee;

    const [bouncer, setBouncer] = useState<any>(null);
    const [transactionId, setTransactionId] = useState('');
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handlePickImage = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 1200,
                maxWidth: 1200,
                quality: 0.8,
            },
            async (response) => {
                if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
                const asset = response.assets[0];
                if (!asset.uri || !asset.base64) return;

                setUploadingImage(true);
                try {
                    const dataUri = `data:${asset.type};base64,${asset.base64}`;
                    const uploadedUrl = await uploadImageToBlob(dataUri, `payment-${Date.now()}.jpg`, 'payments');
                    if (uploadedUrl) {
                        setPaymentProofUrl(uploadedUrl);
                    }
                } catch (e: any) {
                    Alert.alert('Upload Failed', 'Could not upload payment proof.');
                } finally {
                    setUploadingImage(false);
                }
            }
        );
    };

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

        const fetchBouncer = async () => {
            if (bouncerId && bouncerId !== 'setup-only') {
                try {
                    const response = await api.get(`/bouncers/${bouncerId}`);
                    setBouncer(response.data);
                } catch (error) {
                    console.error('Failed to fetch bouncer payment details:', error);
                }
            }
        };
        fetchBouncer();
    }, [bouncerId]);

    const bouncerUpiId = bouncer?.upiId || '';
    const hasUpi = !!bouncerUpiId;

    const handleCopyUPI = () => {
        if (!hasUpi) return;
        Animated.sequence([
            Animated.timing(copyBounce, { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.timing(copyBounce, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();
        try {
            Clipboard.setString(bouncerUpiId);
        } catch (e) {
            console.log('Clipboard copy failed:', e);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleConfirmBooking = async () => {
        if ((!transactionId.trim() || transactionId.length < 6) && !paymentProofUrl) {
            Alert.alert('Verification Required', 'Please enter a valid UPI Transaction ID or upload a screenshot to proceed.');
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
            if (bookingId) {
                // Submit payment details for an existing booking request
                await api.patch(`/bookings/${bookingId}/payment-details`, {
                    transactionId,
                    paymentProofUrl
                });
            } else {
                // Legacy direct creation
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
            }

            // Success Animation
            setShowSuccess(true);
            Animated.timing(successFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();

            setTimeout(() => {
                if (bookingId) {
                    // Navigate back to the Chat screen!
                    (navigation as any).navigate('Chat', { bookingId });
                } else {
                    navigation.popToTop();
                }
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
                            {hasUpi ? (
                                <View style={styles.upiContainer}>
                                    <Text style={styles.upiId}>{bouncerUpiId}</Text>
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
                            ) : (
                                <View style={styles.upiNotConfiguredBox}>
                                    <Ionicons name="alert-circle-outline" size={24} color={THEME.error} />
                                    <Text style={styles.upiNotConfiguredText}>
                                        UPI not configured. Contact the guard directly to arrange payment.
                                    </Text>
                                </View>
                            )}
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

                            <View style={styles.uploadContainer}>
                                <Text style={[styles.proofSubtitle, { marginTop: 15 }]}>Or upload a screenshot of your payment</Text>
                                {paymentProofUrl ? (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: paymentProofUrl }} style={styles.imagePreview} />
                                        <TouchableOpacity 
                                            style={styles.removeImageBtn} 
                                            onPress={() => setPaymentProofUrl(null)}
                                        >
                                            <Ionicons name="close-circle" size={28} color={THEME.error} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.uploadBtn} 
                                        onPress={handlePickImage}
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? (
                                            <ActivityIndicator size="small" color={THEME.gold} />
                                        ) : (
                                            <>
                                                <Ionicons name="cloud-upload-outline" size={24} color={THEME.gold} />
                                                <Text style={styles.uploadBtnText}>Upload Screenshot</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
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
    upiNotConfiguredBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    upiNotConfiguredText: {
        flex: 1,
        fontSize: 13,
        color: THEME.error,
        lineHeight: 18,
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
    uploadContainer: {
        marginTop: 5,
        alignItems: 'center',
        width: '100%',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
        borderWidth: 1,
        borderColor: THEME.gold,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        width: '100%',
        marginTop: 10,
    },
    uploadBtnText: {
        color: THEME.gold,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    imagePreviewContainer: {
        marginTop: 10,
        position: 'relative',
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        padding: 2,
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
