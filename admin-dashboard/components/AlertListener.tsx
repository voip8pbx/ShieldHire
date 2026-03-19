'use client';

/// <reference types="styled-jsx" />

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import supabase from '../lib/supabase';

const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = {
    width: '100%',
    height: '200px',
    borderRadius: '0.5rem',
    marginTop: '1rem'
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function AlertListener() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const socketRef = useRef<any>(null);

    // useJsApiLoader instead of LoadScript to prevent "google api is already presented" error
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    if (loadError) {
        console.error('Google Maps Load Error:', loadError);
    }

    // Helper to convert snake_case DB columns to camelCase for frontend
    const camelCaseKeys = (obj: any): any => {
        if (!obj) return null;
        if (Array.isArray(obj)) return obj.map(item => camelCaseKeys(item));
        const newObj: any = {};
        for (const key in obj) {
            const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            newObj[camelKey] = obj[key];
        }
        return newObj;
    };

    const processAlert = useCallback((alert: any) => {
        const formatted = camelCaseKeys(alert);
        if (alert.users) {
            formatted.user = camelCaseKeys(alert.users);
            delete formatted.users;
        }
        return formatted;
    }, []);

    const fetchLatestAlerts = useCallback(async () => {
        try {
            const response = await fetch('/api/alerts', { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setAlerts(data);
            } else {
                const { data, error } = await supabase
                    .from('emergency_alerts')
                    .select('*, users(name, email, contactNo)')
                    .eq('status', 'OPEN')
                    .order('createdAt', { ascending: false });

                if (!error && data) {
                    setAlerts(data.map((a: any) => processAlert(a)));
                }
            }
        } catch (error) {
            console.error('Failed to fetch initial alerts:', error);
        }
    }, [processAlert]);

    useEffect(() => {
        audioRef.current = new Audio(ALERT_SOUND_URL);
        audioRef.current.loop = true;

        // Initialize Socket
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
        console.log('Initiating Socket.io connection to:', backendUrl);
        
        const socket = io(backendUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Connected to Alert Socket Server');
            setIsSocketConnected(true);
        });

        socket.on('disconnect', () => {
            console.warn('❌ Disconnected from Alert Socket Server');
            setIsSocketConnected(false);
        });

        socket.on('new-alert', (newAlert: any) => {
            console.log('🔔 New Alert Received via Socket:', newAlert);
            setAlerts((prev) => {
                if (prev.find(a => a.id === newAlert.id)) return prev;
                return [newAlert, ...prev];
            });
        });

        // Supabase Realtime Fallback
        const channel = supabase
            .channel('emergency_alerts_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'emergency_alerts',
                },
                async (payload: any) => {
                    console.log('🔔 New Alert detected via Supabase Realtime:', payload);
                    setIsSupabaseConnected(true);

                    // Fetch full details
                    const { data: fullAlert, error } = await supabase
                        .from('emergency_alerts')
                        .select('*, users(name, email, contactNo)')
                        .eq('id', payload.new.id)
                        .single();

                    if (!error && fullAlert) {
                        const formattedAlert = processAlert(fullAlert);
                        setAlerts((prev) => {
                            if (prev.find((a: any) => a.id === formattedAlert.id)) return prev;
                            return [formattedAlert, ...prev];
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('Supabase Realtime Status:', status);
                setIsSupabaseConnected(status === 'SUBSCRIBED');
            });

        // Initial Fetch
        fetchLatestAlerts();

        // Safety interval fetching - guarantees updates every 15s even if listeners fail
        const intervalId = setInterval(fetchLatestAlerts, 15000);

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [fetchLatestAlerts, processAlert]);

    // Audio Control
    useEffect(() => {
        if (alerts.length > 0) {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        } else {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [alerts.length]);

    const handleAcknowledge = async (alertId: string) => {
        try {
            // Optimistically remove from UI
            setAlerts(prev => prev.filter(a => a.id !== alertId));

            // Call API to acknowledge on server
            await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PUT' });
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-pulse-red">
            <div className="bg-red-900 border-4 border-red-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl text-white relative overflow-hidden animate-shake max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Siren Effect Overlay */}
                <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>

                {/* Close Button */}
                <button
                    onClick={() => setAlerts([])} 
                    className="absolute top-4 right-4 z-50 bg-red-800 hover:bg-red-700 text-white rounded-full p-2 transition-colors border border-red-400"
                    aria-label="Close Alert"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative z-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="absolute inset-0 h-24 w-24 rounded-full bg-red-500/20 blur-xl animate-pulse"></div>
                        </div>
                    </div>

                    <h2 className="text-4xl font-black uppercase tracking-widest mb-2 animate-pulse">SOS EMERGENCY</h2>
                    <p className="text-xl text-red-200 mb-8 font-bold tracking-wide">
                        {isSocketConnected || isSupabaseConnected ? '🔴 LIVE MONITORING' : '⚠️ RECONNECTING...'}
                    </p>

                    <div className="space-y-6 text-left bg-black/30 p-6 rounded-xl border border-red-700">
                        {alerts.map(alert => (
                            <div key={alert.id} className="border-b border-red-800 last:border-0 pb-6 last:pb-0 mb-6 last:mb-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-red-400 uppercase font-bold">Officer Name</p>
                                        <p className="text-lg font-bold">{alert.user?.name || 'Unknown Officer'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-red-400 uppercase font-bold">Contact No</p>
                                        <p className="text-lg font-bold">{alert.user?.contactNo || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-red-400 uppercase font-bold">Reported Location</p>
                                        <p className="text-lg font-mono text-yellow-400">{alert.location || 'Location data unavailable'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-red-400 uppercase font-bold">Coordinates</p>
                                        <p className="text-sm font-mono text-gray-300">
                                            Lat: {alert.latitude?.toFixed(6) || '---'}, Long: {alert.longitude?.toFixed(6) || '---'}
                                        </p>
                                    </div>

                                    {/* Map View - Only render if script is loaded */}
                                    {alert.latitude && alert.longitude && (
                                        <div className="col-span-2 mt-2">
                                            {isLoaded ? (
                                                <GoogleMap
                                                    mapContainerStyle={mapContainerStyle}
                                                    center={{ lat: alert.latitude, lng: alert.longitude }}
                                                    zoom={15}
                                                >
                                                    <Marker position={{ lat: alert.latitude, lng: alert.longitude }} />
                                                </GoogleMap>
                                            ) : (
                                                <div className="h-[200px] w-full bg-red-950/50 rounded-lg flex items-center justify-center border border-red-800 animate-pulse">
                                                    <p className="text-red-400 text-sm font-bold uppercase tracking-widest">
                                                       {loadError ? 'Map loading failed' : 'Loading Map...'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleAcknowledge(alert.id)}
                                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors uppercase tracking-wide shadow-lg border-2 border-transparent hover:border-red-400 transform active:scale-95 transition-all"
                                >
                                    Acknowledge & Dismiss
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite;
                }
                @keyframes pulse-red {
                    0%, 100% { background-color: rgba(0,0,0,0.5); }
                    50% { background-color: rgba(220, 38, 38, 0.3); }
                }
                .animate-pulse-red {
                    animation: pulse-red 2s infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}


