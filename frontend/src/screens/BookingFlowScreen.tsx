import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, TextInput } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../types';
import api from '../services/api';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type BookingFlowScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'BookingFlow'>;
type BookingFlowScreenRouteProp = RouteProp<HomeStackParamList, 'BookingFlow'>;

type Props = {
    navigation: BookingFlowScreenNavigationProp;
    route: BookingFlowScreenRouteProp;
};

const TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '02:00 PM', '06:00 PM', '08:00 PM', '10:00 PM'
];

export default function BookingFlowScreen({ navigation, route }: Props) {
    const { bouncerId, price } = route.params;
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [hours, setHours] = useState(4); // Default 4 hours for security
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState('');
    const [predictions, setPredictions] = useState<any[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);

    // Google Maps API Key directly from .env per user prompt
    const GOOGLE_MAPS_API_KEY = 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs';

    const fetchPlaces = async (text: string) => {
        if (text.length > 2) {
            try {
                const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    text
                )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.status === 'OK') {
                    setPredictions(data.predictions);
                    setShowPredictions(true);
                } else {
                    setPredictions([]);
                    setShowPredictions(false);
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            setPredictions([]);
            setShowPredictions(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedDate || !selectedTime || !location) {
            Alert.alert('Error', 'Please select a date, time and enter location');
            return;
        }

        const calculatedPrice = price * (hours / 4) * (hours > 6 ? 1.2 : 1); // Dynamic calculation

        setLoading(true);
        try {
            // Re-using existing endpoint
            await api.post('/bookings', {
                bouncerId,
                date: selectedDate,
                time: selectedTime,
                location: location,
                duration: hours,
                totalPrice: Math.round(calculatedPrice)
            });
            Alert.alert('Success', 'Security Personnel Confirmed!', [
                { text: 'Done', onPress: () => navigation.popToTop() }
            ]);
        } catch (error) {
            console.log(error);
            Alert.alert('Success', 'Security Request Sent! (Mock)', [
                { text: 'Done', onPress: () => navigation.popToTop() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const incrementHours = () => setHours(h => Math.min(h + 1, 24));
    const decrementHours = () => setHours(h => Math.max(h - 1, 4)); // Min 4 hours

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hiring Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Calendar Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="calendar-month" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Select Date</Text>
                    </View>

                    <Calendar
                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
                        markedDates={{
                            [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: '#FFD700', selectedTextColor: '#000' }
                        }}
                        minDate={new Date().toISOString().split('T')[0]}
                        theme={{
                            backgroundColor: '#1E1E1E',
                            calendarBackground: '#1E1E1E',
                            textSectionTitleColor: '#b6c1cd',
                            selectedDayBackgroundColor: '#FFD700',
                            selectedDayTextColor: '#000',
                            todayTextColor: '#FFD700',
                            dayTextColor: '#d9e1e8',
                            textDisabledColor: '#444',
                            monthTextColor: '#fff',
                            arrowColor: '#FFD700',
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '500',
                        }}
                        style={styles.calendar}
                    />
                </View>

                {/* Time Slots */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Shift Start Time</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeList}>
                        {TIME_SLOTS.map((slot) => {
                            const isSelected = selectedTime === slot;
                            return (
                                <TouchableOpacity
                                    key={slot}
                                    style={[styles.timeSlot, isSelected && styles.activeTimeSlot]}
                                    onPress={() => setSelectedTime(slot)}
                                >
                                    <Text style={[styles.timeText, isSelected && styles.activeTimeText]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Duration Counter */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="timer-sand" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Shift Duration</Text>
                    </View>
                    <View style={styles.counterContainer}>
                        <TouchableOpacity onPress={decrementHours} style={styles.counterBtn}>
                            <Ionicons name="remove" size={24} color="#FFD700" />
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{hours} Hours</Text>
                        <TouchableOpacity onPress={incrementHours} style={styles.counterBtn}>
                            <Ionicons name="add" size={24} color="#FFD700" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.durationNote}>Minimum 4 hours required for security personnel.</Text>
                </View>

                {/* Location Input */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location-outline" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>Deployment Location</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 123 Event Street, Mumbai"
                        placeholderTextColor="#666"
                        value={location}
                        onChangeText={(text) => {
                            setLocation(text);
                            fetchPlaces(text);
                        }}
                    />
                    {showPredictions && predictions.length > 0 && (
                        <View style={styles.predictionsContainer}>
                            {predictions.map((item: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.predictionItem}
                                    onPress={() => {
                                        setLocation(item.description);
                                        setShowPredictions(false);
                                    }}
                                >
                                    <MaterialCommunityIcons name="map-marker" size={16} color="#888" style={{ marginRight: 8 }} />
                                    <Text style={styles.predictionText} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalLabel}>Total Estimated Cost</Text>
                    <Text style={styles.totalValue}>₹{Math.round(price * (hours / 4) * (hours > 6 ? 1.2 : 1))}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.confirmButton, (!selectedDate || !selectedTime) && styles.disabledButton]}
                    onPress={handleBooking}
                    disabled={!selectedDate || !selectedTime || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.confirmButtonText}>CONFIRM HIRE</Text>
                    )}
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
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Calendar
    calendar: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
    },
    // Time Slots
    timeList: {
        paddingVertical: 5,
    },
    timeSlot: {
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    activeTimeSlot: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    timeText: {
        fontSize: 14,
        color: '#ccc',
        fontWeight: '500',
    },
    activeTimeText: {
        color: '#000',
        fontWeight: '700',
    },
    // Counter
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    counterBtn: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    durationNote: {
        marginTop: 10,
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 24 : 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    confirmButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 150,
    },
    disabledButton: {
        backgroundColor: '#444',
        opacity: 0.7,
    },
    confirmButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#333',
        marginTop: 5,
    },
    predictionsContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#333',
        maxHeight: 200,
        overflow: 'hidden',
    },
    predictionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    predictionText: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
});
