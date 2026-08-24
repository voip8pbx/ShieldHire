import React, { useState, useContext } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, 
    StatusBar, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { AuthContext } from '../context/AuthContext';
import api, { setAuthToken } from '../services/api';
import { supabase } from '../config/supabase';

// Premium Components
import PremiumBackground from '../components/login/PremiumBackground';
import AuthenticationCard from '../components/login/AuthenticationCard';
import InputField from '../components/login/InputField';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

type Props = {
    navigation: SignupScreenNavigationProp;
};

export default function SignupScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    // Animations
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
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

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const role = 'USER';

            // Step 1: Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role,
                    }
                }
            });

            if (error || !data.user) {
                throw error || new Error('Signup failed');
            }

            // If auto-confirm is not enabled, data.session might be null
            if (!data.session) {
                Alert.alert('Success', 'Account created! Please verify your email.');
                navigation.navigate('Login');
                return;
            }

            const token = data.session.access_token;
            setAuthToken(token);

            // Fetch the user profile from our backend
            const response = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
            const userData = response.data.user;

            login(token, userData);
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PremiumBackground>
            <StatusBar barStyle="light-content" backgroundColor="#070708" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.fixedContent}>
                    <Animated.View style={[
                        styles.formContainer,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>New Account</Text>
                            <Text style={styles.subtitle}>Join ShieldOfSecurity Network</Text>
                        </View>

                        <AuthenticationCard>
                            <InputField 
                                iconName="account-outline"
                                label="Full Name / Company Name"
                                value={name}
                                onChangeText={setName}
                            />

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
                                onPress={handleSignup} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLinkContainer}>
                                <Text style={styles.linkText}>
                                    Already have an account? <Text style={styles.linkTextBold}>Login</Text>
                                </Text>
                            </TouchableOpacity>
                        </AuthenticationCard>
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
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        letterSpacing: 0.3,
    },
    primaryButton: {
        backgroundColor: '#FFD700',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    footerLinkContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    linkText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    linkTextBold: {
        color: '#FFD700',
        fontWeight: 'bold',
    }
});
