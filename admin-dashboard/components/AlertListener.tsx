'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
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

export default function AlertListener() {
    // ... existing state/effects ...
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    // We can still use acknowledgedIds for local temporary dismissal if needed, 
    // but primary removal should be via server ACK.
    // Let's use it to track "Dismissed in this session" to avoid UI flicker before server update?
    // Actually, simply removing from 'alerts' state is cleaner.

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const socketRef = useRef<any>(null);

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

    const processAlert = (alert: any) => {
        const formatted = camelCaseKeys(alert);
        if (alert.users) {
            formatted.user = camelCaseKeys(alert.users);
            delete formatted.users;
        }
        return formatted;
    };

    // Calculate active alerts (OPEN and not dismissed locally if we keep local dismiss logic)
    const activeAlerts = alerts;

    useEffect(() => {
        audioRef.current = new Audio(ALERT_SOUND_URL);
        audioRef.current.loop = true;

        // Initialize Socket
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
        const socket = io(backendUrl, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to Alert Socket Server:', backendUrl);
            setIsSocketConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Alert Socket Server');
            setIsSocketConnected(false);
        });

        socket.on('new-alert', (newAlert: any) => {
            console.log('New Alert Received via Socket:', newAlert);
            setAlerts((prev) => {
                if (prev.find(a => a.id === newAlert.id)) return prev;
                return [newAlert, ...prev];
            });
        });

        // Supabase Realtime Fallback (Works on Vercel/Serverless where Socket.io fails)
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
                    console.log('New Alert detected via Supabase Realtime:', payload);

                    // Fetch full details with join because payload only contains the table row
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
            .subscribe();

        // Initial Fetch of OPEN alerts
        const fetchInitialAlerts = async () => {
            try {
                // Try fetching from our API first
                const response = await fetch('/api/alerts', { cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data);
                } else {
                    // Fallback directly to Supabase if API fails
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
        };

        fetchInitialAlerts();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            supabase.removeChannel(channel);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (activeAlerts.length > 0) {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        } else {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [activeAlerts.length]);

    const handleAcknowledge = async (alertId: string) => {
        try {
            // Optimistically remove from UI
            setAlerts(prev => prev.filter(a => a.id !== alertId));

            // Call API to acknowledge on server
            await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PUT' });
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            // Optionally revert check if failed, but for SOS, keep it simple
        }
    };



    // const activeAlerts = alerts.filter(a => !acknowledgedIds.has(a.id)); 
    // ^ No longer needed as 'alerts' only contains active ones now

    if (activeAlerts.length === 0) return null;

    return (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-pulse-red">
                <div className="bg-red-900 border-4 border-red-500 rounded-2xl p-8 max-w-2xl w-full shadow-2xl text-white relative overflow-hidden animate-shake max-h-[90vh] overflow-y-auto custom-scrollbar">
                    {/* Siren Effect Overlay */}
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>

                    {/* Close Button */}
                    <button
                        onClick={() => setAlerts([])} // Close/Dismiss all temporarily for this view? Or maybe just minimize? 
                        // The user said "Close", which usually means "Hide". If they refresh, they come back if not ACK'd.
                        // I'll set alerts to empty for now to stop the noise.

                        className="absolute top-4 right-4 z-50 bg-red-800 hover:bg-red-700 text-white rounded-full p-2 transition-colors border border-red-400"
                        aria-label="Close Alert"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative z-10 text-center">
                        <div className="flex justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-4xl font-black uppercase tracking-widest mb-2 animate-pulse">SOS EMERGENCY</h2>
                        <p className="text-xl text-red-200 mb-8">Immediate Attention Required!</p>

                        <div className="space-y-6 text-left bg-black/30 p-6 rounded-xl border border-red-700">
                            {activeAlerts.map(alert => (
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

                                        {/* Map View */}
                                        {alert.latitude && alert.longitude && (
                                            <div className="col-span-2 mt-2">
                                                <GoogleMap
                                                    mapContainerStyle={mapContainerStyle}
                                                    center={{ lat: alert.latitude, lng: alert.longitude }}
                                                    zoom={15}
                                                >
                                                    <Marker position={{ lat: alert.latitude, lng: alert.longitude }} />
                                                </GoogleMap>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleAcknowledge(alert.id)}
                                        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors uppercase tracking-wide shadow-lg"
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
                    /* Hide scrollbar for Chrome, Safari and Opera */
                    .custom-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    /* Hide scrollbar for IE, Edge and Firefox */
                    .custom-scrollbar {
                        -ms-overflow-style: none;  /* IE and Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}</style>
            </div>
        </LoadScript>
    );
}


