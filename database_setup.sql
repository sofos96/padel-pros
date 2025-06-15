-- Database setup for Padel App
-- Run these commands in your Supabase SQL editor

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue_id BIGINT NOT NULL,
    players TEXT[] NOT NULL,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
    id BIGSERIAL PRIMARY KEY,
    "user" TEXT NOT NULL,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user", date)
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    website TEXT,
    price_per_hour DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default venue (Jumbo)
INSERT INTO venues (id, name, address, phone, website, price_per_hour)
VALUES (1, 'Jumbo', 'Λακαταμία', '97443000', 'https://goallpadel.com/', 0)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
-- For sessions table
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true);

-- For availability table
CREATE POLICY "Allow all operations on availability" ON availability
    FOR ALL USING (true);

-- For venues table
CREATE POLICY "Allow all operations on venues" ON venues
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_availability_user_date ON availability("user", date);
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);

-- Create session_comments table
CREATE TABLE IF NOT EXISTS session_comments (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    user_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Enable Row Level Security for comments
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;

-- Create policy for comments
CREATE POLICY "Allow all operations on session_comments" ON session_comments
    FOR ALL USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_created_at ON session_comments(created_at);

-- Grant permissions
GRANT ALL ON sessions TO anon, authenticated;
GRANT ALL ON availability TO anon, authenticated;
GRANT ALL ON venues TO anon, authenticated;
GRANT ALL ON session_comments TO anon, authenticated;
GRANT ALL ON SEQUENCE availability_id_seq TO anon, authenticated;
GRANT ALL ON SEQUENCE session_comments_id_seq TO anon, authenticated; 