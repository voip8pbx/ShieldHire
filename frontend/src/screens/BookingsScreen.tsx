import React, { useState, useContext, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView, Platform, TouchableOpacity, Image, RefreshControl } from 'react-native';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const BookingCardClient = React.memo(({ item, navigation }: { item: any, navigation: any }) => {
    const bouncerId = item.bouncer?.id || item.bouncerId;
    const bouncerName = item.bouncer?.name || item.bouncerName || 'Security Professional';
    const bouncerPhoto = item.bouncer?.profilePhoto || item.bouncer?.profile_image_url || item.bouncer?.user?.profilePhoto;

    const handlePressDetails = () => {
        if (item.id) {
            navigation.navigate('BookingDetails', { bookingId: item.id } as any);
        }
    };

    const handlePressChat = () => {
        if (item.id) {
            navigation.navigate('Chat', { bookingId: item.id } as any);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (_) {
            return dateStr;
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={handlePressDetails}
            activeOpacity={0.88}
        >
            <View style={styles.cardHeader}>
                <View style={styles.bouncerInfoRow}>
                    {bouncerPhoto ? (
                        <Image source={{ uri: bouncerPhoto }} style={styles.bouncerAvatar} />
                    ) : (
                        <View style={styles.bouncerAvatarPlaceholder}>
                            <MaterialCommunityIcons name="account-shield" size={22} color="#FFD700" />
                        </View>
                    )}
                    <View style={styles.bouncerTitleWrap}>
                        <Text style={styles.bouncerName} numberOfLines={1}>{bouncerName}</Text>
                        <Text style={styles.packageTag}>
                            {item.package === 'VIP_BODYGUARD' ? 'VIP Escort' : 'Security Guard'}
                        </Text>
                    </View>
                </View>

                <View style={[
                    styles.statusBadge,
                    item.status === 'CONFIRMED' && styles.statusConfirmed,
                    item.status === 'PENDING' && styles.statusPending,
                    item.status === 'CANCELLED' && styles.statusCancelled
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'PENDING' && styles.statusTextPending,
                        item.status === 'CANCELLED' && styles.statusTextCancelled
                    ]}>{item.status || 'PENDING'}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRows}>
                <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={14} color="#FFD700" style={styles.icon} />
                    <Text style={styles.rowText}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.row}>
                    <Ionicons name="time-outline" size={14} color="#FFD700" style={styles.icon} />
                    <Text style={styles.rowText}>{item.time || '10:00 AM'} ({item.duration || 4} hrs)</Text>
                </View>

                <View style={styles.row}>
                    <Ionicons name="location-outline" size={14} color="#FFD700" style={styles.icon} />
                    <Text style={styles.rowText} numberOfLines={1}>{item.location || 'Location specified'}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.priceWrap}>
                    <Text style={styles.costLabel}>Total Price</Text>
                    <Text style={styles.priceText}>₹{item.totalPrice || 2000}</Text>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.chatBtn} onPress={handlePressChat} activeOpacity={0.8}>
                        <Ionicons name="chatbubble-ellipses-outline" size={15} color="#000" />
                        <Text style={styles.chatBtnText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.detailsBtn} onPress={handlePressDetails} activeOpacity={0.8}>
                        <Text style={styles.detailsBtnText}>Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFD700" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default function BookingsScreen() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<NavigationProp<any>>();
    const { token, user, requireAuth } = useContext(AuthContext);
    const isGuest = !token || token === 'guest_token';

    const fetchBookings = async (isRefresh = false) => {
        if (isGuest) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (!isRefresh) setLoading(true);
        try {
            const response = await api.get('/bookings');
            console.log(`[Bookings] Fetched ${response.data?.length || 0} records for user: ${user?.id || 'client'}`);
            const sortedBookings = (response.data || []).sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || a.date).getTime();
                const dateB = new Date(b.createdAt || b.date).getTime();
                return dateB - dateA;
            });
            setBookings(sortedBookings);
        } catch (error: any) {
            console.log('[Bookings] Fetch Notice:', error?.response?.data?.error || error?.message);
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [token]);

    useFocusEffect(
        React.useCallback(() => {
            fetchBookings(true);
        }, [token])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings(true);
    };

    const renderItem = React.useCallback(({ item }: any) => {
        return <BookingCardClient item={item} navigation={navigation} />;
    }, [navigation]);

    if (isGuest) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
                <View style={styles.guestContainer}>
                    <View style={styles.guestIconWrap}>
                        <Ionicons name="shield-checkmark" size={64} color="#FFD700" />
                    </View>
                    <Text style={styles.guestTitle}>Your Security Hires</Text>
                    <Text style={styles.guestSubtitle}>Sign in to view active bookings</Text>
                    <Text style={styles.guestDesc}>
                        Book elite bodyguards & security officers, track your active hires, and chat with guards directly.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        activeOpacity={0.85}
                        onPress={() => requireAuth(navigation, 'Bookings')}
                    >
                        <Ionicons name="log-in-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.loginBtnText}>Login / Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#070708" />
            <View style={styles.headerBar}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 32 }} />
                )}
                <Text style={styles.headerTitle}>Your Bookings</Text>
                <TouchableOpacity style={styles.refreshIconBtn} onPress={() => fetchBookings(true)}>
                    <Ionicons name="refresh-outline" size={18} color="#FFD700" />
                </TouchableOpacity>
            </View>


            {loading && !refreshing ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" colors={['#FFD700']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="shield-search" size={56} color="#333" />
                            <Text style={styles.emptyTitle}>No Bookings Found</Text>
                            <Text style={styles.emptyDesc}>You haven't hired any security personnel yet.</Text>
                            <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('ExploreProfessionals' as any)}>
                                <Text style={styles.exploreBtnText}>Explore Security Guards</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    backBtnHeader: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#161618',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },

    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#161618',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bouncerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    bouncerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#FFD700',
        marginRight: 12,
    },
    bouncerAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#252528',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    bouncerTitleWrap: {
        flex: 1,
    },
    bouncerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    packageTag: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    statusConfirmed: {
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
        borderColor: 'rgba(52, 199, 89, 0.4)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 149, 0, 0.15)',
        borderColor: 'rgba(255, 149, 0, 0.4)',
    },
    statusCancelled: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
        borderColor: 'rgba(255, 59, 48, 0.4)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4CD964',
    },
    statusTextPending: {
        color: '#FF9500',
    },
    statusTextCancelled: {
        color: '#FF3B30',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginVertical: 12,
    },
    detailRows: {
        gap: 6,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 8,
        width: 16,
    },
    rowText: {
        fontSize: 13,
        color: '#ccc',
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 12,
    },
    priceWrap: {},
    costLabel: {
        fontSize: 11,
        color: '#777',
    },
    priceText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFD700',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    chatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        gap: 5,
    },
    chatBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        gap: 4,
    },
    detailsBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFD700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginTop: 12,
        marginBottom: 6,
    },
    emptyDesc: {
        fontSize: 13,
        color: '#777',
        textAlign: 'center',
        marginBottom: 20,
    },
    exploreBtn: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 16,
    },
    exploreBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '700',
    },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    guestIconWrap: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    guestTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
    },
    guestSubtitle: {
        fontSize: 15,
        color: '#FFD700',
        fontWeight: '600',
        marginBottom: 12,
    },
    guestDesc: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 28,
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        elevation: 4,
    },
    loginBtnText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '700',
    },
});
