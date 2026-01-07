# 🎯 Resolution Tracker

A comprehensive New Year's resolution tracking application built with Next.js 16, TypeScript, Supabase, and Tailwind CSS v4.

## ✨ Features

- **User Authentication**: Secure sign-up and login with Supabase Auth
- **Year Management**: Create and manage multiple years
- **Resolution Tracking**: Set, track, and complete resolutions for each year
- **Milestone System**: Break down resolutions into smaller, manageable targets
- **Progress Visualization**: Visual progress bars showing completion percentage
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Updates**: Instant updates using Supabase realtime features
- **Row Level Security**: Secure data access with Supabase RLS policies

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- A Supabase account ([sign up free](https://supabase.com))

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at [Supabase](https://supabase.com)
   - Copy your project URL and anon key

3. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials

4. **Set up the database**:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and run the SQL from `scripts/setup-schema.sql`
   - This will create all necessary tables and RLS policies

## 🏃‍♂️ Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
resolution-app/
├── app/                      # Next.js app directory
│   ├── auth/                 # Authentication pages
│   ├── dashboard/           # Dashboard and year pages
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── resolution-card.tsx  # Resolution component
│   └── year-card.tsx        # Year card component
├── lib/                     # Utility libraries
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
└── scripts/                 # Database scripts
    └── setup-schema.sql     # Database schema
```

## 🗄️ Database Schema

The application uses four main tables:

- **profiles**: User profile information
- **years**: Year entries for tracking resolutions
- **resolutions**: Individual resolutions for each year
- **targets**: Milestones/targets for each resolution

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## 🎨 Features

### Authentication
- Email/password authentication
- Secure session management
- Protected routes

### Dashboard
- View all years at a glance
- Create new years
- Delete years (with confirmation)

### Year Details
- View all resolutions for a specific year
- Create, edit, and delete resolutions
- Track overall completion percentage

### Resolution Management
- Mark resolutions as complete/incomplete
- Create milestones (targets) for each resolution
- Track progress with visual progress bars
- Edit and delete resolutions

## 🚀 Deployment

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

## 📄 License

This project is open source and available under the MIT License.

---

**Happy tracking your resolutions! 🎉**

