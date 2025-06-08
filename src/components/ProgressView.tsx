import React, { useEffect, useState } from 'react';
import { Check, X, Loader2, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Habit, HabitCompletion } from '../types/habit';
import { format, subDays, isToday, isYesterday, differenceInDays } from 'date-fns';

interface ProgressData {
  habit: Habit;
  completions: Record<string, boolean>;
  streak: number;
}

interface GuestHabit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily';
  createdAt: Date;
}

interface GuestCompletion {
  id: string;
  habit_id: string;
  date: string;
  completed_at: string;
}

export function ProgressView() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProgressData();
    // Reset data at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const timer = setTimeout(() => {
      fetchProgressData();
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  const fetchProgressData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isGuest = localStorage.getItem('guestStartDate') !== null;
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => 
        format(subDays(today, i), 'yyyy-MM-dd')
      );

      if (isGuest) {
        // Fetch guest data from localStorage
        const guestHabits: GuestHabit[] = JSON.parse(localStorage.getItem('guestHabits') || '[]');
        const guestCompletions: GuestCompletion[] = JSON.parse(localStorage.getItem('guestCompletions') || '[]');

        const progress = guestHabits.map(habit => {
          const completions: Record<string, boolean> = {};
          last7Days.forEach(date => {
            completions[date] = guestCompletions.some(
              c => c.habit_id === habit.id && c.date === date
            );
          });

          const streak = calculateStreak(completions, last7Days);

          return {
            habit,
            completions,
            streak
          };
        });

        setProgressData(progress);
      } else if (user) {
        // Fetch authenticated user data from Supabase
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);

        if (habitsError) throw habitsError;

        const { data: completions, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .in('date', last7Days);

        if (completionsError) throw completionsError;

        const progress = habits.map(habit => {
          const habitCompletions: Record<string, boolean> = {};
          last7Days.forEach(date => {
            habitCompletions[date] = completions.some(
              c => c.habit_id === habit.id && c.date === date
            );
          });

          const streak = calculateStreak(habitCompletions, last7Days);

          return {
            habit,
            completions: habitCompletions,
            streak
          };
        });

        setProgressData(progress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (completions: Record<string, boolean>, dates: string[]): number => {
    let streak = 0;
    for (const date of dates) {
      if (completions[date]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No habits to track yet. Create a habit to see your progress!
      </div>
    );
  }

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => 
    format(subDays(today, i), 'yyyy-MM-dd')
  );

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">7-Day Progress</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-sm">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Habit</th>
              {last7Days.map(date => (
                <th key={date} className="py-3 px-4 text-center text-sm font-medium text-gray-500">
                  {format(new Date(date), 'EEE')}
                </th>
              ))}
              <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {progressData.map(({ habit, completions, streak }) => (
              <tr key={habit.id}>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{habit.name}</span>
                    {habit.description && (
                      <span className="ml-2 text-sm text-gray-500">({habit.description})</span>
                    )}
                  </div>
                </td>
                {last7Days.map(date => (
                  <td key={date} className="py-4 px-4 text-center">
                    {completions[date] ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
                <td className="py-4 px-4 text-center">
                  {streak > 0 && (
                    <div className="flex items-center justify-center text-orange-500">
                      <Flame className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">{streak}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 