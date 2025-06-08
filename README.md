# Habit Tracker

A modern, full-stack habit tracking application built with React, TypeScript, and Supabase. Track your daily habits, monitor your progress, and build lasting positive behaviors with an intuitive interface and powerful features.

## ✨ Features

### Core Functionality
- **Create Custom Habits**: Add personalized habits with names and descriptions
- **Daily Progress Tracking**: Mark habits as complete each day with a simple interface
- **7-Day Progress View**: Visual progress table showing your last 7 days of activity
- **Streak Tracking**: Monitor your consecutive day streaks with flame icons
- **Habit Management**: Edit and delete existing habits

### User Experience
- **Guest Mode**: Try the app without signing up - perfect for getting started
- **Account Migration**: Seamlessly transition from guest to authenticated user after 3 days
- **Responsive Design**: Works beautifully on desktop and mobile devices
- **Real-time Updates**: Instant feedback on habit completions and progress

### Authentication & Data
- **Supabase Authentication**: Secure sign-in with Google OAuth
- **Cloud Sync**: Habits and progress sync across all your devices
- **Local Storage Fallback**: Guest users store data locally
- **Data Persistence**: Never lose your progress with reliable backend storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd habit-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase database**
   Run the migrations in your Supabase dashboard:
   ```sql
   -- Create habits table
   CREATE TABLE habits (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     description text,
     frequency text DEFAULT 'daily',
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at timestamptz DEFAULT now()
   );

   -- Create habit_completions table
   CREATE TABLE habit_completions (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     completed_at timestamptz DEFAULT now(),
     date date DEFAULT CURRENT_DATE,
     completed boolean DEFAULT false,
     UNIQUE(habit_id, date)
   );
   ```

   Enable Row Level Security (RLS) and set up appropriate policies for both tables.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with excellent IDE support
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **React Router** - Client-side routing and navigation
- **Lucide React** - Beautiful and consistent icons

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Auth** - Authentication with social providers
- **Row Level Security** - Database-level security policies

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing with Tailwind
- **Date-fns** - Modern date utility library

## 📱 User Journey

### For New Users
1. **Landing Page**: Welcome screen with sign-in options
2. **Guest Mode**: Option to try the app without creating an account
3. **Habit Creation**: Simple form to add your first habits
4. **Daily Tracking**: Intuitive interface to mark habits complete
5. **Progress Visualization**: See your progress over the last 7 days

### For Returning Users
1. **Seamless Sign-in**: Quick authentication with Google
2. **Habit Dashboard**: Overview of all your habits and today's progress
3. **Streak Tracking**: Visual feedback on consecutive day achievements
4. **Long-term Insights**: Historical data and progress trends

## 🗂️ Project Structure

```
src/
├── components/           # React components
│   ├── Auth.tsx         # Authentication component
│   ├── AuthCallback.tsx # OAuth callback handler
│   ├── HabitForm.tsx    # Habit creation form
│   ├── HabitList.tsx    # Habit list with completion tracking
│   └── ProgressView.tsx # 7-day progress visualization
├── lib/                 # Utility libraries
│   └── supabase.ts      # Supabase client configuration
├── types/               # TypeScript type definitions
│   └── habit.ts         # Habit and completion types
├── utils/               # Utility functions
├── App.tsx              # Main application component
└── main.tsx            # Application entry point

supabase/
└── migrations/          # Database migration files
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authenticated Routes**: Protected routes for authenticated users
- **Secure Authentication**: OAuth integration with Supabase Auth
- **Data Validation**: Client and server-side validation for all inputs
- **Guest Data Isolation**: Guest users' data is stored locally and isolated

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Features for Developers
- **TypeScript**: Full type safety across the application
- **Component Architecture**: Modular, reusable React components
- **State Management**: React hooks for local state management
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🎯 Future Enhancements

- **Habit Categories**: Organize habits by categories (health, productivity, etc.)
- **Weekly/Monthly Goals**: Set and track longer-term objectives
- **Habit Statistics**: Detailed analytics and insights
- **Reminder Notifications**: Push notifications for habit reminders
- **Social Features**: Share progress with friends and family
- **Habit Templates**: Pre-built habit templates for common goals
- **Dark Mode**: Dark theme for better user experience
- **Data Export**: Export habit data for external analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for providing an excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide React** for beautiful icons
- **React Community** for the amazing ecosystem and tools

---

Start building better habits today with this powerful, user-friendly habit tracker! 🌟 