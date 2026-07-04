import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BENEFITS = [
    { icon: 'cash-multiple', text: 'Higher Earnings' },
    { icon: 'calendar-check', text: 'Flexible Jobs' },
    { icon: 'shield-star', text: 'Verified Clients' },
    { icon: 'bank-transfer', text: 'Safe Payments' },
    { icon: 'certificate', text: 'Professional Recognition' },
];

export default function BenefitsCard() {
    const fadeAnims = useRef(BENEFITS.map(() => new Animated.Value(0))).current;
    const translateYAnims = useRef(BENEFITS.map(() => new Animated.Value(10))).current;

    useEffect(() => {
        const animations = BENEFITS.map((_, index) => {
            return Animated.parallel([
                Animated.timing(fadeAnims[index], {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(translateYAnims[index], {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]);
        });

        Animated.stagger(100, animations).start();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Why Join Us?</Text>
            {BENEFITS.map((benefit, index) => (
                <Animated.View 
                    key={index} 
                    style={[
                        styles.item, 
                        { 
                            opacity: fadeAnims[index],
                            transform: [{ translateY: translateYAnims[index] }]
                        }
                    ]}
                >
                    <MaterialCommunityIcons name={benefit.icon} size={20} color="#FFD700" />
                    <Text style={styles.text}>{benefit.text}</Text>
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.1)',
        marginTop: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        letterSpacing: 0.5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    text: {
        color: '#ccc',
        fontSize: 15,
        marginLeft: 12,
        fontWeight: '500',
    },
});
