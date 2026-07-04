import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type GoogleLoginButtonProps = {
    onPress: () => void;
};

export default function GoogleLoginButton({ onPress }: GoogleLoginButtonProps) {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
                style={styles.button} 
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                <MaterialCommunityIcons name="google" size={24} color="#000" />
                <Text style={styles.text}>Continue with Google</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 15,
    },
    text: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
        letterSpacing: 0.3,
    },
});
