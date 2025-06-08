import React, { useEffect, useState } from 'react';
import { Check, Loader2, Flame, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HabitWithCompletion, HabitCompletion } from '../types/habit';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

interface StreakInfo {
  current: number;
  longest: number;
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

export function HabitList() {
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [streaks, setStreaks] = useState<Record<string, StreakInfo>>({});

  useEffect(() => {
    fetchHabits();
    // Reset habits at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const timer = setTimeout(() => {
      fetchHabits();
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  const fetchHabits = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if user is a guest
      const isGuest = localStorage.getItem('guestStartDate') !== null;
      
      if (isGuest) {
        // Fetch guest habits from localStorage
        const guestHabits: GuestHabit[] = JSON.parse(localStorage.getItem('guestHabits') || '[]');
        const guestCompletions: GuestCompletion[] = JSON.parse(localStorage.getItem('guestCompletions') || '[]');
        
        const habitsWithCompletions: HabitWithCompletion[] = guestHabits.map(habit => ({
          ...habit,
          completion: guestCompletions.find(c => c.habit_id === habit.id && c.date === today) as HabitCompletion | undefined
        }));

        setHabits(habitsWithCompletions);
        calculateStreaks(guestHabits, guestCompletions);
      } else if (user) {
        // Fetch authenticated user habits from Supabase
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (habitsError) throw habitsError;

        const { data: completions, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (completionsError) throw completionsError;

        const habitsWithCompletions = habits.map(habit => ({
          ...habit,
          completion: completions.find(c => c.habit_id === habit.id && c.date === today)
        }));

        setHabits(habitsWithCompletions);
        calculateStreaks(habits, completions);
      } else {
        setHabits([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreaks = (habits: GuestHabit[], completions: GuestCompletion[]) => {
    const streakInfo: Record<string, StreakInfo> = {};
    
    habits.forEach(habit => {
      const habitCompletions = completions
        .filter(c => c.habit_id === habit.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < habitCompletions.length; i++) {
        const currentDate = new Date(habitCompletions[i].date);
        const nextDate = i < habitCompletions.length - 1 ? new Date(habitCompletions[i + 1].date) : null;

        if (isToday(currentDate)) {
          currentStreak++;
          tempStreak++;
        } else if (isYesterday(currentDate) && currentStreak === 0) {
          currentStreak++;
          tempStreak++;
        } else if (nextDate && differenceInDays(currentDate, nextDate) === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      streakInfo[habit.id] = { current: currentStreak, longest: longestStreak };
    });

    setStreaks(streakInfo);
  };

  const toggleCompletion = async (habitId: string) => {
    try {
      setUpdating(habitId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = format(today, 'yyyy-MM-dd');

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const isGuest = localStorage.getItem('guestStartDate') !== null;

      // Check if the habit is completed
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const isCompleted = habit.completion !== undefined;

      // If unchecking, show confirmation dialog
      if (isCompleted) {
        const confirmUncheck = window.confirm('Are you sure you want to revert your progress? This action cannot be undone.');
        if (!confirmUncheck) {
          setUpdating(null);
          return;
        }
      }

      // First, update the storage
      if (isGuest) {
        const guestHabits = JSON.parse(localStorage.getItem('guestHabits') || '[]') as GuestHabit[];
        const guestCompletions = JSON.parse(localStorage.getItem('guestCompletions') || '[]') as GuestCompletion[];
        
        if (isCompleted) {
          // Update completion to false
          const updatedCompletions = guestCompletions.map(c => 
            c.habit_id === habitId && c.date === todayStr
              ? { ...c, completed: false }
              : c
          );
          localStorage.setItem('guestCompletions', JSON.stringify(updatedCompletions));
        } else {
          // Add completion
          const newCompletion: GuestCompletion = {
            id: crypto.randomUUID(),
            habit_id: habitId,
            completed_at: today.toISOString(),
            date: todayStr,
            completed: true
          };
          localStorage.setItem('guestCompletions', JSON.stringify([...guestCompletions, newCompletion]));
        }
      } else if (currentUser) {
        // Always upsert the record with the new completed status
        console.log('Updating completion status...');
        const { error } = await supabase
          .from('habit_completions')
          .upsert([{
            habit_id: habitId,
            user_id: currentUser.id,
            completed_at: today.toISOString(),
            date: todayStr,
            completed: !isCompleted
          }], {
            onConflict: 'habit_id,date'
          });

        if (error) {
          console.error('Error updating completion:', error);
          throw error;
        }

        console.log('Successfully updated completion status');
      }

      // Then update local state
      setHabits(prevHabits => 
        prevHabits.map(habit => {
          if (habit.id === habitId) {
            if (isCompleted) {
              // Update completion to false
              return {
                ...habit,
                completion: {
                  ...habit.completion!,
                  completed: false
                }
              };
            } else {
              // Add completion
              const newCompletion: HabitCompletion = {
                id: crypto.randomUUID(),
                habit_id: habitId,
                user_id: currentUser?.id || 'guest',
                completed_at: today.toISOString(),
                date: todayStr,
                completed: true
              };
              return {
                ...habit,
                completion: newCompletion
              };
            }
          }
          return habit;
        })
      );

      // Finally, refresh the data
      await fetchHabits();
    } catch (error) {
      console.error('Error toggling completion:', error);
      setError('Failed to update habit completion');
    } finally {
      setUpdating(null);
    }
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

  if (habits.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No habits created yet. Start by creating a new habit above!
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      {habits.map(habit => (
        <div
          key={habit.id}
          className={`bg-white rounded-lg shadow-sm p-4 flex items-center justify-between transition-colors ${
            habit.completion ? 'bg-green-50' : ''
          }`}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleCompletion(habit.id)}
              disabled={updating === habit.id}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                habit.completion
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-500'
              }`}
              aria-label={`Mark ${habit.name} as ${habit.completion ? 'incomplete' : 'complete'}`}
            >
              {updating === habit.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : habit.completion ? (
                <Check className="w-4 h-4" />
              ) : null}
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{habit.name}</h3>
                {streaks[habit.id]?.current > 0 && (
                  <div className="flex items-center text-sm text-orange-500">
                    <Flame className="w-4 h-4" />
                    <span>{streaks[habit.id].current}</span>
                  </div>
                )}
              </div>
              {habit.description && (
                <p className="text-sm text-gray-500">{habit.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {habit.completion && (
              <span className="text-sm text-gray-500">
                Completed at {format(new Date(habit.completion.completed_at), 'h:mm a')}
              </span>
            )}
            {streaks[habit.id]?.longest > 0 && (
              <div className="flex items-center text-sm text-gray-500" title="Longest streak">
                <Info className="w-4 h-4 mr-1" />
                {streaks[habit.id].longest} days
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}