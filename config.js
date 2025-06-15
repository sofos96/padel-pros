// Supabase Configuration
const SUPABASE_URL = 'https://rryalcklaeyhxnosaxnb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyeWFsY2tsYWV5aHhub3NheG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzczMjIsImV4cCI6MjA2NTU1MzMyMn0.ZDJt0-NliMoFu61lcI_VfzSVopdlDfGNz4sSYGp7Kh0';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Weather API configuration (WeatherAPI.com - free tier)
const WEATHER_API_KEY = '4a0d3b41cf874fa7911100657251506';
const WEATHER_LOCATION = 'Nicosia,Cyprus';
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';

// App Configuration
const APP_CONFIG = {
    players: ['Σόφος', 'Μίλλης', 'Μάμους', 'Αντρέας'],
    avatars: {
        'Σόφος': 'sofos.jpg',
        'Μίλλης': 'millis.jpg', 
        'Μάμους': 'mamoush.jpg',
        'Αντρέας': 'andreas.jpg'
    }
}; 