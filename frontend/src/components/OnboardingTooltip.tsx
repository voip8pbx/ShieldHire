import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface OnboardingTooltipProps {
    visible: boolean;
    title?: string;
    message: string;
    targetPosition?: { top: number, left: number, width: number, height: number } | null;
    onNext?: () => void;
    onSkip: () => void;
    nextLabel?: string;
    arrowDirection?: 'up' | 'down';
    arrowPosition?: 'center' | 'left' | 'right';
    align?: 'center' | 'left' | 'right';
    highlightPosition?: { top: number, left: number, width: number, height: number } | null;
}

export default function OnboardingTooltip({ 
    visible, 
    title, 
    message, 
    targetPosition, 
    onNext, 
    onSkip, 
    nextLabel = "Got it", 
    arrowDirection = 'down',
    arrowPosition = 'center',
    align = 'center',
    highlightPosition 
}: OnboardingTooltipProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true })
            ]).start();

            // Spotlight pulsing animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
                ])
            ).start();
        } else {
            fadeAnim.setValue(0);
            translateY.setValue(20);
            pulseAnim.setValue(1);
        }
    }, [visible]);

    if (!visible) return null;

    const windowDims = Dimensions.get('window');

    let top = windowDims.height / 2;
    let alignSelf: 'flex-start' | 'center' | 'flex-end' = 'center';

    if (targetPosition) {
        if (arrowDirection === 'down') {
            top = targetPosition.top - 160; 
        } else {
            top = targetPosition.top + targetPosition.height + 15;
        }
    }

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                {highlightPosition && (
                    <Animated.View style={[styles.spotlight, {
                        top: highlightPosition.top - 5,
                        left: highlightPosition.left - 5,
                        width: highlightPosition.width + 10,
                        height: highlightPosition.height + 10,
                        transform: [{ scale: pulseAnim }]
                    }]} />
                )}
                
                <Animated.View style={[
                    styles.tooltipContainer,
                    { opacity: fadeAnim, transform: [{ translateY }] },
                    targetPosition ? { 
                        position: 'absolute', 
                        top, 
                        ...(align === 'center' ? { alignSelf: 'center' } : align === 'right' ? { right: 0 } : { left: 0 }) 
                    } : {}
                ]}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="lightbulb-on" size={20} color="#D4AF37" />
                            {title && <Text style={styles.title}>{title}</Text>}
                        </View>
                        <Text style={styles.message}>{message}</Text>
                        
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onNext || onSkip} style={styles.nextBtn}>
                                <Text style={styles.nextText}>{nextLabel}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={[
                        styles.arrow,
                        arrowDirection === 'down' ? styles.arrowDown : styles.arrowUp,
                        arrowPosition === 'center' ? { alignSelf: 'center' } : 
                        arrowPosition === 'left' ? { left: 30 } : { right: 30 }
                    ]} />
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
    },
    spotlight: {
        position: 'absolute',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        zIndex: 50,
    },
    tooltipContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 14,
        padding: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
        zIndex: 100,
        width: 260,
    },
    content: {
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 8,
    },
    message: {
        color: '#E0E0E0',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 16,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    skipBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    skipText: {
        color: '#A0A0A0',
        fontWeight: '600',
        fontSize: 12,
    },
    nextBtn: {
        backgroundColor: '#D4AF37',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 10,
    },
    nextText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 12,
    },
    arrow: {
        position: 'absolute',
        width: 20,
        height: 20,
        backgroundColor: '#1E1E1E',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    arrowDown: {
        bottom: -10,
        transform: [{ rotate: '45deg' }],
    },
    arrowUp: {
        top: -10,
        transform: [{ rotate: '225deg' }],
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    }
});
