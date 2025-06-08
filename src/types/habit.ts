export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily';
  userId?: string;
  createdAt: Date;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  date: string;
  completed: boolean;
}

export type HabitWithCompletion = Habit & {
  completion?: HabitCompletion;
};

export type HabitFormData = Omit<Habit, 'id' | 'userId' | 'createdAt'>;