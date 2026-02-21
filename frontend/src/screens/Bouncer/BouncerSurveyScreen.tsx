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
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';

type Props = {
    navigation: StackNavigationProp<any>;
};

const STEPS = ['Info', 'Bio', 'Skills', 'Photos'];
const { width } = Dimensions.get('window');

export default function BouncerSurveyScreen({ navigation }: Props) {
    const { user, updateUser } = useContext(AuthContext);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Basic Info & Form Data Combined
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editAge, setEditAge] = useState(user?.bouncerProfile?.age?.toString() || '');
    const [editGender, setEditGender] = useState(user?.bouncerProfile?.gender || '');

    const [bio, setBio] = useState(user?.bouncerProfile?.bio || '');
    const [skills, setSkills] = useState<string[]>(user?.bouncerProfile?.skills || []);
    const [experience, setExperience] = useState(user?.bouncerProfile?.experience?.toString() || '');
    const [galleryImages, setGalleryImages] = useState<string[]>(user?.bouncerProfile?.gallery || []);
    const [isGunman, setIsGunman] = useState(user?.bouncerProfile?.isGunman || false);
    const [registrationType, setRegistrationType] = useState(user?.bouncerProfile?.registrationType || 'Individual');

    // Skill Input
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            console.log('[Survey] Fetching profile...');
            try {
                const response = await api.get('/user/profile');
                if (response.data) {
                    const freshUser = response.data;
                    console.log('[Survey] Fetched profile:', freshUser.bouncerProfile ? 'Profile found' : 'No profile');
                    updateUser(freshUser);

                    setEditName(freshUser.name || '');
                    // Sync local state if profile exists
                    if (freshUser.bouncerProfile) {
                        const bp = freshUser.bouncerProfile;
                        setBio(bp.bio || '');
                        setSkills(bp.skills || []);
                        setExperience(bp.experience?.toString() || '');
                        setGalleryImages(bp.gallery || []);
                        setEditAge(bp.age?.toString() || '');
                        setEditGender(bp.gender || '');
                        setIsGunman(bp.isGunman || false);
                        setRegistrationType(bp.registrationType || 'Individual');
                    }
                }
            } catch (e: any) {
                console.error("[Survey] Failed to fetch profile:", e.message);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (user) {
            if (!editName && user.name) setEditName(user.name);

            if (user.bouncerProfile) {
                console.log('[Survey] Syncing from user context');
                const bp = user.bouncerProfile;
                // Only update if current state is empty to avoid overwriting user edits
                if (!bio && bp.bio) setBio(bp.bio);
                if (skills.length === 0 && bp.skills) setSkills(bp.skills);
                if (!experience && bp.experience) setExperience(bp.experience.toString());
                if (galleryImages.length === 0 && bp.gallery) setGalleryImages(bp.gallery);

                if (!editAge && bp.age) setEditAge(bp.age.toString());
                if (!editGender && bp.gender) setEditGender(bp.gender);

                // Keep boolean/enum types synced
                setIsGunman(bp.isGunman);
                setRegistrationType(bp.registrationType);
            }
        }
    }, [user]);

    const calculateProgress = () => {
        let filled = 0;
        const total = 6;

        if (user?.name || editName) filled += 1;
        if (editAge || user?.bouncerProfile?.age) filled += 1;
        if (bio.length > 30) filled += 1;
        if (skills.length > 2) filled += 1;
        if (experience) filled += 1;
        if (galleryImages.length > 0) filled += 1;

        return Math.floor((filled / total) * 100);
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const pickImage = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                includeBase64: true,
                maxHeight: 800,
                maxWidth: 800,
                quality: 0.8,
                selectionLimit: 4 - galleryImages.length,
            },
            (response: ImagePickerResponse) => {
                if (response.didCancel) return;
                if (response.errorCode) {
                    Alert.alert('Error', response.errorMessage || 'Failed to pick image');
                    return;
                }

                if (response.assets) {
                    const newImages = response.assets
                        .filter(asset => asset.base64)
                        .map(asset => `data:${asset.type};base64,${asset.base64}`);

                    if (galleryImages.length + newImages.length > 4) {
                        Alert.alert('Limit Reached', 'You can upload up to 4 images.');
                        return;
                    }
                    setGalleryImages([...galleryImages, ...newImages]);
                }
            }
        );
    };

    const removeImage = (index: number) => {
        const updated = [...galleryImages];
        updated.splice(index, 1);
        setGalleryImages(updated);
    };

    const handleNext = async () => {
        // Automatically save progress when moving to next step
        const success = await saveProfile(true);
        if (success && currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const saveProfile = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await api.put('/user/profile', {
                name: editName,
                bouncerProfile: {
                    age: parseInt(editAge) || user?.bouncerProfile?.age || 0,
                    gender: editGender || user?.bouncerProfile?.gender || '',
                    registrationType: registrationType,
                    isGunman: isGunman,
                    bio,
                    skills,
                    experience: parseInt(experience) || 0,
                    gallery: galleryImages,
                }
            });

            if (response.data && response.data.user) {
                updateUser(response.data.user);
                if (!silent) {
                    Alert.alert('Success', 'Profile updated successfully!', [
                        {
                            text: 'OK', onPress: () => {
                                if (currentStep === STEPS.length - 1) navigation.goBack();
                            }
                        }
                    ]);
                }
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Save Profile Error', error);
            if (!silent) Alert.alert('Error', 'Failed to save changes.');
            return false;
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSaveBasicInfo = async () => {
        const success = await saveProfile();
        if (success) setIsEditingInfo(false);
    };

    const handleSubmit = async () => {
        await saveProfile();
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Info
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Review Your Details</Text>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoRow, isEditingInfo && styles.editRow]}>
                                <Text style={styles.label}>Full Name</Text>
                                {isEditingInfo ? (
                                    <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor="#666" />
                                ) : (
                                    <Text style={styles.value}>{user?.name}</Text>
                                )}
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Email Address</Text>
                                <Text style={styles.value}>{user?.email}</Text>
                            </View>
                            <View style={[styles.infoRow, isEditingInfo && styles.editRow]}>
                                <Text style={styles.label}>Age</Text>
                                {isEditingInfo ? (
                                    <TextInput style={styles.editInput} value={editAge} onChangeText={setEditAge} keyboardType="numeric" placeholder="Age" placeholderTextColor="#666" />
                                ) : (
                                    <Text style={styles.value}>{user?.bouncerProfile?.age ?? 'N/A'}</Text>
                                )}
                            </View>
                            <View style={[styles.infoRow, isEditingInfo && styles.editRow]}>
                                <Text style={styles.label}>Gender</Text>
                                {isEditingInfo ? (
                                    <TextInput style={styles.editInput} value={editGender} onChangeText={setEditGender} placeholder="Gender" placeholderTextColor="#666" />
                                ) : (
                                    <Text style={styles.value}>{user?.bouncerProfile?.gender ?? 'N/A'}</Text>
                                )}
                            </View>

                            <View style={[styles.infoRow, isEditingInfo && styles.editRow]}>
                                <Text style={styles.label}>Registration</Text>
                                {isEditingInfo ? (
                                    <View style={styles.typeToggle}>
                                        <TouchableOpacity
                                            style={[styles.toggleBtn, registrationType === 'Individual' && styles.toggleBtnActive]}
                                            onPress={() => setRegistrationType('Individual')}
                                        >
                                            <Text style={[styles.toggleBtnText, registrationType === 'Individual' && styles.toggleBtnTextActive]}>Indiv.</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.toggleBtn, registrationType === 'Agency' && styles.toggleBtnActive]}
                                            onPress={() => setRegistrationType('Agency')}
                                        >
                                            <Text style={[styles.toggleBtnText, registrationType === 'Agency' && styles.toggleBtnTextActive]}>Agency</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={styles.value}>{user?.bouncerProfile?.registrationType ?? 'Individual'}</Text>
                                )}
                            </View>

                            <View style={[styles.infoRow, { borderBottomWidth: 0, marginTop: 10 }]}>
                                <Text style={styles.label}>Gunman Service</Text>
                                <TouchableOpacity
                                    onPress={() => setIsGunman(!isGunman)}
                                    style={[styles.checkbox, isGunman && styles.checkboxActive]}
                                >
                                    <Ionicons name={isGunman ? "shield-checkmark" : "square-outline"} size={20} color={isGunman ? "#000" : "#FFD700"} />
                                    <Text style={[styles.checkboxText, isGunman && styles.checkboxTextActive]}>
                                        {isGunman ? "ENABLED" : "DISABLED"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.editDetailsBtn, isEditingInfo && styles.saveDetailsBtn]}
                            onPress={() => isEditingInfo ? handleSaveBasicInfo() : setIsEditingInfo(true)}
                            disabled={loading}
                        >
                            <Text style={[styles.editDetailsBtnText, isEditingInfo && styles.saveDetailsBtnText]}>
                                {loading ? "Updating..." : isEditingInfo ? "Save Changes" : "Edit Basic Info"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            case 1: // Bio
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Professional Bio</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Tell clients about your experience, approach to security, and why they should hire you..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={6}
                            value={bio}
                            onChangeText={setBio}
                        />
                    </View>
                );
            case 2: // Skills & Exp
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Skills & Experience</Text>

                        <Text style={styles.label}>Years of Experience</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 5"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={experience}
                            onChangeText={setExperience}
                        />

                        <Text style={[styles.label, { marginTop: 16 }]}>Tactical Skills</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 10 }]}
                                placeholder="Add skill (e.g. Judo)"
                                placeholderTextColor="#666"
                                value={newSkill}
                                onChangeText={setNewSkill}
                                onSubmitEditing={handleAddSkill}
                            />
                            <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
                                <Ionicons name="add" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.skillsContainer}>
                            {skills.map((skill, index) => (
                                <TouchableOpacity key={index} style={styles.skillChip} onPress={() => removeSkill(skill)}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                    <Ionicons name="close-circle" size={16} color="#000" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 3: // Photos
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Gallery (Max 4)</Text>
                        <Text style={styles.subText}>Upload photos of yourself in uniform or during training to build trust with clients.</Text>

                        <View style={styles.galleryGrid}>
                            {galleryImages.map((img, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri: img }} style={styles.galleryImage} />
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                                        <Ionicons name="close" size={14} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {galleryImages.length < 4 && (
                                <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                                    <View style={styles.uploadPulse}>
                                        <Ionicons name="camera-outline" size={32} color="#FFD700" />
                                    </View>
                                    <Text style={styles.uploadText}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {galleryImages.length === 0 && (
                            <View style={styles.emptyPhotosHint}>
                                <Ionicons name="information-circle-outline" size={20} color="#666" />
                                <Text style={styles.emptyHintText}>Adding photos increases your hiring chances by 3x.</Text>
                            </View>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name={currentStep === 0 ? "close" : "arrow-back"} size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Complete Profile</Text>

                {/* Floating Save Button Visibility - only on last step or if valid */}
                {currentStep === STEPS.length - 1 ? (
                    <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                        <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Save</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 30 }} />}
            </View>

            {/* Profile Summary & Progress */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarProgressWrapper}>
                    <View style={styles.progressBorder}>
                        {/* Simple visual border - in real app use SVG for percentage arc */}
                    </View>
                    <Image
                        source={{ uri: user?.profilePhoto || user?.bouncerProfile?.profilePhoto || 'https://i.pravatar.cc/150' }}
                        style={styles.avatar}
                    />
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>{Math.round(calculateProgress())}%</Text>
                    </View>
                </View>
                <Text style={styles.profileName}>{user?.name || 'Bouncer'}</Text>
            </View>

            {/* Steps Navigation Bar */}
            <View style={styles.stepsBar}>
                {STEPS.map((step, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.stepTab, currentStep === index && styles.activeStepTab]}
                        onPress={async () => {
                            const success = await saveProfile(true);
                            if (success) setCurrentStep(index);
                        }}
                    >
                        <Text style={[styles.stepText, currentStep === index && styles.activeStepText]}>{step}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Area */}
            <ScrollView contentContainerStyle={styles.content}>
                {renderStepContent()}
            </ScrollView>

            {/* Footer Navigation */}
            <View style={styles.footer}>
                {currentStep < STEPS.length - 1 ? (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextText}>Next</Text>
                        <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.floatingCompleteBtn} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.completeBtnText}>Complete Profile</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 50,
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    avatarProgressWrapper: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#222',
    },
    progressBorder: {
        position: 'absolute',
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 2,
        borderColor: '#FFD700', // Gold border indicates progress
        opacity: 0.8,
    },
    progressBadge: {
        position: 'absolute',
        bottom: -5,
        backgroundColor: '#000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    progressText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    stepsBar: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    stepTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeStepTab: {
        borderBottomColor: '#FFD700',
    },
    stepText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '500',
    },
    activeStepText: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    stepContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
        paddingBottom: 8,
    },
    editRow: {
        alignItems: 'center',
    },
    label: {
        color: '#888',
        fontSize: 14,
    },
    value: {
        color: '#FFF',
        fontWeight: '500',
        fontSize: 14,
    },
    editInput: {
        flex: 1,
        marginLeft: 15,
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        color: '#FFF',
        borderWidth: 1,
        borderColor: '#555',
        fontSize: 14,
        textAlign: 'right',
    },
    editDetailsBtn: {
        marginTop: 20,
        backgroundColor: '#222',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    editDetailsBtnText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveDetailsBtn: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    saveDetailsBtnText: {
        color: '#000',
    },
    typeToggle: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 2,
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#FFD700',
    },
    toggleBtnText: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
    },
    toggleBtnTextActive: {
        color: '#000',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    checkboxActive: {
        backgroundColor: '#FFD700',
    },
    checkboxText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    checkboxTextActive: {
        color: '#000',
    },
    textArea: {
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 15,
        color: '#FFF',
        borderWidth: 1,
        borderColor: '#333',
        textAlignVertical: 'top',
        minHeight: 120,
        fontSize: 16,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 12,
        color: '#FFF',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    addButton: {
        backgroundColor: '#FFD700',
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillChip: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    skillText: {
        color: '#FFD700',
        fontWeight: '500',
        fontSize: 14,
    },
    subText: {
        color: '#888',
        fontSize: 13,
        marginBottom: 16,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    imageWrapper: {
        width: '48%',
        aspectRatio: 1,
        marginRight: '2%',
        marginBottom: '2%',
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 4,
    },
    uploadBox: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    uploadText: {
        color: '#888',
        marginTop: 8,
        fontSize: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(15,15,15,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'flex-end', // Align Next button to right
    },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: '#FFD700',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignItems: 'center',
    },
    nextText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    floatingCompleteBtn: {
        flex: 1,
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    completeBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    uploadPulse: {
        padding: 5,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderRadius: 20,
    },
    emptyPhotosHint: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        marginTop: 20,
    },
    emptyHintText: {
        color: '#888',
        fontSize: 12,
        marginLeft: 8,
    },
});
