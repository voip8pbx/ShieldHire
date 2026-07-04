import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function AuthenticationCard({ children, style }: { children: React.ReactNode, style?: any }) {
    return (
        <Animated.View style={[styles.card, style]}>
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(30, 30, 30, 0.4)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    }
});
