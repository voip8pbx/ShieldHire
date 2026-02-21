import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { AuthContext } from '../context/AuthContext';
import api, { setAuthToken } from '../services/api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../config/supabase';

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

            // We use the auth_id linking strategy. First set token for API calls.
            // When auto-confirm is not enabled, data.session might be null, but let's assume it logs in automatically for now.
            if (!data.session) {
                Alert.alert('Success', 'Account created! Please verify your email.');
                navigation.navigate('Login');
                return;
            }

            const token = data.session.access_token;
            setAuthToken(token);

            // Fetch the user profile from our backend, which will Auto-Create it based on token metadata
            const response = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
            const userData = response.data.user;

            login(token, userData);
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message || 'Something went wrong');
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

            <View style={styles.header}>
                <Text style={styles.title}>New Account</Text>
                <Text style={styles.subtitle}>Join SecureGuard Network</Text>
            </View>

            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name / Company Name"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>CREATE ACCOUNT</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                    <Text style={styles.link}>Already have an account? <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Login</Text></Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#0F0F0F',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    formContainer: {
        width: '100%',
    },
    input: {
        height: 55,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 15,
        backgroundColor: '#1E1E1E',
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#FFD700',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
    loginLink: {
        marginTop: 30,
        alignSelf: 'center',
    },
    link: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
    },
});
