import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('>>> [ErrorBoundary Caught Component Exception]:', error?.message || error);
        if (errorInfo?.componentStack) {
            console.error('>>> [Component Stack Trace]:\n', errorInfo.componentStack);
        }
        this.setState({ errorInfo });
    }

    handleRestart = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="light-content" backgroundColor="#070708" />
                    <View style={styles.container}>
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons name="shield-alert-outline" size={56} color="#FFD700" />
                        </View>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.subtitle}>
                            An unexpected issue occurred. Your account and session are safe.
                        </Text>

                        {Boolean(__DEV__ && this.state.error) && (
                            <ScrollView style={styles.errorBox}>
                                <Text style={styles.errorText}>
                                    {this.state.error?.toString()}
                                </Text>
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.btn} onPress={this.handleRestart} activeOpacity={0.85}>
                            <Text style={styles.btnText}>RELOAD APP</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#070708',
    },
    container: {
        flex: 1,
        backgroundColor: '#070708',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    iconBox: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    errorBox: {
        maxHeight: 140,
        width: '100%',
        backgroundColor: '#161618',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 11,
    },
    btn: {
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 14,
        marginTop: 8,
    },
    btnText: {
        color: '#070708',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
