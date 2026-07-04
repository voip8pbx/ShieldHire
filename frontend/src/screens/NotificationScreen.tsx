import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Animated,
    RefreshControl,
    Platform,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Swipeable } from 'react-native-gesture-handler';

// Types
type Category = 'All' | 'Unread' | 'Messages' | 'Updates';
type NotificationType = 'message' | 'update' | 'payment' | 'system' | 'reminder';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: NotificationType;
}

// Dummy Data
const DUMMY_NOTIFICATIONS: Notification[] = [
    { id: '1', title: 'New VIP Assignment', message: 'You have been requested for an event in Downtown. Review details ASAP.', time: '2 mins ago', read: false, type: 'message' },
    { id: '2', title: 'System Alert', message: 'Please update your background verification documents to maintain Pro status.', time: '1 hour ago', read: false, type: 'system' },
    { id: '3', title: 'Payment Received', message: 'Earnings for your last assignment have been securely deposited.', time: 'Yesterday', read: true, type: 'payment' },
    { id: '4', title: 'Schedule Update', message: 'Your shift tomorrow has been modified by the client.', time: '2 days ago', read: true, type: 'update' },
    { id: '5', title: 'Upcoming Shift Reminder', message: 'You have an upcoming shift in 4 hours.', time: '3 days ago', read: true, type: 'reminder' }
];

const CATEGORIES: Category[] = ['All', 'Unread', 'Messages', 'Updates'];

const getIconForType = (type: NotificationType) => {
    switch (type) {
        case 'message': return 'message-text-outline';
        case 'update': return 'calendar-clock-outline';
        case 'payment': return 'currency-usd';
        case 'system': return 'alert-decagram-outline';
        case 'reminder': return 'bell-ring-outline';
        default: return 'bell-outline';
    }
};

const getCategoryColor = (type: NotificationType) => {
    switch (type) {
        case 'message': return '#60A5FA'; // Blue
        case 'update': return '#F59E0B'; // Amber
        case 'payment': return '#10B981'; // Green
        case 'system': return '#EF4444'; // Red
        case 'reminder': return '#8B5CF6'; // Purple
        default: return '#D4AF37'; // Gold
    }
};

const AnimatedNotificationItem = React.memo(({
    item,
    index,
    onDelete,
    onToggleRead
}: {
    item: Notification;
    index: number;
    onDelete: (id: string) => void;
    onToggleRead: (id: string) => void;
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay: index * 100, // Stagger effect
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 6,
                tension: 40,
                delay: index * 100,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const renderRightActions = () => (
        <TouchableOpacity style={styles.deleteAction} onPress={() => onDelete(item.id)}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
    );

    const renderLeftActions = () => (
        <TouchableOpacity style={styles.readAction} onPress={() => onToggleRead(item.id)}>
            <MaterialCommunityIcons name={item.read ? "email-outline" : "email-open-outline"} size={24} color="#fff" />
            <Text style={styles.actionText}>{item.read ? 'Mark Unread' : 'Mark Read'}</Text>
        </TouchableOpacity>
    );

    return (
        <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions}>
            <Animated.View style={[
                styles.notificationCard,
                !item.read && styles.notificationCardUnread,
                { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
            ]}>
                {/* Unread Accent Line */}
                {!item.read && <View style={[styles.unreadAccent, { backgroundColor: getCategoryColor(item.type) }]} />}
                
                <View style={[styles.iconContainer, { backgroundColor: `${getCategoryColor(item.type)}20` }]}>
                    <MaterialCommunityIcons name={getIconForType(item.type)} size={22} color={getCategoryColor(item.type)} />
                </View>
                
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                    <Text style={[styles.message, !item.read && styles.messageUnread]} numberOfLines={2}>
                        {item.message}
                    </Text>
                    
                    <View style={styles.badgeRow}>
                        <View style={[styles.categoryBadge, { borderColor: `${getCategoryColor(item.type)}40` }]}>
                            <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.type) }]}>
                                {item.type.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </Swipeable>
    );
});

export default function NotificationScreen() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<Category>('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading for skeleton
        setTimeout(() => setLoading(false), 1000);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const handleDelete = React.useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleToggleRead = React.useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    }, []);

    const handleMarkAllRead = React.useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const filteredNotifications = React.useMemo(() => {
        let filtered = notifications;
        if (activeFilter === 'Unread') {
            filtered = notifications.filter(n => !n.read);
        } else if (activeFilter === 'Messages') {
            filtered = notifications.filter(n => n.type === 'message');
        } else if (activeFilter === 'Updates') {
            filtered = notifications.filter(n => n.type === 'update');
        }
        return filtered;
    }, [notifications, activeFilter]);

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonContent}>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonMessage1} />
                        <View style={styles.skeletonMessage2} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-sleep-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyMessage}>You don't have any {activeFilter.toLowerCase()} notifications at the moment.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <MaterialCommunityIcons name="check-all" size={24} color="#D4AF37" />
                </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterPill, activeFilter === item && styles.filterPillActive]}
                            onPress={() => setActiveFilter(item)}
                        >
                            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
                />
            </View>

            {/* Content List */}
            {loading ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <AnimatedNotificationItem 
                            item={item} 
                            index={index} 
                            onDelete={handleDelete}
                            onToggleRead={handleToggleRead}
                        />
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 20,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    filterContainer: {
        marginBottom: 10,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#161616',
        borderWidth: 1,
        borderColor: '#262626',
        marginRight: 10,
    },
    filterPillActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderColor: '#D4AF37',
    },
    filterText: {
        color: '#A0A0A0',
        fontSize: 13,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#D4AF37',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        flexGrow: 1,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(22, 22, 22, 0.8)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    notificationCardUnread: {
        backgroundColor: 'rgba(28, 28, 28, 0.95)',
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    unreadAccent: {
        position: 'absolute',
        left: 0,
        top: 16,
        bottom: 16,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#A0A0A0',
        flex: 1,
        marginRight: 10,
    },
    titleUnread: {
        color: '#fff',
        fontWeight: '700',
    },
    timeText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    message: {
        fontSize: 13,
        color: '#808080',
        lineHeight: 18,
        marginBottom: 8,
    },
    messageUnread: {
        color: '#D1D5DB',
    },
    badgeRow: {
        flexDirection: 'row',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '90%', // Align with card height
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        marginVertical: 'auto',
    },
    readAction: {
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '90%',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        marginVertical: 'auto',
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    skeletonContainer: {
        paddingHorizontal: 16,
    },
    skeletonCard: {
        flexDirection: 'row',
        backgroundColor: '#161616',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        opacity: 0.5,
    },
    skeletonIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#262626',
        marginRight: 14,
    },
    skeletonContent: {
        flex: 1,
        justifyContent: 'center',
    },
    skeletonTitle: {
        width: '60%',
        height: 14,
        backgroundColor: '#262626',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonMessage1: {
        width: '100%',
        height: 10,
        backgroundColor: '#262626',
        borderRadius: 4,
        marginBottom: 6,
    },
    skeletonMessage2: {
        width: '80%',
        height: 10,
        backgroundColor: '#262626',
        borderRadius: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        color: '#808080',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
