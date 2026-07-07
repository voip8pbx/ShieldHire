import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from 'react-native-geolocation-service';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../types';

type MapScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'MapScreen'>;
type MapScreenRouteProp = RouteProp<HomeStackParamList, 'MapScreen'>;

type Props = {
    navigation: MapScreenNavigationProp;
    route: MapScreenRouteProp;
};

export default function MapScreen({ navigation, route }: Props) {
    const { initialLatitude, initialLongitude, bouncerId, price, package: bookingPackage } = route.params;
    
    const [markerCoords, setMarkerCoords] = useState({
        latitude: initialLatitude,
        longitude: initialLongitude
    });

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        // If the coordinates are the default Mumbai fallback, jump to user's real location
        if (initialLatitude === 19.0760 && initialLongitude === 72.8777) {
            const fetchCurrentLocation = () => {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const newCoords = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        setMarkerCoords(newCoords);
                        mapRef.current?.animateToRegion({
                            ...newCoords,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }, 1000);
                    },
                    (error) => console.log(error),
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            };

            if (Platform.OS === 'android') {
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then(granted => {
                    if (granted) fetchCurrentLocation();
                });
            } else {
                Geolocation.requestAuthorization('whenInUse').then(auth => {
                    if (auth === 'granted') fetchCurrentLocation();
                });
            }
        }
    }, [initialLatitude, initialLongitude]);

    const handleConfirm = () => {
        navigation.navigate('BookingFlow', { 
            bouncerId, 
            price, 
            package: bookingPackage,
            selectedCoordinate: markerCoords 
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Pin Event Location</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: Number(markerCoords.latitude),
                        longitude: Number(markerCoords.longitude),
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    showsUserLocation={true}
                    onPress={(e) => {
                        if (e.nativeEvent?.coordinate) {
                            setMarkerCoords(e.nativeEvent.coordinate);
                        }
                    }}
                >
                    <Marker
                        draggable
                        coordinate={{
                            latitude: Number(markerCoords.latitude),
                            longitude: Number(markerCoords.longitude)
                        }}
                        onDragEnd={(e) => {
                            if (e.nativeEvent?.coordinate) {
                                setMarkerCoords(e.nativeEvent.coordinate);
                            }
                        }}
                        title="Event Venue"
                        description="Drag me to the exact spot"
                    />
                </MapView>
                
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>Drag the marker to the exact entrance or venue spot.</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.confirmBtn} 
                    onPress={handleConfirm}
                >
                    <Text style={styles.confirmBtnText}>CONFIRM PIN LOCATION</Text>
                </TouchableOpacity>
            </View>
        </View>
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
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'ios' ? 40 : 5,
        paddingBottom: 10,
        backgroundColor: '#1E1E1E',
    },
    backBtn: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    instructionBox: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#000000ff',
    },
    instructionText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
    },
    confirmBtn: {
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        borderRadius: 15,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
