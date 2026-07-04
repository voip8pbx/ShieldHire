import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, 
    StatusBar, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { AuthContext } from '../context/AuthContext';
import api, { setAuthToken } from '../services/api';
import { signInWithGoogle } from '../services/authService';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '../config/supabase';

// Premium Components
import PremiumBackground from '../components/login/PremiumBackground';
import LoginHeader from '../components/login/LoginHeader';
import RoleSwitcher from '../components/login/RoleSwitcher';
import AuthenticationCard from '../components/login/AuthenticationCard';
import GoogleLoginButton from '../components/login/GoogleLoginButton';
import InputField from '../components/login/InputField';
import BenefitsCard from '../components/login/BenefitsCard';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

type Props = {
    navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginMode, setLoginMode] = useState<'client' | 'bouncer'>('client');
    const { login, suppressAutoLogin, resumeAutoLogin, startBouncerRegistration } = useContext(AuthContext);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const formFadeAnim = useRef(new Animated.Value(1)).current;

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

    // Form transition on mode change
    useEffect(() => {
        formFadeAnim.setValue(0);
        Animated.timing(formFadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [loginMode]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);


    // ==========================================
    // EXISTING LOGIC (PRESERVED 100%)
    // ==========================================

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error || !data.user || !data.session) {
                throw error || new Error('Login failed');
            }

            const token = data.session.access_token;
            setAuthToken(token);

            const response = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
            const userData = response.data.user;

            login(token, userData);
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.error || error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleBypass = () => {
        login('guest_token', {
            id: 'guest_123',
            email: 'client@company.com',
            name: 'Guest Client',
            role: 'USER'
        });
    };

    const handleBouncerRegistration = async () => {
        setLoading(true);
        suppressAutoLogin();

        try {
            const { firebaseUser, firebaseToken } = await signInWithGoogle(true);
            setAuthToken(firebaseToken);

            const meResponse = await api.get('/auth/me');
            const existingUser = meResponse.data.user;

            if (!existingUser.bouncerProfile && existingUser.role === 'USER') {
                startBouncerRegistration(firebaseToken, existingUser, {
                    name: firebaseUser.displayName || existingUser.name || '',
                    email: firebaseUser.email || '',
                    photo: firebaseUser.photoURL || '',
                });
                return;
            }

            login(firebaseToken, existingUser);
        } catch (error: any) {
            resumeAutoLogin();
            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
                return; 
            }
            console.error('Bouncer Google Auth Error:', error);
            Alert.alert('Google Sign-In Failed', error.response?.data?.error || error.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    const handleClientGoogleLogin = async () => {
        setLoading(true);
        try {
            const { firebaseUser, firebaseToken } = await signInWithGoogle(true);
            setAuthToken(firebaseToken);

            const response = await api.post('/auth/google', {
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                googleId: firebaseUser.uid,
            });

            login(firebaseToken, response.data.user);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
                return; 
            }
            Alert.alert('Google Sign-In Failed', error.response?.data?.error || error.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // UI RENDER
    // ==========================================

    return (
        <PremiumBackground>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.fixedContent}>
                    <Animated.View style={{ flex: 1, justifyContent: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        
                        <LoginHeader mode={loginMode} />

                        <View style={styles.formContainer}>
                            <RoleSwitcher mode={loginMode} onModeChange={setLoginMode} />

                            <AuthenticationCard>
                                <Animated.View style={{ opacity: formFadeAnim }}>
                                    {loginMode === 'client' ? (
                                        <>
                                            <GoogleLoginButton onPress={handleClientGoogleLogin} />
                                            
                                            <View style={styles.dividerContainer}>
                                                <View style={styles.dividerLine} />
                                                <Text style={styles.dividerText}>OR CONTINUE WITH EMAIL</Text>
                                                <View style={styles.dividerLine} />
                                            </View>

                                            <InputField 
                                                iconName="email-outline"
                                                label="Email Address"
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                            />
                                            
                                            <InputField 
                                                iconName="lock-outline"
                                                label="Password"
                                                value={password}
                                                onChangeText={setPassword}
                                                isPassword
                                            />

                                            <TouchableOpacity 
                                                style={styles.primaryButton} 
                                                onPress={handleLogin} 
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="#000" />
                                                ) : (
                                                    <Text style={styles.primaryButtonText}>LOGIN SECURELY</Text>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.footerLinkContainer}>
                                                <Text style={styles.linkText}>
                                                    New to ShieldHire? <Text style={styles.linkTextBold}>Create an account</Text>
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={handleBypass} style={styles.guestLinkContainer}>
                                                <Text style={styles.guestText}>Continue as Guest</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <GoogleLoginButton onPress={handleBouncerRegistration} />
                                            
                                            <BenefitsCard />
                                            
                                            <TouchableOpacity onPress={() => setLoginMode('client')} style={[styles.footerLinkContainer, { marginTop: 25 }]}>
                                                <Text style={styles.linkText}>
                                                    Looking to hire security? <Text style={styles.linkTextBold}>Switch to Client</Text>
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </Animated.View>
                            </AuthenticationCard>
                        </View>

                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </PremiumBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fixedContent: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 5,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: '#666',
        paddingHorizontal: 10,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    primaryButton: {
        backgroundColor: '#FFD700',
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    footerLinkContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    linkText: {
        color: '#888',
        fontSize: 13,
    },
    linkTextBold: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    guestLinkContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    guestText: {
        color: '#555',
        fontSize: 13,
        textDecorationLine: 'underline',
    }
});
