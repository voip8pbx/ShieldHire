import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function PremiumBackground({ children }: { children: React.ReactNode }) {
    const pulseAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 4000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050505', '#0F0F0F', '#151515']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Glowing Orb 1 */}
            <Animated.View style={[
                styles.glowOrb, 
                styles.orbTopRight, 
                { transform: [{ scale: pulseAnim }], opacity: 0.15 }
            ]} />
            
            {/* Glowing Orb 2 */}
            <Animated.View style={[
                styles.glowOrb, 
                styles.orbBottomLeft, 
                { transform: [{ scale: pulseAnim }], opacity: 0.1 }
            ]} />

            {/* Content overlay */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    glowOrb: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        backgroundColor: '#FFD700',
    },
    orbTopRight: {
        top: -width * 0.5,
        right: -width * 0.5,
    },
    orbBottomLeft: {
        bottom: -width * 0.5,
        left: -width * 0.5,
    },
    content: {
        flex: 1,
        zIndex: 10,
    }
});
