import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Animated, TouchableOpacity, TextInputProps } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface InputFieldProps extends TextInputProps {
    iconName: string;
    label: string;
    isPassword?: boolean;
}

export default function InputField({ iconName, label, isPassword, value, ...props }: InputFieldProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedIsFocused, {
            toValue: isFocused || value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    const labelStyle = {
        position: 'absolute' as const,
        left: 45,
        top: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [15, 11],
        }),
        color: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: ['#888', '#FFD700'],
        }),
        zIndex: 1,
    };

    const borderColor = animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: ['#333', '#FFD700'],
    });

    return (
        <Animated.View style={[styles.container, { borderColor }]}>
            <MaterialCommunityIcons 
                name={iconName} 
                size={22} 
                color={isFocused ? '#FFD700' : '#888'} 
                style={styles.icon} 
            />
            <View style={styles.inputWrapper}>
                <Animated.Text style={labelStyle}>
                    {label}
                </Animated.Text>
                <TextInput
                    style={[styles.input, (isFocused || value) && styles.inputActive]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    value={value}
                    placeholderTextColor="transparent"
                    {...props}
                />
            </View>
            {isPassword && (
                <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                    <MaterialCommunityIcons 
                        name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                        size={22} 
                        color="#888" 
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        height: 50,
        borderRadius: 14,
        marginBottom: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
    },
    icon: {
        marginRight: 12,
    },
    inputWrapper: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        paddingTop: 18, 
        paddingBottom: 2,
    },
    inputActive: {
        // Adjust padding if needed when focused
    },
    eyeIcon: {
        padding: 5,
    }
});
