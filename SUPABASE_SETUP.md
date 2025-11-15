# 🗄️ Supabase Setup Guide for ClimaGuard

This guide will help you set up Supabase for the ClimaGuard project to enable user authentication, alert preferences, and notification history.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js & npm**: Already installed for the project

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: `climaguard` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users (probably Europe/Asia for Mauritius)
4. Click "Create new project"
5. Wait 2-3 minutes for project setup

## 🔑 Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (different from anon key)

## ⚙️ Step 3: Configure Environment Variables

1. Open `apps/web/.env.local` (already created in the project)
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

⚠️ **Important**: Never commit the `.env.local` file with real credentials to Git!

## 🗃️ Step 4: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents from `src/lib/database.sql`
4. Click **Run** to execute the SQL

This will create:
- `profiles` table for user information
- `alert_preferences` table for notification settings
- `notification_history` table for alert tracking
- Row Level Security (RLS) policies
- Automatic triggers for new users

## 🔐 Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:

### Site URL Configuration:
- **Site URL**: `http://localhost:3000` (for development)
- **Redirect URLs**: 
  - `http://localhost:3000/dashboard`
  - `http://localhost:3000/auth`

### Email Settings:
- Enable **Email confirmation**
- Customize email templates if needed

### Social Providers (Optional):
- Enable **Google** provider if desired
- Add OAuth credentials

## 📱 Step 6: Test the Setup

1. Start your Next.js application:
```bash
cd apps/web
npm run dev
```

2. Navigate to `http://localhost:3000/auth`
3. Try signing up with a test email
4. Check your email for confirmation
5. After confirming, try logging in

## 🧪 Step 7: Verify Database

1. In Supabase dashboard, go to **Table Editor**
2. You should see three tables:
   - `profiles`
   - `alert_preferences` 
   - `notification_history`

3. After signing up a test user, check:
   - `profiles` table should have your user data
   - `alert_preferences` table should have default preferences

## 🎯 Features Enabled

Once setup is complete, your ClimaGuard app will have:

### ✅ User Authentication
- Email/password signup and login
- Email confirmation
- Password reset
- Social login (Google)

### ✅ User Profiles  
- Personal information management
- Phone number for SMS alerts
- Location selection (Mauritius cities)

### ✅ Alert Preferences
- Toggle cyclone/flood/wind alerts
- Choose delivery methods (SMS/Telegram/Email)
- Set alert radius and priority level

### ✅ Notification History
- Track all sent alerts
- Monitor delivery status
- View alert history by type

## 🚀 For Code4Good Demo

The authentication system is designed to showcase:

1. **User Onboarding**: Quick signup process
2. **Personalization**: Location-based alerts
3. **Multi-Channel**: SMS, Telegram, Email preferences  
4. **Analytics**: Notification delivery tracking
5. **Security**: Row-level security for data protection

## 🔧 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**:
   - Restart Next.js server after changing `.env.local`
   - Check file is named exactly `.env.local`

2. **Database Connection Errors**:
   - Verify Supabase URL and keys are correct
   - Check Supabase project is active (not paused)

3. **Authentication Redirects**:
   - Ensure Site URL matches your development URL
   - Add all redirect URLs in Supabase settings

4. **RLS Policy Errors**:
   - Check SQL schema was executed completely
   - Verify user ID matches in authentication

### Getting Help:

- Check Supabase [documentation](https://supabase.com/docs)
- Review browser console for error messages
- Check Supabase dashboard logs for backend errors

## 🎨 Next Steps

After basic setup works:

1. **SMS Integration**: Add Twilio or similar SMS provider
2. **Telegram Bot**: Create Telegram bot for rich notifications  
3. **Production Deployment**: Update environment variables for production
4. **Advanced Features**: Real-time subscriptions, webhooks

## 📊 Database Schema Overview

The database is designed for scalability:

```
auth.users (Supabase managed)
├── profiles (user details)
│   ├── alert_preferences (notification settings)
│   └── notification_history (alert tracking)
```

Each user gets:
- One profile record
- One alert preferences record  
- Multiple notification history records

This structure supports the Code4Good demo requirements while being production-ready for scaling to thousands of Mauritius residents.

---

🌡️ **ClimaGuard** - Protecting communities through AI-powered climate risk prediction