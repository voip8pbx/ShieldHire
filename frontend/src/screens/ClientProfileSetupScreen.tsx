import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { uploadImageToBlob } from '../services/uploadService';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
    navigation: StackNavigationProp<any>;
};

// Premium Theme Constants
const THEME = {
    background: '#070708',
    card: '#121214',
    cardBorder: 'rgba(255, 255, 255, 0.04)',
    gold: '#FFD700',
    goldLight: '#FFE34D',
    goldDark: '#CCAC00',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: '#4E4E52',
    success: '#34C759',
    error: '#FF3B30',
};

export default function ClientProfileSetupScreen({ navigation }: Props) {
    const { user, updateUser, logout } = useContext(AuthContext);
    const [name, setName] = useState(user?.name || '');
    const [contactNo, setContactNo] = useState(user?.contactNo || '');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
    const [location, setLocation] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
    const [docPhoto, setDocPhoto] = useState<string | null>(null);
    
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const backAction = () => {
            if (!navigation.canGoBack()) {
                return true; // handled, do nothing
            }
            return false; // let default behavior happen
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [navigation]);

    const handlePickImage = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 600,
                maxWidth: 600,
                quality: 0.8,
            },
            async (response) => {
                if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
                const asset = response.assets[0];
                if (!asset.uri || !asset.base64) return;

                setUploadingImage(true);
                try {
                    const dataUri = `data:${asset.type};base64,${asset.base64}`;
                    const uploadedUrl = await uploadImageToBlob(dataUri, `client-profile-${Date.now()}.jpg`, 'clients');
                    if (uploadedUrl) {
                        setProfilePhoto(uploadedUrl);
                    }
                } catch (e: any) {
                    Alert.alert('Upload Failed', 'Could not upload profile image.');
                } finally {
                    setUploadingImage(false);
                }
            }
        );
    };

    const handlePickDoc = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 1024,
                maxWidth: 1024,
                quality: 0.8,
            },
            async (response) => {
                if (response.didCancel || response.errorCode || !response.assets?.[0]) return;
                const asset = response.assets[0];
                if (!asset.uri || !asset.base64) return;

                setUploadingDoc(true);
                try {
                    const dataUri = `data:${asset.type};base64,${asset.base64}`;
                    const uploadedUrl = await uploadImageToBlob(dataUri, `client-doc-${Date.now()}.jpg`, 'clients');
                    if (uploadedUrl) {
                        setDocPhoto(uploadedUrl);
                    }
                } catch (e: any) {
                    Alert.alert('Upload Failed', 'Could not upload document image.');
                } finally {
                    setUploadingDoc(false);
                }
            }
        );
    };

    const handleSubmit = async () => {
        if (!name.trim() || !contactNo.trim() || !age.trim() || !gender || !location.trim()) {
            Alert.alert('Incomplete Form', 'Please fill in all the profile details to submit.');
            return;
        }

        if (contactNo.length < 10) {
            Alert.alert('Invalid Contact', 'Please enter a valid 10-digit contact number.');
            return;
        }

        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
            Alert.alert('Invalid Age', 'You must be at least 18 years old to use ShieldHire.');
            return;
        }

        if (!docPhoto) {
            Alert.alert('ID Required', 'Please upload a Government ID / Identity Document for verification.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.put('/user/profile', {
                name,
                contactNo,
                profilePhoto,
                age: ageNum,
                gender,
                location,
                govtIdPhoto: docPhoto,
            });

            if (response.data && response.data.user) {
                updateUser(response.data.user);
            }
        } catch (error: any) {
            console.error('Submit Profile Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to submit profile details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
            
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {navigation.canGoBack() && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.headerTitle}>Complete Client Profile</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color={THEME.error} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Welcome Header */}
                    <View style={styles.introContainer}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="person-add-outline" size={32} color={THEME.gold} />
                        </View>
                        <Text style={styles.introTitle}>Profile Registration</Text>
                        <Text style={styles.introSubtitle}>Submit your basic information to enable bouncer booking services.</Text>
                    </View>

                    {/* Image Selector */}
                    <View style={styles.avatarCard}>
                        <TouchableOpacity onPress={handlePickImage} disabled={uploadingImage} style={styles.avatarTouchable}>
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera-outline" size={36} color={THEME.textMuted} />
                                    <Text style={styles.placeholderText}>Add Photo</Text>
                                </View>
                            )}
                            {uploadingImage && (
                                <View style={styles.imageLoadingOverlay}>
                                    <ActivityIndicator size="small" color={THEME.gold} />
                                </View>
                            )}
                            <View style={styles.editIconBadge}>
                                <Ionicons name="camera" size={14} color="#000" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formCard}>
                        <Text style={styles.sectionLabel}>Basic Information</Text>

                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name or Business Name"
                                placeholderTextColor={THEME.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Contact No */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Contact Number (10 digits)"
                                placeholderTextColor={THEME.textMuted}
                                value={contactNo}
                                onChangeText={setContactNo}
                                keyboardType="phone-pad"
                                maxLength={15}
                            />
                        </View>

                        {/* Age */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="calendar-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Age (Must be 18+)"
                                placeholderTextColor={THEME.textMuted}
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>

                        {/* Location */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="location-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Current Location / City"
                                placeholderTextColor={THEME.textMuted}
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>

                        {/* Gender Selector */}
                        <Text style={[styles.sectionLabel, { marginTop: 15 }]}>Gender Selection</Text>
                        <View style={styles.genderRow}>
                            {['Male', 'Female', 'Other'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderButton,
                                        gender === g && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender(g as any)}
                                >
                                    <Text style={[
                                        styles.genderText,
                                        gender === g && styles.genderTextActive
                                    ]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Document Upload Card */}
                    <View style={styles.formCard}>
                        <Text style={styles.sectionLabel}>Government ID / Identity Verification</Text>
                        <Text style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 12 }}>
                            Upload Aadhaar, Passport, or Government Photo ID for admin verification.
                        </Text>
                        <TouchableOpacity 
                            onPress={handlePickDoc} 
                            disabled={uploadingDoc}
                            style={{
                                height: 120,
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderWidth: 1.5,
                                borderColor: docPhoto ? THEME.gold : THEME.cardBorder,
                                borderStyle: 'dashed',
                                borderRadius: 12,
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {docPhoto ? (
                                <Image source={{ uri: docPhoto }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="document-text-outline" size={32} color={THEME.gold} />
                                    <Text style={{ color: THEME.textSecondary, marginTop: 6, fontSize: 13 }}>
                                        {uploadingDoc ? 'Uploading document...' : 'Tap to Upload Identity Document'}
                                    </Text>
                                </View>
                            )}
                            {uploadingDoc && (
                                <View style={styles.imageLoadingOverlay}>
                                    <ActivityIndicator size="small" color={THEME.gold} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Notice */}
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={22} color={THEME.gold} style={{ marginRight: 10 }} />
                        <Text style={styles.infoText}>All submitted profile details are subject to admin approval for platform security purposes.</Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.submitButtonText}>SUBMIT PROFILE FOR REVIEW</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
        backgroundColor: THEME.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.textPrimary,
    },
    logoutBtn: {
        padding: 5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    introTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.textPrimary,
        marginBottom: 6,
    },
    introSubtitle: {
        fontSize: 14,
        color: THEME.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    avatarCard: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarTouchable: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: THEME.gold,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.card,
        position: 'relative',
    },
    avatarImage: {
        width: 106,
        height: 106,
        borderRadius: 53,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: THEME.textMuted,
        fontSize: 12,
        marginTop: 6,
    },
    imageLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: THEME.gold,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: THEME.background,
    },
    formCard: {
        backgroundColor: THEME.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: THEME.gold,
        marginBottom: 14,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 14,
        height: 54,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: THEME.textPrimary,
        fontSize: 15,
    },
    genderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    genderButtonActive: {
        backgroundColor: THEME.gold,
        borderColor: THEME.gold,
    },
    genderText: {
        color: THEME.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    genderTextActive: {
        color: '#000000',
        fontWeight: 'bold',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 215, 0, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.06)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoText: {
        color: THEME.textSecondary,
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    submitButton: {
        backgroundColor: THEME.gold,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
