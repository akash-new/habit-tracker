import { useEffect, useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

export function Auth() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if user is a guest
    const guestStartDate = localStorage.getItem('guestStartDate');
    if (guestStartDate) {
      setIsGuest(true);
      const daysSinceStart = (Date.now() - new Date(guestStartDate).getTime()) / (1000 * 60 * 60 * 24);
      setShowSignUp(daysSinceStart >= 3);
    }
  }, []);

  const continueAsGuest = () => {
    // Set guest start date if not already set
    if (!localStorage.getItem('guestStartDate')) {
      localStorage.setItem('guestStartDate', new Date().toISOString());
    }

    // Initialize guest habits if not already set
    if (!localStorage.getItem('guestHabits')) {
      localStorage.setItem('guestHabits', JSON.stringify([]));
    }

    // Initialize guest completions if not already set
    if (!localStorage.getItem('guestCompletions')) {
      localStorage.setItem('guestCompletions', JSON.stringify([]));
    }

    setIsGuest(true);
    setShowSignUp(false);
  };

  if (isGuest && !showSignUp) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <LogIn className="w-8 h-8 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Habit Tracker</h2>
        </div>

        {showSignUp ? (
          <>
            <p className="text-gray-600 mb-6 text-center">
              You've been using Habit Tracker for 3 days! Sign in to save your progress and access more features.
            </p>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
              redirectTo={`${window.location.origin}/auth/callback`}
            />
            <button
              onClick={() => setShowSignUp(false)}
              className="mt-4 w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              Remind me later
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Sign in to track your habits and sync across devices
            </p>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
              redirectTo={`${window.location.origin}/auth/callback`}
            />
            <div className="mt-4 text-center">
              <button
                onClick={continueAsGuest}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Continue as guest
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}