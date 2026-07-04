import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import LottieView from 'lottie-react-native';

type LoginHeaderProps = {
    mode: 'client' | 'bouncer';
};

export default function LoginHeader({ mode }: LoginHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.brandContainer}>
                <Image source={require('../../../../SOS!.png')} style={styles.logoImage} />
                <Text style={styles.appName}>
                    SHIELD OF <Text style={{ color: '#FFD700' }}>SECURITY</Text>
                </Text>
            </View>
            <Text style={styles.tagline}>Premium Security Staffing</Text>
            
            <View style={styles.welcomeBox}>
                {mode === 'client' ? (
                    <>
                        <Text style={styles.welcomeTitle}>Welcome!</Text>
                        <Text style={styles.welcomeSubtitle}>Hire Trusted Security Professionals</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.welcomeTitle}>Verified Professional</Text>
                        <Text style={styles.welcomeSubtitle}>Join India's Trusted Security Network</Text>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 10,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 2,
    },
    logoImage: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 5,
    },
    appName: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 12,
        color: '#888',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    welcomeBox: {
        alignItems: 'center',
        marginTop: 5,
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 13,
        color: '#aaa',
        letterSpacing: 0.3,
    }
});
