import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Easing,
    Platform,
    Linking
} from 'react-native';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

export type SOSModalState = 'INITIAL' | 'LOADING' | 'SUCCESS' | 'ERROR' | 'PERMISSION';

interface SOSConfirmationModalProps {
    isVisible: boolean;
    state: SOSModalState;
    errorMessage?: string;
    onCancel: () => void;
    onSend: () => void;
    onClose: () => void;
    onOpenSettings: () => void;
}

export default function SOSConfirmationModal({
    isVisible,
    state,
    errorMessage,
    onCancel,
    onSend,
    onClose,
    onOpenSettings,
}: SOSConfirmationModalProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible && state === 'INITIAL') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isVisible, state]);

    useEffect(() => {
        if (state === 'SUCCESS' || state === 'ERROR' || state === 'PERMISSION') {
            scaleAnim.setValue(0.5);
            fadeAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [state]);

    const renderContent = () => {
        switch (state) {
            case 'LOADING':
                return (
                    <View style={styles.centerContent}>
                        <View style={styles.iconContainerLoading}>
                            <ActivityIndicator size="large" color="#FF3B30" />
                        </View>
                        <Text style={styles.title}>Sending SOS...</Text>
                        <Text style={styles.subtitle}>
                            Please wait while we notify our emergency response team.
                        </Text>
                    </View>
                );

            case 'SUCCESS':
                return (
                    <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                            <Ionicons name="checkmark-circle" size={60} color="#34C759" />
                        </View>
                        <Text style={styles.title}>SOS Alert Sent Successfully</Text>
                        <Text style={styles.subtitle}>
                            Your emergency request has been received.{"\n\n"}
                            Our team has been notified with your live location.
                            Please remain where you are if it is safe to do so.
                        </Text>
                        <TouchableOpacity style={[styles.button, styles.successButton]} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.buttonTextWhite}>OK</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 'ERROR':
                return (
                    <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                            <Ionicons name="close-circle" size={60} color="#FF3B30" />
                        </View>
                        <Text style={styles.title}>Unable to Send SOS</Text>
                        <Text style={styles.subtitle}>
                            {errorMessage || 'An unexpected error occurred while trying to send the SOS alert.'}
                        </Text>
                        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={onSend} activeOpacity={0.8}>
                            <Text style={styles.buttonTextWhite}>Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.cancelButton, { marginTop: 12 }]} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );

            case 'PERMISSION':
                return (
                    <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                            <Ionicons name="location" size={60} color="#D4AF37" />
                        </View>
                        <Text style={styles.title}>Location Permission Required</Text>
                        <Text style={styles.subtitle}>
                            SOS requires access to your location so we can send your exact position to our emergency team.
                        </Text>
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton, { flex: 1, marginRight: 10 }]} onPress={onCancel} activeOpacity={0.8}>
                                <Text style={styles.cancelButtonText}>Not Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.settingsButton, { flex: 1 }]} onPress={onOpenSettings} activeOpacity={0.8}>
                                <Text style={styles.buttonTextWhite}>Open Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                );

            case 'INITIAL':
            default:
                return (
                    <View style={styles.centerContent}>
                        <Animated.View style={[styles.pulseBackground, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="car-emergency" size={50} color="#FF3B30" />
                        </View>
                        <Text style={styles.title}>Emergency SOS</Text>
                        <Text style={styles.subtitle}>
                            Your live location will be shared with our emergency response team immediately.{"\n"}
                            <Text style={{ fontWeight: '700', color: '#ffaaaa' }}>Only send this alert in a real emergency.</Text>
                        </Text>

                        <View style={{ width: '100%', marginTop: 10 }}>
                            <TouchableOpacity activeOpacity={0.8} onPress={onSend}>
                                <LinearGradient
                                    colors={['#FF3B30', '#D92A20']}
                                    style={[styles.button, styles.sendButton]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.sendButtonText}>SEND EMERGENCY ALERT</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel} activeOpacity={0.8}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
        }
    };

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={state === 'LOADING' ? undefined : onCancel}
            onBackButtonPress={state === 'LOADING' ? undefined : onCancel}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.6}
            backdropTransitionOutTiming={0}
            style={styles.modal}
            useNativeDriver
            useNativeDriverForBackdrop
        >
            <View style={styles.container}>
                <View style={styles.dragIndicator} />
                {renderContent()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    container: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingTop: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#333',
        borderRadius: 3,
        marginBottom: 25,
    },
    centerContent: {
        width: '100%',
        alignItems: 'center',
    },
    pulseBackground: {
        position: 'absolute',
        top: -10,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 59, 48, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainerLoading: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#A0A0A0',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
    },
    button: {
        width: '100%',
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    sendButton: {
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#333333',
    },
    cancelButtonText: {
        color: '#A0A0A0',
        fontSize: 15,
        fontWeight: '600',
    },
    successButton: {
        backgroundColor: '#34C759',
    },
    errorButton: {
        backgroundColor: '#FF3B30',
    },
    settingsButton: {
        backgroundColor: '#D4AF37',
    },
    buttonTextWhite: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    }
});
