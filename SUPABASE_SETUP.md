# Supabase Backend Setup Guide

This guide will help you set up your Supabase database to work with the converted Key Club Hub web application.

## Prerequisites

1. A Supabase account (free tier works fine)
2. Your Supabase project URL and anon key (already provided)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note down your project URL and anon key (you already have these)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the entire contents of `database_schema.sql` file
3. Paste it into the SQL editor and run it
4. This will create all the necessary tables, indexes, and sample data

## Step 3: Configure Row Level Security (RLS)

The schema already includes basic RLS policies, but you may want to customize them based on your needs:

### Current RLS Policies:
- **Students**: Can view their own data and submit attendance
- **Admins**: Can view and manage all data
- **Public**: Can view events, announcements, and meetings

### To customize RLS policies:
1. Go to **Authentication > Policies** in your Supabase dashboard
2. Review and modify the policies as needed
3. Test the policies to ensure they work correctly

## Step 4: Test the Connection

1. Open your web application (`http://localhost:8000`)
2. Try logging in with the sample credentials:
   - **Student**: `s123456` / `password123`
   - **Admin**: `admin@example.com` / `password123`

## Step 5: Add Real Users

### Add Students:
```sql
INSERT INTO students (name, s_number, email, password, verified, total_hours) VALUES 
('Your Name', 's123456', 'your.email@student.edu', 'yourpassword', true, 0);
```

### Add Admins:
```sql
INSERT INTO admins (name, email, password) VALUES 
('Your Admin Name', 'your.email@school.edu', 'yourpassword');
```

## Step 6: Configure Authentication (Optional)

For better security, you can enable Supabase Auth:

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Enable email confirmation if desired
3. Configure password policies
4. Set up email templates

## Step 7: Set Up Storage (Optional)

For file uploads (images for announcements):

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `announcements`
3. Set the bucket to public
4. Update the `uploadFile` function in `js/api.js` to use Supabase Storage

## Step 8: Environment Variables

Your environment variables are already configured in `js/config.js`:

```javascript
SUPABASE_URL: 'https://zvoavkzruhnzzeqyihrc.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: 
   - Go to **Settings > API** in Supabase
   - Add your domain to the allowed origins

2. **RLS Policy Errors**:
   - Check the policies in **Authentication > Policies**
   - Ensure the policies match your user roles

3. **Connection Errors**:
   - Verify your Supabase URL and anon key
   - Check the browser console for detailed error messages

4. **Table Not Found**:
   - Run the `database_schema.sql` script again
   - Check that all tables were created successfully

### Testing the API:

You can test the API directly in the browser console:

```javascript
// Test fetching events
fetch('https://zvoavkzruhnzzeqyihrc.supabase.co/rest/v1/events', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## Security Considerations

1. **Passwords**: In production, passwords should be hashed using bcrypt or similar
2. **RLS Policies**: Review and customize the RLS policies for your specific needs
3. **API Keys**: Keep your service role key secret and only use the anon key in the frontend
4. **CORS**: Only allow necessary domains in CORS settings

## Production Deployment

When deploying to production:

1. Update the Supabase URL and keys for your production environment
2. Set up proper CORS policies
3. Configure email templates for authentication
4. Set up monitoring and logging
5. Consider using environment variables for sensitive data

## Support

If you encounter issues:

1. Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the browser console for error messages
3. Check the Supabase dashboard logs
4. Test individual API endpoints

## Next Steps

Once your backend is working:

1. Add real student and admin accounts
2. Create real events and announcements
3. Test all features thoroughly
4. Customize the UI and functionality as needed
5. Deploy to production

Your Key Club Hub application is now fully functional with a real Supabase backend! 🎉 