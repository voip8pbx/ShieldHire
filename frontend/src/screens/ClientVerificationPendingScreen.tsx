import React, { useEffect, useState, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

type ClientVerificationPendingNavigationProp = StackNavigationProp<
    RootStackParamList,
    'ClientVerificationPending'
>;
type ClientVerificationPendingRouteProp = RouteProp<
    RootStackParamList,
    'ClientVerificationPending'
>;

type Props = {
    navigation: ClientVerificationPendingNavigationProp;
    route: ClientVerificationPendingRouteProp;
};

export default function ClientVerificationPendingScreen({ navigation, route }: Props) {
    const { logout, updateUser, user: contextUser } = useContext(AuthContext);
    const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>(
        contextUser?.clientProfile?.verificationStatus || 'PENDING'
    );
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState<string | null>(
        contextUser?.clientProfile?.rejectionReason || null
    );

    // Animation
    const spinValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    const checkVerificationStatus = async () => {
        try {
            console.log(`[ClientVerificationPending] Checking status...`);
            const meRes = await api.get('/auth/me');
            if (meRes.data && meRes.data.user) {
                const fetchedUser = meRes.data.user;
                if (updateUser) {
                    updateUser(fetchedUser);
                }
                const vStatus = fetchedUser.clientProfile?.verificationStatus || 'PENDING';
                const reason = fetchedUser.clientProfile?.rejectionReason || null;
                
                setStatus(vStatus);
                setRejectionReason(reason);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    useEffect(() => {
        // Start animations...
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

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

        // Check immediately on mount
        checkVerificationStatus();
    }, []); // only run on mount

    // Separate effect for polling — only active while status is PENDING
    useEffect(() => {
        if (status !== 'PENDING') return;

        const interval = setInterval(checkVerificationStatus, 5000);
        return () => clearInterval(interval);
    }, [status]);

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
                    {/* Animated Loading Circle with Clock inside */}
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
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="clock-outline" size={54} color="#FFD700" />
                        </View>
                    </View>

                    <Text style={styles.title}>Client Account Pending</Text>

                    <Text style={styles.message}>
                        Your client account is currently under review by our admin team.
                    </Text>
                    <Text style={styles.submessage}>
                        This usually takes a few hours. You'll be able to hire professionals once approved.
                    </Text>

                    <View style={styles.statusBox}>
                        <View style={styles.statusRow}>
                            <MaterialCommunityIcons name="account-check" size={20} color="#FFD700" style={{ marginRight: 12 }} />
                            <Text style={styles.statusText}>Account Created</Text>
                            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                        </View>
                        <View style={styles.statusRow}>
                            <MaterialCommunityIcons name="shield-search" size={20} color="#FFD700" style={{ marginRight: 12 }} />
                            <Text style={styles.statusText}>Under Admin Review</Text>
                            <View style={styles.pendingDot} />
                        </View>
                        <View style={[styles.statusRow, { opacity: 0.4, borderBottomWidth: 0 }]}>
                            <MaterialCommunityIcons name="check-decagram" size={20} color="#888" style={{ marginRight: 12 }} />
                            <Text style={styles.statusText}>Approval</Text>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#888" />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={checkVerificationStatus}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="refresh" size={18} color="#000" />
                        <Text style={styles.refreshButtonText}>Check Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            logout();
                        }}
                        activeOpacity={0.7}
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

                    <Text style={styles.successTitle}>Account Approved! 🎉</Text>
                    <Text style={styles.successMessage}>
                        Congratulations! Your client profile has been verified.
                    </Text>
                    <Text style={styles.submessage}>
                        You can now proceed to the dashboard to hire trusted security professionals.
                    </Text>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => {
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
                    <View style={styles.rejectedIconContainer}>
                        <MaterialCommunityIcons name="close-circle" size={100} color="#F44336" />
                    </View>

                    <Text style={styles.rejectedTitle}>Verification Rejected</Text>
                    <Text style={styles.rejectedMessage}>
                        Unfortunately, your client profile verification was not approved.
                    </Text>

                    {rejectionReason && (
                        <View style={styles.reasonBox}>
                            <Text style={styles.reasonLabel}>Reason:</Text>
                            <Text style={styles.reasonText}>{rejectionReason}</Text>
                        </View>
                    )}

                    <Text style={styles.submessage}>
                        Please contact support for more information or try logging in again later.
                    </Text>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={checkVerificationStatus}
                    >
                        <MaterialCommunityIcons name="refresh" size={20} color="#000" />
                        <Text style={styles.refreshButtonText}>Refresh Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.refreshButton, { backgroundColor: '#FFD700', marginTop: 12 }]}
                        onPress={() => navigation.navigate('ClientProfileSetup')}
                    >
                        <MaterialCommunityIcons name="account-edit" size={20} color="#000" />
                        <Text style={styles.refreshButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

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

    return <View style={styles.container}>{renderContent()}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#070708',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    animationContainer: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    outerCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 2,
        borderColor: '#FFD700',
        borderStyle: 'dashed',
    },
    innerCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
    },
    iconContainer: {
        position: 'absolute',
        zIndex: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 16,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
    },
    submessage: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 20,
    },
    statusBox: {
        width: '100%',
        backgroundColor: '#121214',
        borderRadius: 16,
        padding: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    },
    statusText: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        marginLeft: 12,
    },
    pendingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFD700',
    },
    refreshButton: {
        flexDirection: 'row',
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 16,
    },
    refreshButtonText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    backButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '600',
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 16,
        fontSize: 16,
    },
    successIconContainer: {
        marginBottom: 30,
        padding: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 100,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 16,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 18,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    loginButton: {
        flexDirection: 'row',
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: 20,
    },
    loginButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    rejectedIconContainer: {
        marginBottom: 30,
        padding: 20,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 100,
    },
    rejectedTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F44336',
        marginBottom: 16,
        textAlign: 'center',
    },
    rejectedMessage: {
        fontSize: 18,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    reasonBox: {
        width: '100%',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    reasonLabel: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    reasonText: {
        color: '#FFF',
        fontSize: 16,
    },
});
