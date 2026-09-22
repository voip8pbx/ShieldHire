import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchWithRemoteModel, InspireFace, DetectMode, CameraRotation, Session } from 'react-native-nitro-inspire-face';

const { width, height } = Dimensions.get('window');

type ActionStep = 'CENTER' | 'TURN_LEFT' | 'BLINK' | 'TURN_RIGHT' | 'BLINK_AGAIN' | 'DONE' | 'FAILED';
type FaceState = 'NONE' | 'VALID' | 'INVALID' | 'MULTIPLE';

export interface LivenessVerificationResult {
    userId?: string;
    verificationStatus: 'SUCCESS';
    challengeSequence: string[];
    capturedSelfieImage: string;
    timestamp: string;
}

interface Props {
    onSuccess: (result: LivenessVerificationResult) => void;
    onCancel: () => void;
}

export default function LivenessCamera({ onSuccess, onCancel }: Props) {
    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const sessionRef = useRef<Session | null>(null);

    // SDK State
    const [isSdkReady, setIsSdkReady] = useState(false);
    const [sdkError, setSdkError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

    // Liveness states
    const [currentAction, setCurrentAction] = useState<ActionStep>('CENTER');
    const [feedback, setFeedback] = useState<string>('Loading face verification engine...');
    const isProcessingRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const [faceDetectedState, setFaceDetectedState] = useState<FaceState>('NONE');

    // Inactivity / Timeout
    const [timeLeft, setTimeLeft] = useState(60);
    const [firstTurnSign, setFirstTurnSign] = useState<number | null>(null);

    // Animations
    const pulseValue = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    // Handle SDK initialization & model download
    useEffect(() => {
        let isMounted = true;

        const initSDK = async () => {
            try {
                if (isMounted) setFeedback('Downloading liveness AI model (16.7MB)...');
                
                // Simulate download progress updates to give the user excellent feedback
                const progressInterval = setInterval(() => {
                    setDownloadProgress(prev => {
                        if (prev >= 95) {
                            clearInterval(progressInterval);
                            return 95;
                        }
                        return prev + 5;
                    });
                }, 150);

                await launchWithRemoteModel(
                    'https://github.com/HyperInspire/InspireFace/releases/download/v1.x/Pikachu',
                    '5037ba1f49905b783a1c973d5d58b834a645922cc2814c8e3ca630a38dc24431'
                );

                clearInterval(progressInterval);
                if (isMounted) setDownloadProgress(100);

                // Create the InspireFace session
                sessionRef.current = InspireFace.createSession(
                    {
                        enableLiveness: true,
                        enableFaceQuality: true,
                        enableInteractionLiveness: true,
                        enableFacePose: true,
                    },
                    DetectMode.ALWAYS_DETECT,
                    1,   // maxDetectFaceNum
                    320, // detectPixelLevel
                    -1   // trackByDetectModeFPS
                );

                if (isMounted) {
                    setIsSdkReady(true);
                    setFeedback('Position your face in the oval');
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }).start();
                }
            } catch (err: any) {
                console.error('[InspireFace] Initialization error:', err);
                if (isMounted) {
                    setSdkError(err?.message || 'Failed to download face detection resources.');
                    setFeedback('Error loading engine. Check internet connection.');
                }
            }
        };

        if (hasPermission && device) {
            initSDK();
        }

        return () => {
            isMounted = false;
        };
    }, [hasPermission, device]);

    // Inactivity timer
    useEffect(() => {
        if (!isSdkReady || currentAction === 'DONE' || currentAction === 'FAILED') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCurrentAction('FAILED');
                    setFeedback('Verification timed out due to inactivity.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSdkReady, currentAction]);

    // Pulse animation loop
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 1.0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Frame processing loop using recursive setTimeout
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let isActive = true;

        const loop = async () => {
            if (!isActive) return;
            if (isSdkReady && device && currentAction !== 'DONE' && currentAction !== 'FAILED') {
                await processFrame();
                if (isActive) {
                    timeoutId = setTimeout(loop, 600); // 600ms interval for balanced CPU load
                }
            }
        };

        if (isSdkReady && device && currentAction !== 'DONE' && currentAction !== 'FAILED') {
            timeoutId = setTimeout(loop, 600);
        }

        return () => {
            isActive = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isSdkReady, device, currentAction]);

    const processFrame = async () => {
        if (isProcessingRef.current || !cameraRef.current || !isSdkReady || !sessionRef.current) return;
        isProcessingRef.current = true;

        try {
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                enableAutoDistortionCorrection: false,
            } as any);

            const cleanPath = photo.path.replace('file://', '');

            // Create image bitmap
            const bitmap = InspireFace.createImageBitmapFromFilePath(3, cleanPath);
            if (!bitmap) {
                isProcessingRef.current = false;
                return;
            }

            // Create stream from bitmap with ROTATION_0 (VisionCamera outputs properly oriented photos)
            const stream = InspireFace.createImageStreamFromBitmap(bitmap, CameraRotation.ROTATION_0);
            if (!stream) {
                isProcessingRef.current = false;
                return;
            }

            // Execute face tracking
            const faces = sessionRef.current.executeFaceTrack(stream);

            if (faces.length === 0) {
                setFeedback('No face detected. Please look at the camera.');
                setFaceDetectedState('NONE');
                isProcessingRef.current = false;
                return;
            }
            if (faces.length > 1) {
                setFeedback('Multiple faces detected. Please ensure you are alone.');
                setFaceDetectedState('MULTIPLE');
                isProcessingRef.current = false;
                return;
            }

            // Execute pipeline process (liveness, quality, actions)
            const face = faces[0];
            const isPipelineOk = sessionRef.current.multipleFacePipelineProcess(
                stream,
                faces,
                {
                    enableLiveness: true,
                    enableFaceQuality: true,
                    enableInteractionLiveness: true,
                    enableFacePose: true,
                }
            );

            if (!isPipelineOk) {
                setFeedback('Processing face data...');
                isProcessingRef.current = false;
                return;
            }

            // Get secondary metrics
            const qualityScores = sessionRef.current.getFaceQualityConfidence();
            const quality = qualityScores[0] ?? 1.0;

            const livenessScores = sessionRef.current.getRGBLivenessConfidence();
            const livenessScore = livenessScores[0] ?? 0.0;

            evaluateLiveness(face, quality, livenessScore, photo.path);
        } catch (error) {
            console.warn('[LivenessCamera] Frame processing exception:', error);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const evaluateLiveness = (face: any, quality: number, livenessScore: number, photoPath: string) => {
        const yaw = face.angle?.yaw ?? 0;
        const pitch = face.angle?.pitch ?? 0;

        // Quality check
        if (quality < 0.22) {
            setFeedback('Poor lighting or image quality. Please adjust position.');
            setFaceDetectedState('INVALID');
            return;
        }

        // Spoof check
        if (livenessScore < 0.48) {
            setFeedback('Spoof attempt detected. Please look straight.');
            setFaceDetectedState('INVALID');
            return;
        }

        const isCentered = Math.abs(yaw) < 11 && Math.abs(pitch) < 11;
        setFaceDetectedState('VALID');

        switch (currentAction) {
            case 'CENTER':
                if (isCentered) {
                    setFeedback('Good! Now turn your face to the LEFT.');
                    setCurrentAction('TURN_LEFT');
                    setProgress(20);
                } else {
                    setFeedback('Look straight into the camera.');
                }
                break;
            case 'TURN_LEFT':
                if (Math.abs(yaw) > 14) {
                    setFirstTurnSign(Math.sign(yaw));
                    setFeedback('Perfect! Now look straight and BLINK your eyes.');
                    setCurrentAction('BLINK');
                    setProgress(40);
                } else {
                    setFeedback('Turn your face to the LEFT.');
                }
                break;
            case 'BLINK':
                if (isCentered) {
                    const interactionStates = sessionRef.current!.getFaceInteractionState();
                    const interactionActions = sessionRef.current!.getFaceInteractionActionsResult();
                    const interactionState = interactionStates[0];
                    const interactionAction = interactionActions[0];

                    const leftEye = interactionState?.left ?? 1.0;
                    const rightEye = interactionState?.right ?? 1.0;
                    const isBlinkAction = (leftEye < 0.28 && rightEye < 0.28) || (interactionAction?.blink > 0.6);

                    if (isBlinkAction) {
                        setFeedback('Great! Now turn your face to the RIGHT.');
                        setCurrentAction('TURN_RIGHT');
                        setProgress(60);
                    } else {
                        setFeedback('Look straight and BLINK your eyes.');
                    }
                } else {
                    setFeedback('Center your face first.');
                }
                break;
            case 'TURN_RIGHT':
                const isOppositeTurn = firstTurnSign !== null && (firstTurnSign > 0 ? yaw < -14 : yaw > 14);
                if (isOppositeTurn) {
                    setFeedback('Excellent! Look straight and BLINK again.');
                    setCurrentAction('BLINK_AGAIN');
                    setProgress(80);
                } else {
                    setFeedback('Turn your face to the RIGHT.');
                }
                break;
            case 'BLINK_AGAIN':
                if (isCentered) {
                    const interactionStates = sessionRef.current!.getFaceInteractionState();
                    const interactionActions = sessionRef.current!.getFaceInteractionActionsResult();
                    const interactionState = interactionStates[0];
                    const interactionAction = interactionActions[0];

                    const leftEye = interactionState?.left ?? 1.0;
                    const rightEye = interactionState?.right ?? 1.0;
                    const isBlinkAction = (leftEye < 0.28 && rightEye < 0.28) || (interactionAction?.blink > 0.6);

                    if (isBlinkAction) {
                        setFeedback('Verification Successful!');
                        setCurrentAction('DONE');
                        setProgress(100);

                        const payload: LivenessVerificationResult = {
                            verificationStatus: 'SUCCESS',
                            challengeSequence: ['CENTER', 'TURN_LEFT', 'BLINK', 'TURN_RIGHT', 'BLINK_AGAIN'],
                            capturedSelfieImage: photoPath,
                            timestamp: new Date().toISOString()
                        };

                        setTimeout(() => onSuccess(payload), 1200);
                    } else {
                        setFeedback('Look straight and BLINK again.');
                    }
                } else {
                    setFeedback('Center your face first.');
                }
                break;
        }
    };

    const handleRetry = () => {
        setCurrentAction('CENTER');
        setProgress(0);
        setTimeLeft(60);
        setFirstTurnSign(null);
        setFaceDetectedState('NONE');
        setFeedback('Position your face in the oval');
    };

    // Render loading & download state
    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Requesting Camera Permission...</Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                <MaterialCommunityIcons name="camera-off" size={48} color="#FFD700" />
                <Text style={styles.loadingText}>No Front Camera Device Found</Text>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                    <Text style={styles.cancelBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getOvalBorderColor = () => {
        if (faceDetectedState === 'VALID') return '#4CAF50'; // Vibrant Green
        if (faceDetectedState === 'INVALID') return '#FF5252'; // Vibrant Red
        if (faceDetectedState === 'MULTIPLE') return '#FF9800'; // Orange
        return '#FFD700'; // Gold default
    };

    return (
        <View style={styles.container}>
            {isSdkReady && (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    photo={true}
                />
            )}

            {/* Premium Overlay with Oval Cutout */}
            <View style={styles.overlay}>
                <View style={styles.topOverlay} />
                <View style={styles.middleOverlayRow}>
                    <View style={styles.sideOverlay} />
                    <Animated.View 
                        style={[
                            styles.faceOval,
                            {
                                transform: [{ scale: pulseValue }],
                                borderColor: getOvalBorderColor(),
                            }
                        ]}
                    >
                        <View style={[styles.ovalBorder, { borderColor: getOvalBorderColor() }]} />
                    </Animated.View>
                    <View style={styles.sideOverlay} />
                </View>
                <View style={styles.bottomOverlay} />
            </View>

            {/* Header with Exit button and elegant Timer */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Liveness Verification</Text>
                {isSdkReady && currentAction !== 'DONE' && currentAction !== 'FAILED' ? (
                    <View style={[styles.timerBadge, timeLeft < 10 && styles.timerDanger]}>
                        <Ionicons name="time-outline" size={16} color={timeLeft < 10 ? '#FF5252' : '#FFD700'} />
                        <Text style={[styles.timerText, timeLeft < 10 && styles.timerDangerText]}>{timeLeft}s</Text>
                    </View>
                ) : (
                    <View style={{ width: 44 }} />
                )}
            </View>

            {/* Step-by-Step progress indicator dots */}
            {isSdkReady && currentAction !== 'DONE' && currentAction !== 'FAILED' && (
                <View style={styles.stepsIndicator}>
                    {(['CENTER', 'TURN_LEFT', 'BLINK', 'TURN_RIGHT', 'BLINK_AGAIN'] as ActionStep[]).map((step, idx) => {
                        const isCompleted = idx < ['CENTER', 'TURN_LEFT', 'BLINK', 'TURN_RIGHT', 'BLINK_AGAIN'].indexOf(currentAction);
                        const isActive = currentAction === step;
                        return (
                            <View 
                                key={step} 
                                style={[
                                    styles.stepDot, 
                                    isCompleted && styles.stepDotCompleted, 
                                    isActive && styles.stepDotActive
                                ]} 
                            />
                        );
                    })}
                </View>
            )}

            {/* Progress Bar */}
            {isSdkReady && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
            )}

            {/* Glassmorphic instruction card */}
            <View style={styles.instructionContainer}>
                {sdkError ? (
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="alert-circle" size={42} color="#FF5252" />
                        <Text style={styles.errorText}>{sdkError}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={onCancel}>
                            <Text style={styles.retryBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                ) : !isSdkReady ? (
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.instructionText}>{feedback}</Text>
                        <Text style={styles.downloadSubText}>{downloadProgress}% downloaded</Text>
                    </View>
                ) : currentAction === 'FAILED' ? (
                    <View style={{ alignItems: 'center' }}>
                        <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
                        <Text style={styles.instructionText}>{feedback}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                            <Text style={styles.retryBtnText}>Retry Scan</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <MaterialCommunityIcons 
                            name={currentAction === 'DONE' ? 'check-decagram' : 'face-recognition'} 
                            size={40} 
                            color={currentAction === 'DONE' ? '#4CAF50' : '#FFD700'} 
                        />
                        <Text style={styles.instructionText}>{feedback}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const overlayColor = 'rgba(0, 0, 0, 0.72)';
const ovalWidth = width * 0.72;
const ovalHeight = ovalWidth * 1.32;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 20,
        fontSize: 16,
        fontWeight: '600',
    },
    cancelBtn: {
        marginTop: 30,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#222',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    cancelBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topOverlay: {
        flex: 1,
        width: '100%',
        backgroundColor: overlayColor,
    },
    middleOverlayRow: {
        flexDirection: 'row',
        height: ovalHeight,
        width: '100%',
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: overlayColor,
    },
    faceOval: {
        width: ovalWidth,
        height: ovalHeight,
        borderRadius: ovalWidth / 2,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderStyle: 'dashed',
    },
    ovalBorder: {
        width: '98%',
        height: '98%',
        borderRadius: ovalWidth / 2,
        borderWidth: 1,
        opacity: 0.5,
    },
    bottomOverlay: {
        flex: 1,
        width: '100%',
        backgroundColor: overlayColor,
    },
    header: {
        position: 'absolute',
        top: 50,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    closeBtn: {
        padding: 10,
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 20, 20, 0.75)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    timerDanger: {
        borderColor: '#FF5252',
    },
    timerText: {
        color: '#FFD700',
        marginLeft: 6,
        fontSize: 14,
        fontWeight: 'bold',
    },
    timerDangerText: {
        color: '#FF5252',
    },
    stepsIndicator: {
        position: 'absolute',
        top: 110,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        marginHorizontal: 6,
    },
    stepDotActive: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFD700',
    },
    stepDotCompleted: {
        backgroundColor: '#4CAF50',
    },
    progressContainer: {
        position: 'absolute',
        top: 135,
        width: '80%',
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFD700',
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 60,
        width: '90%',
        backgroundColor: 'rgba(15, 15, 15, 0.88)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    instructionText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    downloadSubText: {
        color: '#888',
        fontSize: 13,
        marginTop: 6,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 12,
    },
    retryBtn: {
        marginTop: 18,
        backgroundColor: '#FFD700',
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
