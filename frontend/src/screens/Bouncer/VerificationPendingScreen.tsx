import React, { useEffect, useState, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';

type VerificationPendingNavigationProp = StackNavigationProp<
    RootStackParamList,
    'VerificationPending'
>;
type VerificationPendingRouteProp = RouteProp<
    RootStackParamList,
    'VerificationPending'
>;

type Props = {
    navigation: VerificationPendingNavigationProp;
    route: VerificationPendingRouteProp;
};

export default function VerificationPendingScreen({ navigation, route }: Props) {
    const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const { userId } = route.params || {};
    const { logout, updateUser } = useContext(AuthContext);

    // Animation
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    const checkVerificationStatus = async () => {
        try {
            const response = await api.get(`/api/bouncer-status/status/${userId}`);
            const { verificationStatus, rejectionReason: reason } = response.data;

            setStatus(verificationStatus);
            setRejectionReason(reason);
            setLoading(false);

            // If approved, update the AuthContext so App.tsx re-renders the navigation stack
            if (verificationStatus === 'APPROVED') {
                setTimeout(async () => {
                    try {
                        const meRes = await api.get('/auth/me');
                        if (meRes.data && meRes.data.user && updateUser) {
                            updateUser(meRes.data.user);
                        }
                    } catch (e) {
                        console.error('Failed to update user profile:', e);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error checking status:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Start rotation animation
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Start pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1.2,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        let interval: any = null;

        if (userId && status === 'PENDING') {
            checkVerificationStatus();

            // Poll every 10 seconds
            interval = setInterval(checkVerificationStatus, 10000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [userId, status, updateUser]);

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.contentContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Checking verification status...</Text>
                </View>
            );
        }

        if (status === 'PENDING') {
            const spin = spinValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
            });

            return (
                <View style={styles.contentContainer}>
                    {/* Animated Loading Circles */}
                    <View style={styles.animationContainer}>
                        <Animated.View
                            style={[
                                styles.outerCircle,
                                {
                                    transform: [{ rotate: spin }],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.innerCircle,
                                {
                                    transform: [{ scale: scaleValue }],
                                },
                            ]}
                        />
                    </View>

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="clock-outline" size={80} color="#FFD700" />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Verification Pending</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        Your profile is currently under review by our admin team.
                    </Text>
                    <Text style={styles.submessage}>
                        This usually takes 24-48 hours. You'll be notified once verified.
                    </Text>

                    {/* Status Box */}
                    <View style={styles.statusBox}>
                        <View style={styles.statusRow}>
                            <MaterialCommunityIcons name="file-document-outline" size={24} color="#FFD700" />
                            <Text style={styles.statusText}>Documents Submitted</Text>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.statusRow}>
                            <MaterialCommunityIcons name="shield-search" size={24} color="#FFD700" />
                            <Text style={styles.statusText}>Under Admin Review</Text>
                            <View style={styles.pendingDot} />
                        </View>
                        <View style={[styles.statusRow, { opacity: 0.5 }]}>
                            <MaterialCommunityIcons name="check-decagram" size={24} color="#888" />
                            <Text style={styles.statusText}>Approval</Text>
                            <MaterialCommunityIcons name="clock-outline" size={24} color="#888" />
                        </View>
                    </View>

                    {/* Refresh Button */}
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={checkVerificationStatus}
                    >
                        <MaterialCommunityIcons name="refresh" size={20} color="#000" />
                        <Text style={styles.refreshButtonText}>Check Status</Text>
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            logout();
                        }}
                    >
                        <Text style={styles.backButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (status === 'APPROVED') {
            return (
                <View style={styles.contentContainer}>
                    <View style={styles.successIconContainer}>
                        <MaterialCommunityIcons name="check-circle" size={100} color="#4CAF50" />
                    </View>

                    <Text style={styles.successTitle}>Verification Approved! 🎉</Text>
                    <Text style={styles.successMessage}>
                        Congratulations! Your profile has been verified.
                    </Text>
                    <Text style={styles.submessage}>
                        You can now proceed to your dashboard and start accepting bookings.
                    </Text>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => {
                            // Re-check status instead of explicitly navigating,
                            // which safely triggers the AuthContext update
                            checkVerificationStatus();
                        }}
                    >
                        <Text style={styles.loginButtonText}>Proceed to Dashboard</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            );
        }

        if (status === 'REJECTED') {
            return (
                <View style={styles.contentContainer}>
                    <View style={styles.errorIconContainer}>
                        <MaterialCommunityIcons name="close-circle" size={100} color="#F44336" />
                    </View>

                    <Text style={styles.errorTitle}>Verification Rejected</Text>
                    <Text style={styles.errorMessage}>
                        Unfortunately, your verification request was not approved.
                    </Text>

                    {rejectionReason && (
                        <View style={styles.reasonBox}>
                            <Text style={styles.reasonLabel}>Reason:</Text>
                            <Text style={styles.reasonText}>{rejectionReason}</Text>
                        </View>
                    )}

                    <Text style={styles.submessage}>
                        Please contact support or re-register with corrected documents.
                    </Text>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            logout();
                        }}
                    >
                        <Text style={styles.backButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    animationContainer: {
        width: 200,
        height: 200,
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerCircle: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 8,
        borderColor: '#FFD700',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
    },
    innerCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderWidth: 6,
        borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    iconContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 24,
    },
    submessage: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    statusBox: {
        width: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#333',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusText: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
        marginLeft: 15,
        fontWeight: '600',
    },
    pendingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFD700',
        opacity: 0.8,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    refreshButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    backButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
    },
    backButtonText: {
        color: '#888',
        fontSize: 15,
        textDecorationLine: 'underline',
    },
    loadingText: {
        color: '#ccc',
        fontSize: 16,
        marginTop: 20,
    },
    // Success styles
    successIconContainer: {
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 15,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 24,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 12,
        marginTop: 20,
    },
    loginButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    // Error styles
    errorIconContainer: {
        marginBottom: 30,
    },
    errorTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F44336',
        marginBottom: 15,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    reasonBox: {
        width: '100%',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    reasonLabel: {
        fontSize: 14,
        color: '#F44336',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    reasonText: {
        fontSize: 15,
        color: '#fff',
        lineHeight: 22,
    },
});
