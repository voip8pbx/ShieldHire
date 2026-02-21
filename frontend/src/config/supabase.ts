import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://yoshgwtufyjjfqittrhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvc2hnd3R1ZnlqamZxaXR0cmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTg5OTMsImV4cCI6MjA4NzEzNDk5M30.9Q20Su-q-ODH-OGBqp3OyPoEDHDRRHW8sA3KtiAtbf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
export default supabase;
