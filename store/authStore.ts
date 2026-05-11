import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  matric_number: string;
  department: string;
  level: string;
  phone?: string;
  bio?: string;
  skills: string[];
  hobbies: string[];
  linkedin_url?: string;
  portfolio_url?: string;
  avatar_url?: string;
  cover_url?: string;
  gpa?: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: StudentProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: StudentProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) => {
    const currentUserId = get().user?.id;
    const newUserId = session?.user?.id;
    // If the user has changed (including sign-out), wipe the cached profile
    if (currentUserId !== newUserId) {
      set({ session, user: session?.user ?? null, profile: null });
    } else {
      set({ session, user: session?.user ?? null });
    }
  },

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, isLoading: false });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      set({ profile: data });
    }
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('student_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[updateProfile] Supabase error:', error);
      throw new Error(error.message);
    }
    if (data) {
      set({ profile: { ...profile!, ...data } });
    }
  },
}));
