# Supabase Database Setup for Excalidraw

This document provides instructions for setting up the Supabase database tables and storage bucket required for Excalidraw collaboration features.

## Prerequisites

1. A Supabase project (you already have one configured)
2. Access to your Supabase dashboard

## Database Configuration

Your Supabase project is already configured in the environment variables:
- **URL**: https://ubwkhhkxwysbdxorbxoq.supabase.co
- **Anon Key**: Configured in `.env.development` and `.env.production`

## Steps to Set Up Database

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Sign in and select your project

2. **Apply Database Migration**
   - In your Supabase dashboard, go to **SQL Editor**
   - Create a new query
   - Copy and paste the contents of `supabase-migration.sql`
   - Click **Run** to execute the migration

3. **Verify Setup**
   - Check that the `scenes` table was created in your **Database > Tables** section
   - Check that the `excalidraw-files` bucket was created in your **Storage** section

## What the Migration Creates

### Database Table: `scenes`
- **Purpose**: Stores encrypted collaborative room data
- **Columns**:
  - `id` (TEXT, PRIMARY KEY): Room identifier
  - `scene_version` (INTEGER): Version number for optimistic concurrency
  - `iv` (TEXT): Base64 encoded initialization vector for encryption
  - `ciphertext` (TEXT): Base64 encoded encrypted scene data
  - `created_at` (TIMESTAMPTZ): Creation timestamp
  - `updated_at` (TIMESTAMPTZ): Last update timestamp

### Storage Bucket: `excalidraw-files`
- **Purpose**: Stores uploaded files (images, etc.) for collaborative drawings
- **Configuration**: Private bucket with upload/download policies

### Security Features
- **Row Level Security (RLS)** enabled on the `scenes` table
- **Storage policies** for file access control
- **Encryption**: All scene data is encrypted using room-specific keys

## Testing the Setup

After applying the migration, test the collaboration features:

1. Start the development server:
   ```bash
   cd excalidraw-app
   npm run dev
   ```

2. Create a collaborative room and verify that:
   - Scenes save without the "Couldn't save to the backend database" error
   - Files can be uploaded and accessed
   - Multiple users can collaborate in real-time

## Troubleshooting

If you encounter issues:

1. **Check Supabase Logs**: Go to **Reports > Logs** in your Supabase dashboard
2. **Verify Environment Variables**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` are correctly set
3. **Test Connection**: The Supabase client should initialize without errors when the app starts

## Production Considerations

For production deployment:
- Consider implementing more restrictive RLS policies if your use case requires authentication
- Set up monitoring and alerts for database usage
- Configure backup strategies for your data
- Consider using the cleanup function for old scene data management

## Cleanup (Development Only)

For development/testing, you can clean up old scenes:
```sql
SELECT cleanup_old_scenes(7); -- Delete scenes older than 7 days
