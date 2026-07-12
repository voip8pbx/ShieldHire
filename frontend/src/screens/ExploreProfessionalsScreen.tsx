import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Dimensions,
    SafeAreaView,
    Platform,
    StatusBar,
    Animated,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, Bouncer } from '../types';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'ExploreProfessionals'>;

type Props = {
    navigation: NavigationProp;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const THEME = {
    bgPrimary: '#090909',
    bgSecondary: '#121212',
    card: '#1A1A1A',
    gold: '#FFD700',
    goldDark: '#FFC107',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: 'rgba(255, 255, 255, 0.08)',
    glass: 'rgba(255, 255, 255, 0.03)',
};

// --- COMPONENTS ---

const FilterPill = React.memo(({ item, isActive, onPress }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
        <TouchableOpacity activeOpacity={0.9} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={() => onPress(item)}>
            <Animated.View style={[
                styles.filterPill,
                isActive && styles.activePill,
                { transform: [{ scale: scaleAnim }] }
            ]}>
                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>{item}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

const GridCard = React.memo(({ item, onPress }: { item: Bouncer, onPress: () => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

    const isAvailable = item.isAvailable;
    const roleText = item.isGunman ? 'Gunman' : 'Bouncer';

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[styles.gridCard, { transform: [{ scale }] }]}>
                <View style={styles.gridImageContainer}>
                    <Image source={{ uri: item.profilePhoto || `https://i.pravatar.cc/300?u=${item.id}` }} style={styles.fullImage} />
                    <View style={styles.statusBadgeWrapper}>
                        <View style={styles.blurBadge}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#4ade80' : '#f87171' }]} />
                            <Text style={styles.statusText}>{isAvailable ? 'Available' : 'Busy'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.gridContent}>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{roleText.toUpperCase()}</Text>
                        {item.rating >= 4.9 && <MaterialCommunityIcons name="check-decagram" size={12} color={THEME.gold} style={{ marginLeft: 6 }} />}
                    </View>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={12} color={THEME.gold} />
                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.expText}>• {item.experience || 0} Yrs Exp</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <View>
                            <Text style={styles.price}>₹{item.isGunman ? 3500 : 2000}<Text style={styles.perHr}>/shift</Text></Text>
                        </View>
                        <View style={styles.bookBtnSmall}>
                            <Text style={styles.bookBtnTextSmall}>Book</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
});

const ListCard = React.memo(({ item, onPress }: { item: Bouncer, onPress: () => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

    const roleText = item.isGunman ? 'Gunman' : 'Bouncer';

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[styles.listRow, { transform: [{ scale }] }]}>
                <Image source={{ uri: item.profilePhoto || `https://i.pravatar.cc/300?u=${item.id}` }} style={styles.listImage} />
                <View style={styles.listContent}>
                    <View style={styles.listHeaderRow}>
                        <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
                        {item.rating >= 4.9 && <MaterialCommunityIcons name="check-decagram" size={14} color={THEME.gold} style={{ marginLeft: 6 }} />}
                    </View>
                    <Text style={styles.listRole}>{roleText}</Text>
                    <View style={styles.listStatsRow}>
                        <Ionicons name="star" size={12} color={THEME.gold} />
                        <Text style={styles.listRating}>{item.rating.toFixed(1)}</Text>
                        <Text style={styles.listDot}>•</Text>
                        <Text style={styles.listExp}>{item.experience || 0} Yrs Exp</Text>
                    </View>
                    <View style={styles.listPriceRow}>
                        <Text style={styles.listPrice}>₹{item.isGunman ? 3500 : 2000} <Text style={styles.listPerHr}>/shift</Text></Text>
                        <View style={styles.listBookBtn}>
                            <Text style={styles.listBookBtnText}>Book Now</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
});

const SkeletonGridCard = () => {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
        <View style={styles.gridCard}>
            <Animated.View style={[styles.skeletonImage, { opacity }]} />
            <View style={styles.gridContent}>
                <Animated.View style={[styles.skeletonText, { width: 60, opacity }]} />
                <Animated.View style={[styles.skeletonText, { width: 100, height: 16, marginTop: 10, opacity }]} />
                <Animated.View style={[styles.skeletonText, { width: '100%', height: 30, marginTop: 15, borderRadius: 8, opacity }]} />
            </View>
        </View>
    );
};

const SkeletonListCard = () => {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);
    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
        <View style={styles.listRow}>
            <Animated.View style={[styles.skeletonListImage, { opacity }]} />
            <View style={[styles.listContent, { justifyContent: 'center' }]}>
                <Animated.View style={[styles.skeletonText, { width: 120, height: 16, marginBottom: 10, opacity }]} />
                <Animated.View style={[styles.skeletonText, { width: 80, marginBottom: 10, opacity }]} />
                <Animated.View style={[styles.skeletonText, { width: '100%', height: 24, borderRadius: 6, opacity }]} />
            </View>
        </View>
    );
};

const FeaturedCard = React.memo(({ item, onPress }: { item: Bouncer, onPress: () => void }) => {
    if (!item) return null;
    return (
        <View style={styles.featuredContainer}>
            <Text style={styles.featuredSectionTitle}>Featured Professional</Text>
            <View style={styles.featuredCard}>
                <Image source={{ uri: item.profilePhoto || `https://i.pravatar.cc/300?u=${item.id}` }} style={styles.featuredImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000']} style={styles.fullOverlay} />
                <View style={styles.featuredTopBadges}>
                    <BlurView blurType="dark" blurAmount={10} style={styles.featuredBadge}>
                        <MaterialCommunityIcons name="star-shooting" size={16} color={THEME.gold} />
                        <Text style={styles.featuredBadgeText}>Top Choice</Text>
                    </BlurView>
                </View>
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredName}>{item.name}</Text>
                    <Text style={styles.featuredRole}>{item.isGunman ? 'Elite Gunman' : 'Premium Bouncer'} • {item.experience} Yrs Exp</Text>
                    <TouchableOpacity style={styles.featuredBtn} onPress={onPress}>
                        <Text style={styles.featuredBtnText}>Book</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

export default function ExploreProfessionalsScreen({ navigation }: Props) {
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const sortBackdropAnim = useRef(new Animated.Value(0)).current;

    const [isAdvFilterOpen, setIsAdvFilterOpen] = useState(false);
    const advFilterAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const advFilterBackdropAnim = useRef(new Animated.Value(0)).current;

    const searchFocus = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchData();
    }, [search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get<Bouncer[]>('/api/bouncers', { params: { search } });
            setBouncers(res.data || []);
        } catch (e) {
            setBouncers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSort = (open: boolean) => {
        if (open) {
            setIsSortOpen(true);
            Animated.parallel([
                Animated.spring(sortAnim, { toValue: 0, useNativeDriver: true }),
                Animated.timing(sortBackdropAnim, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(sortAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
                Animated.timing(sortBackdropAnim, { toValue: 0, duration: 200, useNativeDriver: true })
            ]).start(() => setIsSortOpen(false));
        }
    };

    const toggleAdvFilter = (open: boolean) => {
        if (open) {
            setIsAdvFilterOpen(true);
            Animated.parallel([
                Animated.spring(advFilterAnim, { toValue: 0, useNativeDriver: true }),
                Animated.timing(advFilterBackdropAnim, { toValue: 1, duration: 200, useNativeDriver: true })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(advFilterAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
                Animated.timing(advFilterBackdropAnim, { toValue: 0, duration: 200, useNativeDriver: true })
            ]).start(() => setIsAdvFilterOpen(false));
        }
    };

    const onSearchFocus = () => Animated.timing(searchFocus, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    const onSearchBlur = () => Animated.timing(searchFocus, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    const searchBorderColor = searchFocus.interpolate({ inputRange: [0, 1], outputRange: [THEME.border, THEME.gold] });

    const filteredBouncers = React.useMemo(() => {
        return bouncers.filter(t => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Available') return t.isAvailable;
            if (activeFilter === 'Bouncer') return !t.isGunman;
            if (activeFilter === 'Gunman') return t.isGunman;
            if (activeFilter === 'VIP') return t.rating >= 4.9;
            if (activeFilter === 'Top Rated') return t.rating >= 4.8;
            if (activeFilter === 'Verified') return true;
            return true;
        });
    }, [bouncers, activeFilter]);

    const featuredBouncer = React.useMemo(() => {
        return filteredBouncers.length > 0 ? filteredBouncers[0] : null;
    }, [filteredBouncers]);

    const remainingBouncers = React.useMemo(() => {
        return filteredBouncers.length > 1 ? filteredBouncers.slice(1) : [];
    }, [filteredBouncers]);

    const handleBouncerPress = React.useCallback((id: string) => {
        navigation.navigate('BouncerDetail', { bouncerId: id });
    }, [navigation]);

    const headerComponent = React.useMemo(() => (
        <View style={{ paddingBottom: 15 }}>
            <LinearGradient colors={['#1a1a1a', THEME.bgPrimary]} style={styles.heroSection}>
                <View style={styles.topRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerTitle}>Explore Professionals</Text>
                        <Text style={styles.headerSubtitle}>Find trusted security experts</Text>
                    </View>
                    <View style={styles.viewToggleBox}>
                        <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.viewIconBtn, viewMode === 'grid' && styles.viewIconActive]}>
                            <Ionicons name="grid" size={18} color={viewMode === 'grid' ? THEME.gold : THEME.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.viewIconBtn, viewMode === 'list' && styles.viewIconActive]}>
                            <Ionicons name="list" size={18} color={viewMode === 'list' ? THEME.gold : THEME.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <Animated.View style={[styles.searchContainer, { borderColor: searchBorderColor }]}>
                <Ionicons name="search" size={20} color={THEME.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, role or experience"
                    value={search}
                    onChangeText={setSearch}
                    onFocus={onSearchFocus}
                    onBlur={onSearchBlur}
                    placeholderTextColor={THEME.textSecondary}
                />
                <TouchableOpacity>
                    <Ionicons name="mic-outline" size={22} color={THEME.textSecondary} />
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {['All', 'Available', 'Bouncer', 'Gunman', 'VIP', 'Top Rated', 'Verified'].map((item) => (
                        <FilterPill key={item} item={item} isActive={activeFilter === item} onPress={setActiveFilter} />
                    ))}
                </ScrollView>
            </View>

            <View style={styles.resultsRow}>
                <Text style={styles.resultCount}>{loading ? '...' : filteredBouncers.length} Professionals Found</Text>
                <TouchableOpacity style={styles.sortBtn} onPress={() => toggleSort(true)}>
                    <MaterialCommunityIcons name="sort-variant" size={16} color={THEME.textPrimary} style={{ marginRight: 4 }} />
                    <Text style={styles.sortBtnText}>Sort</Text>
                </TouchableOpacity>
            </View>

            {!loading && featuredBouncer && <FeaturedCard item={featuredBouncer} onPress={() => handleBouncerPress(featuredBouncer.id)} />}
        </View>
    ), [navigation, viewMode, search, activeFilter, loading, filteredBouncers.length, featuredBouncer, searchBorderColor]);

    const emptyComponent = React.useMemo(() => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-search" size={64} color={THEME.textSecondary} />
            <Text style={styles.emptyTitle}>No Professionals Found</Text>
            <Text style={styles.emptyText}>Try changing your filters or search terms.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setSearch(''); setActiveFilter('All'); }}>
                <Text style={styles.retryText}>Clear All Filters</Text>
            </TouchableOpacity>
        </View>
    ), []);

    const renderSortSheet = () => {
        if (!isSortOpen) return null;
        return (
            <View style={styles.sheetOverlay} pointerEvents="box-none">
                <Animated.View style={[styles.sheetBackdrop, { opacity: sortBackdropAnim }]}>
                    <TouchableOpacity style={styles.fullScreenBtn} onPress={() => toggleSort(false)} />
                </Animated.View>
                <Animated.View style={[styles.sheetContent, { transform: [{ translateY: sortAnim }] }]}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Sort By</Text>
                    {['Recommended', 'Highest Rating', 'Nearest', 'Lowest Price', 'Highest Experience', 'Available Now'].map((opt, idx) => (
                        <TouchableOpacity key={idx} style={styles.sheetOption} onPress={() => toggleSort(false)}>
                            <Text style={styles.sheetOptionText}>{opt}</Text>
                            {idx === 0 && <Ionicons name="checkmark" size={20} color={THEME.gold} />}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            </View>
        );
    };

    const renderAdvFilterSheet = () => {
        if (!isAdvFilterOpen) return null;
        return (
            <View style={styles.sheetOverlay} pointerEvents="box-none">
                <Animated.View style={[styles.sheetBackdrop, { opacity: advFilterBackdropAnim }]}>
                    <TouchableOpacity style={styles.fullScreenBtn} onPress={() => toggleAdvFilter(false)} />
                </Animated.View>
                <Animated.View style={[styles.sheetContent, { transform: [{ translateY: advFilterAnim }] }]}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Advanced Filters</Text>
                    <Text style={styles.sheetSubtitle}>Experience Range</Text>
                    {/* Dummy sliders for visual */}
                    <View style={styles.dummySliderBox}>
                        <View style={styles.dummySliderTrack}>
                            <View style={[styles.dummySliderFill, { width: '60%' }]} />
                            <View style={[styles.dummySliderThumb, { left: '60%' }]} />
                        </View>
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabelText}>0 Yrs</Text>
                            <Text style={styles.sliderLabelText}>10+ Yrs</Text>
                        </View>
                    </View>

                    <Text style={styles.sheetSubtitle}>Price Range</Text>
                    <View style={styles.dummySliderBox}>
                        <View style={styles.dummySliderTrack}>
                            <View style={[styles.dummySliderFill, { width: '40%', left: '20%' }]} />
                            <View style={[styles.dummySliderThumb, { left: '20%' }]} />
                            <View style={[styles.dummySliderThumb, { left: '60%' }]} />
                        </View>
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabelText}>₹1000</Text>
                            <Text style={styles.sliderLabelText}>₹5000+</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.applyFiltersBtn} onPress={() => toggleAdvFilter(false)}>
                        <Text style={styles.applyFiltersText}>Apply Filters</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <View style={styles.mainContainer}>

                <FlatList
                    key={viewMode} // Force re-render on toggle
                    data={loading ? ([1, 2, 3, 4, 5, 6] as any) : remainingBouncers}
                    renderItem={({ item }) => {
                        if (loading) return viewMode === 'grid' ? <SkeletonGridCard /> : <SkeletonListCard />;
                        if (viewMode === 'grid') {
                            return <GridCard item={item as Bouncer} onPress={() => handleBouncerPress((item as Bouncer).id)} />;
                        } else {
                            return <ListCard item={item as Bouncer} onPress={() => handleBouncerPress((item as Bouncer).id)} />;
                        }
                    }}
                    keyExtractor={(item, index) => loading ? `loading-${index}` : (item as Bouncer).id}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={headerComponent}
                    ListEmptyComponent={!loading ? emptyComponent : null}
                    initialNumToRender={6}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                />

                <TouchableOpacity style={styles.fabBtn} onPress={() => toggleAdvFilter(true)}>
                    <BlurView blurType="dark" blurAmount={10} style={styles.fabBlur}>
                        <Ionicons name="options" size={24} color={THEME.gold} />
                    </BlurView>
                </TouchableOpacity>

                {renderSortSheet()}
                {renderAdvFilterSheet()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    // ─── LAYOUT ─────────────────────────────────────────────────────────────────
    safeArea: {
        flex: 1,
        backgroundColor: THEME.bgPrimary,
    },
    mainContainer: {
        flex: 1,
        backgroundColor: THEME.bgPrimary,
    },

    // ─── HERO HEADER ────────────────────────────────────────────────────────────
    heroSection: {
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingHorizontal: 20,
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME.border,
    },
    headerTitleBox: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: THEME.textPrimary,
    },
    headerSubtitle: {
        fontSize: 11,
        color: THEME.textSecondary,
        marginTop: 2,
    },
    viewToggleBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    viewIconBtn: {
        padding: 6,
        borderRadius: 16,
    },
    viewIconActive: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },

    // ─── SEARCH BAR ─────────────────────────────────────────────────────────────
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        borderRadius: 22,
        paddingHorizontal: 18,
        height: 56,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: THEME.textPrimary,
        height: '100%',
    },

    // ─── FILTER PILLS ───────────────────────────────────────────────────────────
    filterRow: {
        marginBottom: 20,
    },
    filterPill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: THEME.card,
        marginRight: 10,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    activePill: {
        backgroundColor: THEME.gold,
        borderColor: THEME.gold,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: THEME.textSecondary,
    },
    activeFilterText: {
        color: '#000',
    },

    // ─── RESULTS ROW ────────────────────────────────────────────────────────────
    resultsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    resultCount: {
        fontSize: 13,
        color: THEME.textSecondary,
        fontWeight: '600',
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    sortBtnText: {
        fontSize: 12,
        color: THEME.textPrimary,
        fontWeight: '600',
    },

    // ─── FEATURED CARD ──────────────────────────────────────────────────────────
    featuredContainer: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    featuredSectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 12,
    },
    featuredCard: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.border,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    fullOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    featuredTopBadges: {
        position: 'absolute',
        top: 16,
        left: 16,
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    featuredBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: THEME.gold,
        marginLeft: 6,
    },
    featuredContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    featuredName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    featuredRole: {
        fontSize: 13,
        color: '#ccc',
        marginBottom: 16,
    },
    featuredBtn: {
        backgroundColor: THEME.gold,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    featuredBtnText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
    },

    // ─── LIST CONTENT ────────────────────────────────────────────────────────────
    flatListContent: {
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },

    // ─── GRID CARD ──────────────────────────────────────────────────────────────
    gridCard: {
        width: CARD_WIDTH,
        backgroundColor: THEME.card,
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.border,
    },
    gridImageContainer: {
        height: 160,
        width: '100%',
        backgroundColor: THEME.bgSecondary,
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    statusBadgeWrapper: {
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    blurBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'transparent',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    gridContent: {
        padding: 14,
    },
    roleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    roleText: {
        color: THEME.gold,
        fontSize: 9,
        fontWeight: '800',
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginBottom: 6,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 6,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: THEME.textPrimary,
        marginLeft: 4,
    },
    expText: {
        fontSize: 10,
        color: THEME.textSecondary,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: THEME.border,
    },
    price: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.textPrimary,
    },
    perHr: {
        fontSize: 9,
        color: THEME.textSecondary,
    },
    bookBtnSmall: {
        backgroundColor: THEME.gold,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    bookBtnTextSmall: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700',
    },

    // ─── LIST ROW ────────────────────────────────────────────────────────────────
    listRow: {
        flexDirection: 'row',
        backgroundColor: THEME.card,
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    listImage: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: THEME.bgSecondary,
    },
    listContent: {
        flex: 1,
        marginLeft: 16,
    },
    listHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listName: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME.textPrimary,
        flex: 1,
    },
    listRole: {
        fontSize: 12,
        color: THEME.gold,
        fontWeight: '600',
        marginTop: 2,
    },
    listStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    listRating: {
        fontSize: 12,
        color: THEME.textPrimary,
        fontWeight: '600',
        marginLeft: 4,
    },
    listDot: {
        color: THEME.textSecondary,
        marginHorizontal: 6,
        fontSize: 10,
    },
    listExp: {
        fontSize: 11,
        color: THEME.textSecondary,
    },
    listPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    listPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.textPrimary,
    },
    listPerHr: {
        fontSize: 11,
        color: THEME.textSecondary,
        fontWeight: '400',
    },
    listBookBtn: {
        backgroundColor: THEME.gold,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    listBookBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 11,
    },

    // ─── SKELETON LOADERS ────────────────────────────────────────────────────────
    skeletonImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#2A2A2A',
    },
    skeletonListImage: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#2A2A2A',
    },
    skeletonText: {
        height: 12,
        backgroundColor: '#2A2A2A',
        borderRadius: 4,
    },

    // ─── EMPTY STATE ─────────────────────────────────────────────────────────────
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME.textPrimary,
        marginTop: 15,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: THEME.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    retryBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.gold,
    },
    retryText: {
        color: THEME.gold,
        fontWeight: '600',
    },

    // ─── FLOATING ACTION BUTTON ──────────────────────────────────────────────────
    fabBtn: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 10,
    },
    fabBlur: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: THEME.border,
        borderRadius: 30,
    },

    // ─── BOTTOM SHEETS ───────────────────────────────────────────────────────────
    sheetOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 100,
    },
    sheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    fullScreenBtn: {
        flex: 1,
    },
    sheetContent: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingBottom: 50,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: THEME.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 25,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: 20,
    },
    sheetOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    sheetOptionText: {
        fontSize: 15,
        color: THEME.textPrimary,
        fontWeight: '500',
    },

    // ─── ADVANCED FILTERS ────────────────────────────────────────────────────────
    sheetSubtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: THEME.textSecondary,
        marginTop: 10,
        marginBottom: 15,
    },
    dummySliderBox: {
        marginBottom: 25,
    },
    dummySliderTrack: {
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        position: 'relative',
    },
    dummySliderFill: {
        position: 'absolute',
        height: '100%',
        backgroundColor: THEME.gold,
        borderRadius: 2,
    },
    dummySliderThumb: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        top: -8,
        marginLeft: -10,
        borderWidth: 2,
        borderColor: THEME.gold,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    sliderLabelText: {
        fontSize: 11,
        color: THEME.textSecondary,
    },
    applyFiltersBtn: {
        backgroundColor: THEME.gold,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: 20,
    },
    applyFiltersText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '800',
    },
});
