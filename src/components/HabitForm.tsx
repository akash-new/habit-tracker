import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Habit, HabitFormData } from '../types/habit';
import { supabase } from '../lib/supabase';

export function HabitForm() {
  const [formData, setFormData] = useState<HabitFormData>({
    name: '',
    description: '',
    frequency: 'daily',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (formData.name.length < 2 || formData.name.length > 50) {
        throw new Error('Habit name must be between 2 and 50 characters');
      }

      if (formData.description && formData.description.length > 200) {
        throw new Error('Description cannot exceed 200 characters');
      }

      // Check if user is a guest
      const isGuest = localStorage.getItem('guestStartDate') !== null;

      if (isGuest) {
        // Handle guest habits in localStorage
        const guestHabits = JSON.parse(localStorage.getItem('guestHabits') || '[]');
        
        if (guestHabits.length >= 10) {
          throw new Error('You have reached the maximum number of habits');
        }

        const newHabit = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          frequency: formData.frequency,
          createdAt: new Date()
        };

        guestHabits.push(newHabit);
        localStorage.setItem('guestHabits', JSON.stringify(guestHabits));
        setSuccess('Habit created successfully!');
        // Refresh the page after a short delay to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Handle authenticated user habits in Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        const { data: habits, error: countError } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user.id);

        if (countError) throw new Error('Failed to check habits count');
        if (habits.length >= 10) {
          throw new Error('You have reached the maximum number of habits');
        }

        const { error: insertError } = await supabase
          .from('habits')
          .insert({
            name: formData.name,
            description: formData.description,
            frequency: formData.frequency,
            user_id: user.id
          });

        if (insertError) throw new Error('Failed to create habit');
        setSuccess('Habit created successfully!');
        // Refresh the page after a short delay to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      setFormData({ name: '', description: '', frequency: 'daily' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Habit</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Habit Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter habit name"
            required
            minLength={2}
            maxLength={50}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.name.length}/50 characters
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter habit description"
            maxLength={200}
            rows={3}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.description?.length || 0}/200 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Habit'}
        </button>
      </form>
    </div>
  );
}