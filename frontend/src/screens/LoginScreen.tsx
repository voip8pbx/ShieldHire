import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { AuthContext } from '../context/AuthContext';
import api, { setAuthToken } from '../services/api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { signInWithGoogle, getAuth, getIdToken } from '../services/authService';
import { statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithEmailAndPassword } from '@react-native-firebase/auth/lib/modular';

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

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Sign in with Firebase email/password (modular API)
            const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
            const token = await getIdToken(userCredential.user);

            // Temporarily set token for the /auth/me request
            setAuthToken(token);

            // Step 2: Fetch populated profile from our backend
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

        // IMPORTANT: Suppress auto-login BEFORE calling signInWithGoogle.
        // Without this, onAuthStateChanged fires immediately after Firebase auth succeeds
        // and races with this function — it calls /auth/me, gets role=USER (no bouncer profile),
        // and sets the user in AuthContext, which causes App.tsx to render ClientMain
        // instead of letting this function navigate to BouncerRegistration.
        suppressAutoLogin();

        try {
            // true = force account picker so bouncer can choose their account
            const { firebaseUser, firebaseToken } = await signInWithGoogle(true);

            setAuthToken(firebaseToken);

            // Fetch/create user in our DB via Firebase token
            const meResponse = await api.get('/auth/me');
            const existingUser = meResponse.data.user;

            // If user has no bouncer profile, force them to registration
            if (!existingUser.bouncerProfile && existingUser.role === 'USER') {
                // Instead of calling navigate (which might fail if the navigator unmounts),
                // we update the AuthContext to indicate a bouncer registration is pending.
                // This will cause App.tsx to show the BouncerRegistration screen.
                startBouncerRegistration(firebaseToken, existingUser, {
                    name: firebaseUser.displayName || existingUser.name || '',
                    email: firebaseUser.email || '',
                    photo: firebaseUser.photoURL || '',
                });
                return;
            }

            // Otherwise, just log them in; App.tsx handles Approved vs Pending vs Rejected
            // login() automatically clears the suppress flag
            login(firebaseToken, existingUser);
        } catch (error: any) {
            // Re-enable auto-login on any error so future auth state changes are handled
            resumeAutoLogin();

            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
                return; // User cancelled
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
            // true = force account picker so client can choose their account
            const { firebaseUser, firebaseToken } = await signInWithGoogle(true);

            setAuthToken(firebaseToken);

            // Send user details to backend to create/fetch DB record
            const response = await api.post('/auth/google', {
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                googleId: firebaseUser.uid,
            });

            login(firebaseToken, response.data.user);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === '12501') {
                return; // User cancelled
            }
            Alert.alert('Google Sign-In Failed', error.response?.data?.error || error.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

            <View style={styles.logoContainer}>
                <View style={styles.logoBox}>
                    <MaterialCommunityIcons name="shield-lock" size={60} color="#FFD700" />
                </View>
                <Text style={styles.appName}>SHIELD<Text style={{ color: '#FFD700' }}>HIRE</Text></Text>
                <Text style={styles.tagline}>Premium Security Staffing</Text>
            </View>

            <View style={styles.formContainer}>
                {/* Login Mode Toggle */}
                <View style={styles.modeToggleContainer}>
                    <TouchableOpacity
                        style={[
                            styles.modeToggle,
                            loginMode === 'client' && styles.modeToggleActive,
                        ]}
                        onPress={() => setLoginMode('client')}
                    >
                        <MaterialCommunityIcons
                            name="account-tie"
                            size={20}
                            color={loginMode === 'client' ? '#000' : '#888'}
                        />
                        <Text style={[
                            styles.modeToggleText,
                            loginMode === 'client' && styles.modeToggleTextActive,
                        ]}>
                            Client
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modeToggle,
                            loginMode === 'bouncer' && styles.modeToggleActive,
                        ]}
                        onPress={() => setLoginMode('bouncer')}
                    >
                        <MaterialCommunityIcons
                            name="shield-account"
                            size={20}
                            color={loginMode === 'bouncer' ? '#000' : '#888'}
                        />
                        <Text style={[
                            styles.modeToggleText,
                            loginMode === 'bouncer' && styles.modeToggleTextActive,
                        ]}>
                            Bouncer
                        </Text>
                    </TouchableOpacity>
                </View>

                {loginMode === 'client' ? (
                    <>
                        <Text style={styles.title}>Client Login</Text>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor="#666"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#666"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>LOGIN</Text>}
                        </TouchableOpacity>

                        

                        <View style={{ marginTop: 20 }}>
                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={handleClientGoogleLogin}
                            >
                                <MaterialCommunityIcons name="google" size={24} color="#fff" />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ marginTop: 30 }}>
                            <Text style={styles.link}>Don't have an account? <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Sign up</Text></Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.title}>Bouncer / Gunman Login</Text>
                        <Text style={styles.subtitle}>Join our elite security team</Text>

                        <View style={styles.bouncerInfoBox}>
                            <MaterialCommunityIcons name="shield-check" size={30} color="#FFD700" />
                            <View style={styles.bouncerInfoText}>
                                <Text style={styles.bouncerInfoTitle}>Professional Security Services</Text>
                                <Text style={styles.bouncerInfoDesc}>
                                    Register as a bouncer or gunman and get hired for premium security assignments
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleBouncerRegistration}
                        >
                            <MaterialCommunityIcons name="google" size={24} color="#fff" />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.benefitsContainer}>
                            <Text style={styles.benefitsTitle}>Why Join Us?</Text>
                            {[
                                { icon: 'cash-multiple', text: 'Competitive Pay' },
                                { icon: 'calendar-check', text: 'Flexible Schedule' },
                                { icon: 'shield-star', text: 'Premium Clients' },
                                { icon: 'certificate', text: 'Professional Growth' },
                            ].map((benefit, index) => (
                                <View key={index} style={styles.benefitItem}>
                                    <MaterialCommunityIcons name={benefit.icon} size={18} color="#FFD700" />
                                    <Text style={styles.benefitText}>{benefit.text}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity onPress={() => setLoginMode('client')} style={{ marginTop: 20 }}>
                            <Text style={styles.link}>Looking to hire? <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Switch to Client</Text></Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoBox: {
        width: 100,
        height: 100,
        backgroundColor: '#1E1E1E',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#333',
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
        letterSpacing: 0.5,
    },
    formContainer: {
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        height: 55,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    button: {
        backgroundColor: '#FFD700',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    skipBtn: {
        marginTop: 20,
        alignSelf: 'center',
    },
    skipText: {
        color: '#666',
        fontSize: 14,
    },
    link: {
        color: '#888',
        textAlign: 'center',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 4,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#333',
    },
    modeToggle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    modeToggleActive: {
        backgroundColor: '#FFD700',
    },
    modeToggleText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    modeToggleTextActive: {
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 25,
        marginTop: -10,
    },
    bouncerInfoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    bouncerInfoText: {
        flex: 1,
        marginLeft: 15,
    },
    bouncerInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    bouncerInfoDesc: {
        fontSize: 13,
        color: '#aaa',
        lineHeight: 20,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#4285F4',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    googleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
    },
    benefitsContainer: {
        marginTop: 30,
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitText: {
        color: '#ccc',
        fontSize: 14,
        marginLeft: 12,
    },
});
