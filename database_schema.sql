-- Key Club Hub Database Schema for Supabase
-- This file contains all the SQL commands needed to set up the database tables

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE hour_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE meeting_type AS ENUM ('morning', 'afternoon');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');

-- Students table
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    s_number VARCHAR(10) UNIQUE NOT NULL CHECK (s_number ~ '^s[0-9]{6}$'),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#4299e1',
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

-- Hour requests table
CREATE TABLE hour_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_s_number VARCHAR(10) REFERENCES students(s_number),
    student_name VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    hours_requested DECIMAL(4,2) NOT NULL,
    description TEXT NOT NULL,
    status hour_request_status DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES admins(id),
    admin_notes TEXT,
    image_name VARCHAR(255)
);

-- Announcements table
CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url VARCHAR(500),
    image_filename VARCHAR(255),
    priority announcement_priority DEFAULT 'medium'
);

-- Meetings table
CREATE TABLE meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    meeting_type meeting_type NOT NULL,
    is_open BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance codes table
CREATE TABLE attendance_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    code VARCHAR(10) UNIQUE NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Meeting attendance table
CREATE TABLE meeting_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_s_number VARCHAR(10) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, student_id)
);

-- Support questions table
CREATE TABLE support_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    s_number VARCHAR(10) REFERENCES students(s_number),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_students_s_number ON students(s_number);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_hour_requests_student ON hour_requests(student_s_number);
CREATE INDEX idx_hour_requests_status ON hour_requests(status);
CREATE INDEX idx_meeting_attendance_meeting ON meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_student ON meeting_attendance(student_id);
CREATE INDEX idx_attendance_codes_code ON attendance_codes(code);
CREATE INDEX idx_attendance_codes_meeting ON attendance_codes(meeting_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user
INSERT INTO admins (name, email, password) VALUES 
('Admin User', 'admin@example.com', 'password123');

-- Insert sample students
INSERT INTO students (name, s_number, email, password, verified, total_hours) VALUES 
('John Doe', 's123456', 'john.doe@student.edu', 'password123', true, 15.5),
('Jane Smith', 's789012', 'jane.smith@student.edu', 'password123', true, 22.0),
('Mike Johnson', 's345678', 'mike.johnson@student.edu', 'password123', false, 8.0),
('Sarah Wilson', 's901234', 'sarah.wilson@student.edu', 'password123', true, 18.5);

-- Insert sample events
INSERT INTO events (title, description, location, date, start_time, end_time, capacity, color, created_by) VALUES 
('Community Service Day', 'Join us for a day of community service at the local park.', 'Central Park', '2024-03-15', '09:00', '15:00', 50, '#4299e1', (SELECT id FROM admins LIMIT 1)),
('Fundraising Event', 'Help us raise funds for our community projects.', 'School Gymnasium', '2024-03-20', '18:00', '21:00', 100, '#48bb78', (SELECT id FROM admins LIMIT 1)),
('Leadership Workshop', 'Develop your leadership skills with our interactive workshop.', 'Room 201', '2024-03-25', '14:00', '16:00', 30, '#ed8936', (SELECT id FROM admins LIMIT 1));

-- Insert sample announcements
INSERT INTO announcements (title, message, created_by, priority) VALUES 
('Welcome to Key Club!', 'Welcome to the new school year! We have exciting events planned for this semester.', (SELECT id FROM admins LIMIT 1), 'high'),
('Community Service Day Registration Open', 'Registration for our upcoming Community Service Day is now open. Limited spots available!', (SELECT id FROM admins LIMIT 1), 'medium');

-- Insert sample meetings
INSERT INTO meetings (title, description, date, time, meeting_type, is_open, created_by) VALUES 
('Weekly Meeting', 'Regular weekly club meeting', '2024-03-10', '14:00', 'afternoon', false, (SELECT id FROM admins LIMIT 1)),
('Leadership Meeting', 'Leadership team meeting', '2024-03-17', '15:00', 'afternoon', true, (SELECT id FROM admins LIMIT 1));

-- Enable Row Level Security (RLS) policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
-- Students can read their own data
CREATE POLICY "Students can view own data" ON students FOR SELECT USING (auth.uid()::text = id::text);

-- Admins can read all student data
CREATE POLICY "Admins can view all students" ON students FOR ALL USING (true);

-- Anyone can read events
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);

-- Admins can manage events
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (true);

-- Anyone can read announcements
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (true);

-- Students can view their own hour requests
CREATE POLICY "Students can view own hour requests" ON hour_requests FOR SELECT USING (student_s_number = (SELECT s_number FROM students WHERE id::text = auth.uid()::text));

-- Admins can manage all hour requests
CREATE POLICY "Admins can manage hour requests" ON hour_requests FOR ALL USING (true);

-- Anyone can read meetings
CREATE POLICY "Anyone can view meetings" ON meetings FOR SELECT USING (true);

-- Admins can manage meetings
CREATE POLICY "Admins can manage meetings" ON meetings FOR ALL USING (true);

-- Students can submit attendance
CREATE POLICY "Students can submit attendance" ON meeting_attendance FOR INSERT WITH CHECK (student_s_number = (SELECT s_number FROM students WHERE id::text = auth.uid()::text));

-- Anyone can read attendance
CREATE POLICY "Anyone can view attendance" ON meeting_attendance FOR SELECT USING (true);

-- Admins can manage attendance codes
CREATE POLICY "Admins can manage attendance codes" ON attendance_codes FOR ALL USING (true);

-- Anyone can submit support questions
CREATE POLICY "Anyone can submit support questions" ON support_questions FOR INSERT WITH CHECK (true);

-- Admins can view all support questions
CREATE POLICY "Admins can view support questions" ON support_questions FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 