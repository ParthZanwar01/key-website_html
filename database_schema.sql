-- Meeting Attendance System Database Schema
-- This file contains the SQL commands to create the necessary tables for the meeting attendance system

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    meeting_date DATE NOT NULL,
    meeting_type VARCHAR(50) NOT NULL DEFAULT 'both',
    attendance_code VARCHAR(10) NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT false,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meeting_attendance table
CREATE TABLE IF NOT EXISTS meeting_attendance (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    student_s_number VARCHAR(20) NOT NULL,
    attendance_code VARCHAR(10) NOT NULL,
    session_type VARCHAR(20) DEFAULT 'both',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, student_s_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_is_open ON meetings(is_open);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting_id ON meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_student ON meeting_attendance(student_s_number);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_submitted ON meeting_attendance(submitted_at);

-- Add comments for documentation
COMMENT ON TABLE meetings IS 'Stores information about Key Club meetings';
COMMENT ON TABLE meeting_attendance IS 'Stores student attendance records for meetings';
COMMENT ON COLUMN meetings.meeting_type IS 'Type of meeting: both, morning, afternoon, etc.';
COMMENT ON COLUMN meetings.attendance_code IS '6-character code for attendance verification';
COMMENT ON COLUMN meetings.is_open IS 'Whether the meeting is currently open for attendance submission';
COMMENT ON COLUMN meetings.created_by IS 'S-Number of the admin who created the meeting';

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings table
-- Allow all authenticated users to read meetings
CREATE POLICY "Allow authenticated users to read meetings" ON meetings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to insert, update, and delete meetings
CREATE POLICY "Allow admins to manage meetings" ON meetings
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM students 
            WHERE s_number = auth.jwt() ->> 's_number' 
            AND is_admin = true
        )
    );

-- Create RLS policies for meeting_attendance table
-- Allow students to read their own attendance records
CREATE POLICY "Allow students to read own attendance" ON meeting_attendance
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        student_s_number = auth.jwt() ->> 's_number'
    );

-- Allow students to insert their own attendance records
CREATE POLICY "Allow students to submit attendance" ON meeting_attendance
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        student_s_number = auth.jwt() ->> 's_number'
    );

-- Allow admins to read all attendance records
CREATE POLICY "Allow admins to read all attendance" ON meeting_attendance
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM students 
            WHERE s_number = auth.jwt() ->> 's_number' 
            AND is_admin = true
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meetings_updated_at 
    BEFORE UPDATE ON meetings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO meetings (meeting_date, meeting_type, attendance_code, is_open, created_by) VALUES
--     ('2025-01-07', 'both', 'ABC123', false, 'admin'),
--     ('2025-01-14', 'both', 'DEF456', true, 'admin'),
--     ('2025-01-21', 'both', 'GHI789', false, 'admin');

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON meetings TO authenticated;
-- GRANT SELECT, INSERT ON meeting_attendance TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE meetings_id_seq TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE meeting_attendance_id_seq TO authenticated; 