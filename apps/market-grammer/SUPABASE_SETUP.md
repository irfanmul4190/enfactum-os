# Supabase Integration Setup - Market-Grammer App

## ✅ Completed Steps

### 1. **Installed Supabase Dependency**
- Added `@supabase/supabase-js` to package.json
- Run `npm install` or `bun install` to install the new dependency

### 2. **Created Supabase Client** 
- File: `src/lib/supabase.ts`
- Initializes the Supabase client using environment variables
- Reads credentials from `.env.local`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 3. **Environment Configuration**
- File: `.env.local` (created with your credentials)
- ⚠️ **Important**: This file contains secrets and is listed in `.gitignore`
- Never commit this file to version control

### 4. **Updated Like/Dislike Buttons**
- File: `src/components/PromptCard.tsx`
- Modified the `handleRate()` function to:
  - Still track with PostHog for existing analytics
  - **NEW**: Insert feedback data into Supabase's `report_feedback` table
  - Capture the following data:
    - `prompt_id`: The prompt's unique ID
    - `prompt_title`: Title of the prompt
    - `tool`: AI tool used (Claude, Midjourney, etc.)
    - `rating`: User's feedback ("up" or "down")
    - `section`: Which section of the app (e.g., "copy_templates")
    - `page`: Which page the prompt appeared on
    - `created_at`: Timestamp of the feedback

## 📋 Database Schema Expected

Your `report_feedback` table should have at least these columns:

```sql
CREATE TABLE report_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id text,
  prompt_title text,
  tool text,
  rating text (must be 'up' or 'down'),
  section text,
  page text,
  created_at timestamp
);
```

## 🚀 Next Steps

1. **Install Dependencies**
   ```bash
   cd apps/market-grammer
   npm install
   # or
   bun install
   ```

2. **Verify Supabase Setup**
   - Ensure your Supabase project has the `report_feedback` table created
   - Check that your credentials in `.env.local` are correct

3. **Test the Integration**
   - Run the app: `npm run dev`
   - Click the Like/Dislike buttons on prompts
   - Check your Supabase dashboard to see new entries in the `report_feedback` table

## 🔒 Security Notes

- The `.env.local` file is ignored by git (see `.gitignore`)
- The Anon Key used here has limited permissions and is safe for client-side use
- For production, ensure Row Level Security (RLS) policies are set up on your table
- Only allow users to insert their own feedback entries

## 📝 Files Modified/Created

- ✅ Modified: `package.json` (added Supabase dependency)
- ✅ Created: `src/lib/supabase.ts` (Supabase client initialization)
- ✅ Created: `.env.local` (environment variables with your credentials)
- ✅ Modified: `src/components/PromptCard.tsx` (integrated feedback insertion)
