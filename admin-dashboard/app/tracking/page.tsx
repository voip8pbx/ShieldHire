'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCV1MNMAyPMvM0jXnPmVG01ikwxa1ETERg';
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#111111' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c4c4c4' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#747474' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#222222' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a1a' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#333333' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#222222' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d0d0d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4e4e4e' }]
  }
];

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

const defaultCenter = { lat: 19.0760, lng: 72.8777 }; // Default fallback center

export default function TrackingPage() {
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries
    });

    useEffect(() => {
        setMounted(true);
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, date, time, status, location, duration, totalPrice,
                    users ( name, email, contactNo ),
                    bouncers ( name, contactNo )
                `)
                .order('createdAt', { ascending: false })
                .limit(100);
            
            if (error) {
                console.error('Error fetching bookings:', error);
            } else if (data) {
                // Parse location strings to extract bundled |COORDS: coordinates
                const parsedBookings = data.map((b: any) => {
                    let lat: number | null = null;
                    let lng: number | null = null;
                    let loc = b.location;

                    if (loc && loc.includes('|COORDS:')) {
                        const parts = loc.split('|COORDS:');
                        loc = parts[0];
                        const coords = parts[1].split(',');
                        lat = parseFloat(coords[0]);
                        lng = parseFloat(coords[1]);
                    }

                    return { ...b, latitude: lat, longitude: lng, location: loc };
                });

                setBookings(parsedBookings);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="content-spacing">
                <div className="skeleton h-12 w-64 mb-4"></div>
                <div className="skeleton h-96 w-full"></div>
            </div>
        );
    }

    const geoBookings = bookings.filter((b: any) => b.latitude && b.longitude);
    const mapCenter = selectedBooking && selectedBooking.latitude && selectedBooking.longitude
        ? { lat: selectedBooking.latitude, lng: selectedBooking.longitude }
        : geoBookings.length > 0
            ? { lat: geoBookings[0].latitude, lng: geoBookings[0].longitude }
            : defaultCenter;

    return (
        <div className="layout-container animate-fade-in space-y-8">
            {/* Header */}
            <div className="page-header border-b-3 border-text-primary pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-text-primary">
                        Live Event Tracking
                    </h1>
                    <p className="page-subtitle text-xs font-mono text-text-muted uppercase tracking-wider mt-1">
                        // Real-time map tracking of upcoming and active operations
                    </p>
                </div>
                <button
                    onClick={fetchBookings}
                    className="btn btn-secondary border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all px-4 py-2 cursor-pointer font-mono font-black text-xs uppercase"
                >
                    REFRESH_MAP
                </button>
            </div>

            {/* Main Map View */}
            <div className="card border-3 border-text-primary bg-bg-secondary p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                    // GLOBAL_EVENT_MAP
                </h2>
                <div className="w-full relative border-3 border-text-primary rounded-none overflow-hidden bg-bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={{ ...mapContainerStyle, borderRadius: '0px' }}
                            center={mapCenter}
                            zoom={selectedBooking ? 15 : 12}
                            options={{
                                disableDefaultUI: false,
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                                styles: darkMapStyles
                            }}
                        >
                            {geoBookings.map((booking) => (
                                <Marker 
                                    key={booking.id}
                                    position={{ lat: booking.latitude, lng: booking.longitude }}
                                    onClick={() => setSelectedBooking(booking)}
                                    icon={{
                                        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" fill="%23facc15" stroke="black" stroke-width="2.5"/></svg>',
                                        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(16, 16) : undefined
                                    }}
                                />
                            ))}

                            {selectedBooking && selectedBooking.latitude && selectedBooking.longitude && (
                                <InfoWindow
                                    position={{ lat: selectedBooking.latitude, lng: selectedBooking.longitude }}
                                    onCloseClick={() => setSelectedBooking(null)}
                                >
                                    <div className="text-black p-2 min-w-[200px] font-mono">
                                        <h4 className="font-black text-sm border-b-2 border-black pb-1 mb-2 uppercase">// DISPATCH_METRICS</h4>
                                        <div className="space-y-1 text-[11px] leading-tight">
                                            <p><span className="font-black">STATUS:</span> 
                                                <span className="ml-1 px-1.5 py-0.5 bg-yellow-400 text-black border border-black font-black text-[9px]">
                                                    {selectedBooking.status}
                                                </span>
                                            </p>
                                            <p><span className="font-black">CLIENT:</span> {selectedBooking.users?.name || 'N/A'}</p>
                                            <p><span className="font-black">TEL:</span> {selectedBooking.users?.contactNo || 'N/A'}</p>
                                            <p><span className="font-black">BOUNCER:</span> {selectedBooking.bouncers?.name || 'Pending'}</p>
                                            <p><span className="font-black">DATE:</span> {new Date(selectedBooking.date).toLocaleDateString()} at {selectedBooking.time}</p>
                                            <p><span className="font-black">LOC:</span> {selectedBooking.location || 'Precise Map Location'}</p>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="w-full h-[500px] flex items-center justify-center bg-bg-primary">
                            <div className="animate-spin border-2 border-primary-yellow border-t-transparent h-12 w-12 rounded-none"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bookings List */}
            <div className="card border-3 border-text-primary bg-bg-secondary p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-wider font-mono mb-4">
                    // ACTIVE_DEPLOYMENTS
                </h2>
                
                {loading ? (
                    <div className="py-8 text-center text-text-muted font-mono">// LOADING_ACTIVE_EVENTS...</div>
                ) : bookings.length === 0 ? (
                    <div className="py-8 text-center text-text-muted font-mono">// NO_ACTIVE_DEPLOYMENTS_FOUND</div>
                ) : (
                    <div className="table-container">
                        <table className="professional-table">
                            <thead>
                                <tr>
                                    <th>DATE & TIME</th>
                                    <th>CLIENT PROFILE</th>
                                    <th>BOUNCER PROFILE</th>
                                    <th>STATUS</th>
                                    <th className="hidden md:table-cell">DEPLOYMENT LOCATION</th>
                                    <th className="text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <div className="font-mono text-xs font-bold text-text-primary">{new Date(b.date).toLocaleDateString()}</div>
                                            <div className="text-[10px] font-mono text-text-dim mt-0.5">{b.time}</div>
                                        </td>
                                        <td>
                                            <div className="font-black text-text-primary uppercase tracking-wide">{b.users?.name || 'Unknown'}</div>
                                            <div className="text-[10px] font-mono text-text-dim mt-0.5">{b.users?.contactNo}</div>
                                        </td>
                                        <td>
                                            <div className="font-black text-text-primary uppercase tracking-wide">{b.bouncers?.name || 'Pending'}</div>
                                            <div className="text-[10px] font-mono text-text-dim mt-0.5">AGENT_ID: {b.id.split('-')[0]}</div>
                                        </td>
                                        <td>
                                            <span className={`px-2.5 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                b.status === 'CONFIRMED' ? 'bg-success text-black' : 
                                                b.status === 'PENDING' ? 'bg-primary-yellow text-black' : 
                                                'bg-bg-tertiary text-text-dim border-text-dim'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell max-w-[200px] truncate font-mono text-xs text-text-primary uppercase" title={b.location}>
                                            {b.location || 'Location Set'}
                                        </td>
                                        <td className="text-right">
                                            {b.latitude && b.longitude ? (
                                                <button 
                                                    onClick={() => {
                                                        setSelectedBooking(b);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="btn btn-sm btn-primary py-1 px-3 border-2 border-black font-mono font-black text-[10px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                                >
                                                    LOCATE_AGENT
                                                </button>
                                            ) : (
                                                <span className="font-mono font-black text-[10px] text-text-dim uppercase">NO_GPS</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}


