import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type RoleSwitcherProps = {
    mode: 'client' | 'bouncer';
    onModeChange: (mode: 'client' | 'bouncer') => void;
};

const { width } = Dimensions.get('window');
const SWITCHER_WIDTH = width - 60; // Container width (padding 30 on each side)
const TAB_WIDTH = SWITCHER_WIDTH / 2;

export default function RoleSwitcher({ mode, onModeChange }: RoleSwitcherProps) {
    const slideAnim = useRef(new Animated.Value(mode === 'client' ? 0 : 1)).current;
    const [containerWidth, setContainerWidth] = useState(SWITCHER_WIDTH);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: mode === 'client' ? 0 : 1,
            useNativeDriver: true,
            bounciness: 4,
            speed: 12,
        }).start();
    }, [mode, slideAnim]);

    const tabWidth = containerWidth / 2;
    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, tabWidth]
    });

    return (
        <View 
            style={styles.container}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <Animated.View 
                style={[
                    styles.activeBackground, 
                    { 
                        width: tabWidth,
                        transform: [{ translateX }] 
                    }
                ]} 
            />
            
            <TouchableOpacity 
                style={styles.tab} 
                onPress={() => onModeChange('client')}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons 
                    name="account-tie" 
                    size={20} 
                    color={mode === 'client' ? '#000' : '#888'} 
                />
                <Text style={[styles.tabText, mode === 'client' && styles.tabTextActive]}>
                    Client
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.tab} 
                onPress={() => onModeChange('bouncer')}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons 
                    name="shield-account" 
                    size={20} 
                    color={mode === 'bouncer' ? '#000' : '#888'} 
                />
                <Text style={[styles.tabText, mode === 'bouncer' && styles.tabTextActive]}>
                    Bouncer
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
        height: 48,
        position: 'relative',
    },
    activeBackground: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        backgroundColor: '#FFD700',
        borderRadius: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tabText: {
        color: '#888',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    tabTextActive: {
        color: '#000',
        fontWeight: 'bold',
    }
});
