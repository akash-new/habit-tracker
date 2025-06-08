import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HabitForm } from './components/HabitForm';
import { HabitList } from './components/HabitList';
import { ProgressView } from './components/ProgressView';
import { Auth } from './components/Auth';
import { AuthCallback } from './components/AuthCallback';
import { supabase } from './lib/supabase';
import { LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for guest user
    const guestStartDate = localStorage.getItem('guestStartDate');
    if (guestStartDate) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    // Check for authenticated session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsGuest(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (isGuest) {
      localStorage.removeItem('guestStartDate');
      localStorage.removeItem('guestHabits');
      localStorage.removeItem('guestCompletions');
      setIsGuest(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Habit Tracker</h1>
              {(session || isGuest) && (
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <>
                  {!session && !isGuest && <Auth />}
                  {(session || isGuest) && (
                    <>
                      <HabitForm />
                      <HabitList />
                      <ProgressView />
                    </>
                  )}
                </>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;