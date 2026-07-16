import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, ActivityIndicator, Alert, Dimensions, TouchableWithoutFeedback, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { AuthContext } from '../context/AuthContext';
import { signInWithGoogle } from '../services/authService';
import api, { setAuthToken } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

export default function GuestAuthSheet() {
    const { guestSheetVisible, hideGuestSheet, login, consumePendingRoute, suppressAutoLogin, resumeAutoLogin } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const translateY = useRef(new Animated.Value(height)).current;
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (guestSheetVisible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 0,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [guestSheetVisible]);

    const handleGoogleAuth = async () => {
        setLoading(true);
        suppressAutoLogin();
        try {
            const { firebaseUser, firebaseToken } = await signInWithGoogle(true);
            setAuthToken(firebaseToken);

            const response = await api.post('/auth/google', {
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                googleId: firebaseUser.uid,
            });

            const user = response.data.user;
            
            login(firebaseToken, user);
            hideGuestSheet();

            // Check if profile is complete
            if (user.name && user.contact) {
                // Profile complete: seamlessly navigate to the original requested screen
                consumePendingRoute(navigation);
            } else {
                // Profile incomplete: ask user to complete it
                navigation.navigate('Profile');
            }
        } catch (error: any) {
            resumeAutoLogin();
            if (error.code === '12501' || error.code?.includes('SIGN_IN_CANCELLED') || error.code?.includes('SIGN_IN_REQUIRED')) {
                // user cancelled
            } else {
                Alert.alert('Authentication Failed', error.response?.data?.error || error.message || 'Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            hideGuestSheet();
        }
    };

    return (
        <Modal transparent visible={guestSheetVisible} animationType="fade" onRequestClose={handleClose}>
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={24} color="#888" />
                            </TouchableOpacity>

                            <View style={styles.header}>
                                <View style={styles.logoBox}>
                                    <Image source={require('../../../SOS!.png')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
                                </View>
                                <Text style={styles.title}>Continue to SOS Guard</Text>
                                <Text style={styles.subtitle}>Sign in to continue using all client features.</Text>
                            </View>

                            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleAuth} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="google" size={24} color="#fff" />
                                        <Text style={styles.googleBtnText}>Continue with Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    header: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    logoBox: {
        width: 60,
        height: 60,
        backgroundColor: '#2A2A2A',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    googleBtn: {
        flexDirection: 'row',
        backgroundColor: '#4285F4',
        height: 56,
        width: '100%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    googleBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
    },
});
