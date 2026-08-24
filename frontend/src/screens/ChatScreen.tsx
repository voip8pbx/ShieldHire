import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { uploadImageToBlob } from '../services/uploadService';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';


type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type Props = {
    navigation: ChatScreenNavigationProp;
    route: ChatScreenRouteProp;
};

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    mediaUrl: string | null;
    mediaType: 'voice' | 'image' | null;
    timestamp: string;
}

export default function ChatScreen({ navigation, route }: Props) {
    const { bookingId } = route.params;
    const { user } = useContext(AuthContext);
    const { colors } = useContext(ThemeContext);
    const isFocused = useIsFocused();
    const flatListRef = useRef<FlatList>(null);

    // States
    const [booking, setBooking] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Voice States
    const [isRecording, setIsRecording] = useState(false);
    const [recordSecs, setRecordSecs] = useState(0);
    const [voicePlayingId, setVoicePlayingId] = useState<string | null>(null);
    const recordingTimer = useRef<NodeJS.Timeout | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const voicePlayProgress = useRef(new Animated.Value(0)).current;

    const startRecording = () => {
        Alert.alert('Coming Soon', 'Voice messages will be available in the next update.');
    };

    const stopRecording = (_send = true) => {};

    const handlePlayVoice = (_messageId: string, _mediaUrl: string) => {};

    // Fetch booking details including chat logs
    const fetchBookingDetails = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const response = await api.get(`/bookings/${bookingId}`);
            if (response.data) {
                setBooking(response.data);
                setMessages(response.data.chat || []);
            }
        } catch (e: any) {
            console.error('Failed to load chat details:', e);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    // Poll chat details every 3 seconds when screen is active
    useEffect(() => {
        fetchBookingDetails(true);

        let interval: NodeJS.Timeout;
        if (isFocused) {
            interval = setInterval(() => {
                fetchBookingDetails(false);
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [bookingId, isFocused]);

    // Pulsing animation effect removed

    const handleSendMessage = async (text = '', mediaUrl = null, mediaType: 'voice' | 'image' | null = null) => {
        const payloadText = text.trim() || inputText.trim();
        if (!payloadText && !mediaUrl) return;

        setSending(true);
        try {
            const response = await api.post(`/bookings/${bookingId}/chat`, {
                text: payloadText,
                mediaUrl,
                mediaType,
            });
            if (response.data) {
                setBooking(response.data);
                setMessages(response.data.chat || []);
                setInputText('');
                // Scroll to bottom
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        } catch (e: any) {
            Alert.alert('Send Error', e.response?.data?.error || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    // Image upload handler
    const handlePickImage = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 1200,
                maxWidth: 1200,
                quality: 0.8,
            },
            async (response) => {
                if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
                const asset = response.assets[0];
                if (!asset.uri || !asset.base64) return;

                setSending(true);
                try {
                    const dataUri = `data:${asset.type};base64,${asset.base64}`;
                    const uploadedUrl = await uploadImageToBlob(dataUri, `chat-${Date.now()}.jpg`, 'chat');
                    if (uploadedUrl) {
                        await handleSendMessage('Sent a photo', uploadedUrl, 'image');
                    }
                } catch (e: any) {
                    Alert.alert('Upload Failed', 'Could not upload attachment.');
                } finally {
                    setSending(false);
                }
            }
        );
    };

    // Mock voice recorder logic removed for production

    // Status controls (Bouncer accepts/declines)
    const handleUpdateStatus = async (status: 'CONFIRMED' | 'REJECTED') => {
        setLoading(true);
        try {
            const response = await api.patch(`/bookings/${bookingId}/status`, { status });
            if (response.data) {
                setBooking(response.data);
                setMessages(response.data.chat || []);
                Alert.alert('Status Updated', `Booking request has been ${status.toLowerCase()} successfully!`);
            }
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to update request status.');
        } finally {
            setLoading(false);
        }
    };

    // Navigation helper to Payment
    const handleProceedToPayment = () => {
        if (!booking) return;
        (navigation as any).navigate('PaymentScreen', {
            bouncerId: booking.bouncerId,
            date: booking.date,
            time: booking.time,
            location: booking.location,
            latitude: booking.latitude,
            longitude: booking.longitude,
            duration: booking.duration,
            totalPrice: booking.totalPrice,
            package: booking.package,
            notes: booking.notes,
            bookingId: booking.id,
        });
    };

    if (loading && !booking) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Connecting to secure chat...</Text>
            </View>
        );
    }

    const isBouncer = user?.role === 'BOUNCER' || user?.role === 'GUNMAN';
    const otherPartyName = isBouncer ? booking?.clientName || 'Client' : booking?.bouncer?.name || 'Bouncer';
    const otherPartyPhoto = isBouncer ? null : booking?.bouncer?.profilePhoto;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.background === '#1A1A1D' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            {/* Chat Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerUser}>
                    {otherPartyPhoto ? (
                        <Image source={{ uri: otherPartyPhoto }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
                            <Ionicons name="person" size={20} color={colors.textSecondary} />
                        </View>
                    )}
                    <View>
                        <Text style={[styles.headerName, { color: colors.textPrimary }]}>{otherPartyName}</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {booking?.package === 'VIP_BODYGUARD' ? 'VIP Gunman' : 'Security Guard'}
                        </Text>
                    </View>
                </View>

                {/* Booking Status Badge */}
                <View style={[styles.statusBadge,
                booking?.status === 'CONFIRMED' && styles.statusConfirmed,
                booking?.status === 'ACTIVE' && styles.statusActive,
                booking?.status === 'COMPLETED' && styles.statusCompleted,
                booking?.status === 'REJECTED' && styles.statusRejected,
                ]}>
                    <Text style={styles.statusText}>{booking?.status}</Text>
                </View>
            </View>

            {/* Booking Details Summary Dropdown */}
            <View style={[styles.summaryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={16} color={colors.gold} />
                <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                    {booking?.date ? new Date(booking.date).toDateString() : ''} at {booking?.time} ({booking?.duration} hrs) • ₹{booking?.totalPrice}
                </Text>
                <Text style={[styles.summaryLoc, { color: colors.textSecondary }]} numberOfLines={1}>
                    📍 {booking?.location}
                </Text>
            </View>

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                    const isSystem = item.senderId === 'system';
                    const isSelf = item.senderId === user?.id;

                    if (isSystem) {
                        return (
                            <View style={styles.systemMsgContainer}>
                                <View style={styles.systemMsgBubble}>
                                    <View style={styles.systemMsgRow}>
                                        <Ionicons name="information-circle-outline" size={14} color="#A3D2A2" style={{ marginRight: 6 }} />
                                        <Text style={styles.systemMsgText}>{item.text}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }

                    return (
                        <View style={[styles.msgContainer, isSelf ? styles.msgSelf : styles.msgOther]}>
                            <View style={[
                                styles.msgBubble, 
                                isSelf ? [styles.bubbleSelf, { backgroundColor: colors.bubbleSelf }] 
                                       : [styles.bubbleOther, { backgroundColor: colors.bubbleOther, borderColor: colors.border }]
                            ]}>
                                <Text style={[styles.senderLabel, { color: isSelf ? '#7A641A' : colors.textSecondary }]}>
                                    {isSelf ? 'You' : item.senderName}
                                </Text>

                                {item.mediaType === 'image' && item.mediaUrl && (
                                    <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
                                )}

                                {item.mediaType === 'voice' && item.mediaUrl && (
                                    <TouchableOpacity
                                        style={[
                                            styles.voicePlayer,
                                            { backgroundColor: isSelf ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)' }
                                        ]}
                                        onPress={() => handlePlayVoice(item.id, item.mediaUrl!)}
                                    >
                                        <View style={[styles.voicePlayBtn, { backgroundColor: isSelf ? colors.bubbleTextSelf : colors.gold }]}>
                                            <Ionicons name={voicePlayingId === item.id ? "pause" : "play"} size={14} color={isSelf ? colors.gold : '#000'} />
                                        </View>
                                        <View style={styles.waveContainer}>
                                            <View style={styles.waveLineContainer}>
                                                {[10, 18, 12, 14, 22, 16, 20, 14, 18, 10, 12, 22, 14, 18, 12].map((height, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            styles.waveBar,
                                                            {
                                                                height,
                                                                backgroundColor: isSelf
                                                                    ? (voicePlayingId === item.id ? '#000' : 'rgba(0,0,0,0.3)')
                                                                    : (voicePlayingId === item.id ? '#FFD700' : '#666')
                                                            }
                                                        ]}
                                                    />
                                                ))}
                                            </View>
                                            {voicePlayingId === item.id && (
                                                <Animated.View
                                                    style={[
                                                        styles.voiceProgressIndicator,
                                                        {
                                                            width: voicePlayProgress.interpolate({
                                                                inputRange: [0, 100],
                                                                outputRange: ['0%', '100%']
                                                            }),
                                                            backgroundColor: isSelf ? '#000' : '#FFD700'
                                                        }
                                                    ]}
                                                />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}

                                <Text style={[styles.msgText, { color: isSelf ? colors.bubbleTextSelf : colors.bubbleTextOther }]}>
                                    {item.text}
                                </Text>
                                <Text style={[styles.msgTime, { color: isSelf ? 'rgba(0,0,0,0.6)' : colors.textSecondary }]}>
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            {isRecording && (
                <View style={styles.recordOverlay}>
                    <Animated.View style={[styles.recordWave, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.recordBubble}>
                        <MaterialCommunityIcons name="microphone" size={32} color="#FFD700" />
                        <Text style={styles.recordText}>
                            00:{recordSecs < 10 ? '0' : ''}{recordSecs}
                        </Text>
                        <Text style={styles.recordHint}>Recording voice...</Text>
                        <TouchableOpacity
                            onPress={() => stopRecording(false)}
                            style={{ marginTop: 10, paddingHorizontal: 15, paddingVertical: 6, backgroundColor: '#FF4D4D', borderRadius: 12 }}
                        >
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* COMPOSER BAR & CTAs */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                {/* Dynamic Footer Call to Action Banners */}
                {booking?.status === 'PENDING' && isBouncer && (
                    <View style={[styles.actionBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <Text style={[styles.actionBannerText, { color: colors.textPrimary }]}>Do you want to accept this security shift?</Text>
                        <View style={styles.actionBannerButtons}>
                            <TouchableOpacity
                                style={[styles.bannerBtn, styles.declineBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                                onPress={() => handleUpdateStatus('REJECTED')}
                            >
                                <Text style={[styles.btnText, { color: colors.textPrimary }]}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.bannerBtn, styles.acceptBtn, { backgroundColor: colors.gold }]}
                                onPress={() => handleUpdateStatus('CONFIRMED')}
                            >
                                <Text style={[styles.btnText, { color: '#000' }]}>Accept Shift</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {booking?.status === 'CONFIRMED' && !isBouncer && booking?.paymentStatus === 'PENDING' && (
                    <View style={[styles.actionBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <Text style={[styles.actionBannerText, { color: colors.textPrimary }]}>Shift confirmed! Proceed to pay guard directly via UPI.</Text>
                        <TouchableOpacity
                            style={[styles.payNowBtn, { backgroundColor: colors.gold }]}
                            onPress={handleProceedToPayment}
                        >
                            <Text style={styles.payNowBtnText}>PROCEED TO UPI PAYMENT</Text>
                            <Ionicons name="wallet-outline" size={20} color="#000" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Composer Input Area */}
                <View style={[styles.composer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.composerIconBtn}>
                        <Ionicons name="add-circle" size={26} color={colors.gold} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrap, { backgroundColor: colors.inputBg }]}>
                        <TextInput
                            style={[styles.composerInput, { color: colors.textPrimary }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>

                    {inputText.trim().length > 0 ? (
                        <TouchableOpacity
                            onPress={() => handleSendMessage()}
                            style={[styles.sendButton, { backgroundColor: colors.gold }]}
                            disabled={sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Ionicons name="send" size={20} color="#000" />
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPressIn={startRecording}
                            onPressOut={() => stopRecording(true)}
                            style={[styles.micButton, { backgroundColor: colors.gold }, isRecording && { opacity: 0.5 }]}
                        >
                            <MaterialCommunityIcons
                                name={"microphone"}
                                size={22}
                                color="#000"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#090909',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#090909',
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 12,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#161616',
        backgroundColor: '#090909',
    },
    backButton: {
        padding: 4,
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        flex: 1,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: 10,
    },
    avatarPlaceholder: {
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 12,
    },
    statusBadge: {
        backgroundColor: '#FFD70020',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    statusConfirmed: {
        backgroundColor: '#4CAF5020',
        borderColor: '#4CAF50',
    },
    statusActive: {
        backgroundColor: '#2196F320',
        borderColor: '#2196F3',
    },
    statusCompleted: {
        backgroundColor: '#9E9E9E20',
        borderColor: '#9E9E9E',
    },
    statusRejected: {
        backgroundColor: '#F4433620',
        borderColor: '#F44336',
    },
    statusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    summaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexWrap: 'wrap',
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
    },
    summaryText: {
        color: '#FFF',
        fontSize: 13,
        marginLeft: 6,
        marginRight: 12,
    },
    summaryLoc: {
        color: '#888',
        fontSize: 12,
        flex: 1,
    },
    messageList: {
        padding: 16,
        paddingBottom: 32,
    },
    msgContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    msgSelf: {
        justifyContent: 'flex-end',
    },
    msgOther: {
        justifyContent: 'flex-start',
    },
    msgBubble: {
        maxWidth: '82%',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    bubbleSelf: {
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    senderLabel: {
        fontSize: 10,
        color: '#555',
        marginBottom: 4,
        fontWeight: 'bold',
    },
    msgText: {
        fontSize: 14,
        lineHeight: 20,
    },
    textSelf: {
        color: '#000',
    },
    textOther: {
        color: '#FFF',
    },
    msgTime: {
        fontSize: 9,
        color: '#888',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    mediaImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: '#222',
    },
    voicePlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00000020',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
        width: 200,
    },
    voicePlayBtn: {
        backgroundColor: '#FFD700',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveContainer: {
        flex: 1,
        marginLeft: 10,
        height: 20,
        justifyContent: 'center',
        position: 'relative',
    },
    waveLineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    waveBar: {
        width: 2,
        backgroundColor: '#444',
        borderRadius: 1,
    },
    voiceProgressIndicator: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: 2,
        backgroundColor: '#FFD700',
    },
    systemMsgContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },
    systemMsgBubble: {
        alignItems: 'center',
        backgroundColor: '#1A1D1A',
        borderColor: '#2E4C2E',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        maxWidth: '85%',
    },
    systemMsgRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    systemMsgText: {
        color: '#A3D2A2',
        fontSize: 11,
        fontWeight: 'bold',
    },
    recordOverlay: {
        position: 'absolute',
        bottom: 120,
        left: 32,
        right: 32,
        backgroundColor: '#1E1E1EDD',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderColor: '#FFD70030',
        borderWidth: 1,
    },
    recordWave: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFD70020',
        position: 'absolute',
        top: 10,
    },
    recordBubble: {
        alignItems: 'center',
        zIndex: 1,
    },
    recordText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 10,
    },
    recordHint: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#161616',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    composerIconBtn: {
        padding: 6,
    },
    inputWrap: {
        flex: 1,
        backgroundColor: '#222',
        borderRadius: 20,
        marginHorizontal: 10,
        paddingHorizontal: 16,
        justifyContent: 'center',
        maxHeight: 100,
    },
    composerInput: {
        color: '#FFF',
        fontSize: 14,
        paddingVertical: 8,
        minHeight: 36,
    },
    sendButton: {
        backgroundColor: '#FFD700',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        backgroundColor: '#FFD700',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButtonActive: {
        backgroundColor: '#FFD70050',
    },
    actionBanner: {
        backgroundColor: '#1E1E1E',
        borderTopWidth: 1,
        borderTopColor: '#333',
        padding: 16,
        alignItems: 'center',
    },
    actionBannerText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    actionBannerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    bannerBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 6,
    },
    declineBtn: {
        backgroundColor: '#2A2A2A',
        borderColor: '#444',
        borderWidth: 1,
    },
    acceptBtn: {
        backgroundColor: '#FFD700',
    },
    btnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    payNowBtn: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
    },
    payNowBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
