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
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[signOut] Exception:', e);
    } finally {
      // Always clear — even if Supabase fails
      set({ session: null, user: null, profile: null, isLoading: false });
    }
  },

  fetchProfile: async () => {
    // Read fresh session directly from Supabase client, NOT from store state
    // (avoids timing bugs where store hasn't been updated yet)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.warn('[fetchProfile] ❌ No active session — cannot fetch profile');
      set({ profile: null });
      return;
    }

    console.log('[fetchProfile] 🔍 Fetching profile for userId:', userId);

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // won't throw if row doesn't exist

      if (error) {
        console.error('[fetchProfile] ❌ DB Query Error:', error.code, '-', error.message);
        if (error.hint) console.error('[fetchProfile] Hint:', error.hint);
        set({ profile: null });
        return;
      }

      if (!data) {
        console.log('[fetchProfile] ℹ️  No profile row yet for this user (expected during signup flow).');
        set({ profile: null });
        return;
      }

      console.log('[fetchProfile] ✅ Profile loaded successfully:');
      console.log('  - Name:', data.first_name, data.last_name);
      console.log('  - Email:', data.email);
      console.log('  - Matric:', data.matric_number ?? 'NOT SET');
      console.log('  - Created At:', data.created_at);
      
      set({ profile: data });
    } catch (err: any) {
      console.error('[fetchProfile] ❌ Unexpected error:', err.message);
      set({ profile: null });
    }
  },

  updateProfile: async (updates) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('student_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[updateProfile] Error:', error.code, error.message);
      throw new Error(error.message);
    }
    if (data) {
      const { profile } = get();
      set({ profile: { ...profile!, ...data } });
    }
  },
}));
