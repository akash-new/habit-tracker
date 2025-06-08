import { Habit } from '../types/habit';

const STORAGE_KEY = 'habits';
const MAX_HABITS = 10;

export const storage = {
  getHabits(): Habit[] {
    const habits = localStorage.getItem(STORAGE_KEY);
    return habits ? JSON.parse(habits) : [];
  },

  saveHabit(habit: Habit): void {
    const habits = this.getHabits();
    if (habits.length >= MAX_HABITS) {
      throw new Error('Maximum number of habits reached');
    }
    habits.push(habit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  },

  getHabitCount(): number {
    return this.getHabits().length;
  }
};