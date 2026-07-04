'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCV1MNMAyPMvM0jXnPmVG01ikwxa1ETERg';
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

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
                // Handle both native latitude/longitude AND legacy bundled |COORDS:
                const parsedBookings = data.map((b: any) => {
                    let lat = b.latitude;
                    let lng = b.longitude;
                    let loc = b.location;

                    if (loc && loc.includes('|COORDS:')) {
                        const parts = loc.split('|COORDS:');
                        loc = parts[0];
                        const coords = parts[1].split(',');
                        if (!lat && !lng) {
                            lat = parseFloat(coords[0]);
                            lng = parseFloat(coords[1]);
                        }
                    }

                    return { ...b, latitude: lat, longitude: lng, location: loc };
                }).filter((b: any) => b.latitude && b.longitude);

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

    const mapCenter = selectedBooking 
        ? { lat: selectedBooking.latitude, lng: selectedBooking.longitude }
        : bookings.length > 0 && bookings[0].latitude && bookings[0].longitude
            ? { lat: bookings[0].latitude, lng: bookings[0].longitude }
            : defaultCenter;

    return (
        <div className="content-spacing relative">
            {/* Header */}
            <div className="section-spacing flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                        Live Event Tracking
                    </h1>
                    <p className="text-base text-[var(--text-secondary)]">
                        Real-time map tracking of upcoming and active events
                    </p>
                </div>
                <button onClick={fetchBookings} className="btn-outline">
                    Refresh
                </button>
            </div>

            {/* Main Map View */}
            <div className="card card-spacing p-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <span className="text-[var(--primary-color)]">📍</span> Global Event Map
                </h2>
                <div className="w-full relative border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--surface-elevated)]">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={selectedBooking ? 15 : 12}
                            options={{
                                disableDefaultUI: false,
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false
                            }}
                        >
                            {bookings.map((booking) => (
                                <Marker 
                                    key={booking.id}
                                    position={{ lat: booking.latitude, lng: booking.longitude }}
                                    onClick={() => setSelectedBooking(booking)}
                                />
                            ))}

                            {selectedBooking && (
                                <InfoWindow
                                    position={{ lat: selectedBooking.latitude, lng: selectedBooking.longitude }}
                                    onCloseClick={() => setSelectedBooking(null)}
                                >
                                    <div className="text-black p-2 min-w-[200px]">
                                        <h4 className="font-bold text-lg border-b border-gray-200 pb-1 mb-2">Booking Details</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-semibold text-gray-700">Status:</span> 
                                                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                                    {selectedBooking.status}
                                                </span>
                                            </p>
                                            <p><span className="font-semibold text-gray-700">Client:</span> {selectedBooking.users?.name || 'N/A'}</p>
                                            <p><span className="font-semibold text-gray-700">Contact:</span> {selectedBooking.users?.contactNo || 'N/A'}</p>
                                            <p><span className="font-semibold text-gray-700">Bouncer:</span> {selectedBooking.bouncers?.name || 'Pending'}</p>
                                            <p><span className="font-semibold text-gray-700">Date:</span> {new Date(selectedBooking.date).toLocaleDateString()} at {selectedBooking.time}</p>
                                            <p><span className="font-semibold text-gray-700">Address:</span> {selectedBooking.location || 'Precise Map Location'}</p>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="w-full h-[500px] flex items-center justify-center bg-[var(--surface-hover)]">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bookings List */}
            <div className="card card-spacing">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                    Upcoming & Active Deployments
                </h2>
                
                {loading ? (
                    <div className="py-8 text-center text-[var(--text-secondary)]">Loading active events...</div>
                ) : bookings.length === 0 ? (
                    <div className="py-8 text-center text-[var(--text-secondary)]">No events with location data found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-color)]">
                                    <th className="p-3 text-sm font-semibold text-[var(--text-secondary)]">Date & Time</th>
                                    <th className="p-3 text-sm font-semibold text-[var(--text-secondary)]">Client</th>
                                    <th className="p-3 text-sm font-semibold text-[var(--text-secondary)]">Bouncer</th>
                                    <th className="p-3 text-sm font-semibold text-[var(--text-secondary)]">Status</th>
                                    <th className="p-3 text-sm font-semibold text-[var(--text-secondary)]">Location</th>
                                    <th className="p-3 text-sm font-semibold text-[var(--text-secondary)] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id} className="border-b border-[var(--border-color)] hover:bg-[var(--surface-hover)]">
                                        <td className="p-3 text-sm">
                                            <div>{new Date(b.date).toLocaleDateString()}</div>
                                            <div className="text-[var(--text-secondary)]">{b.time}</div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            <div>{b.users?.name || 'Unknown'}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{b.users?.contactNo}</div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            <div>{b.bouncers?.name || 'Pending'}</div>
                                        </td>
                                        <td className="p-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                b.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' : 
                                                b.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                'bg-gray-500/20 text-gray-400'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm max-w-[200px] truncate" title={b.location}>
                                            {b.location || 'Location Set'}
                                        </td>
                                        <td className="p-3 text-sm text-right">
                                            <button 
                                                onClick={() => {
                                                    setSelectedBooking(b);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="px-3 py-1.5 bg-[var(--primary-glow)] text-[var(--primary-color)] border border-[var(--primary-color)] font-semibold rounded-md hover:bg-[var(--primary-color)] hover:text-black transition-colors"
                                            >
                                                Locate
                                            </button>
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


