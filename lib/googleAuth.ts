import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

// Required for iOS to properly close the auth browser session
WebBrowser.maybeCompleteAuthSession();

/**
 * @returns { error: string | null; session?: Session | null } — null means success or user cancelled
 */
export async function signInWithGoogle(): Promise<{ error: string | null; session?: Session | null }> {
  try {
    // Generate the redirect URL dynamically.
    // Inside Expo Go (LAN, Tunnel, or Localhost), this resolves to exp://...
    // In Standalone APK/AAB builds, this resolves to mobilelearning://
    const redirectUrl = Linking.createURL('/');
    console.log('[GoogleAuth] 🌐 Initiating Google sign-in with redirect URL:', redirectUrl);

    // Ask Supabase to generate the Google OAuth URL
    // skipBrowserRedirect: true means WE control when to open the browser
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error: error.message };
    if (!data.url) return { error: 'Could not generate Google sign-in URL.' };

    // Open the Google consent page inside an in-app browser
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success') {
      const url = result.url;
      console.log('[GoogleAuth] ✅ Redirect received:', url);

      let session: Session | null = null;

      // ── Strategy 1: PKCE flow — URL has ?code= query parameter ──────────────
      // Used by standalone APK builds with mobilelearning:// scheme
      const codeMatch = /[?&]code=([^&#]*)/.exec(url);
      const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;

      if (code) {
        console.log('[GoogleAuth] 🔑 PKCE flow detected, exchanging code for session...');
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) return { error: exchangeError.message };
        session = exchangeData.session;
      } else {
        // ── Strategy 2: Implicit/Token flow — URL has #access_token= hash fragment ──
        // Expo Go (tunnel/LAN) often returns tokens directly in the hash fragment
        const hashPart = url.includes('#') ? url.split('#')[1] : url.split('?').slice(1).join('?');
        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[GoogleAuth] 🔑 Implicit flow detected, setting session from tokens...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) return { error: sessionError.message };
          session = sessionData.session;
        } else {
          console.error('[GoogleAuth] ❌ Could not find code or tokens in redirect URL:', url);
          return { error: 'Failed to retrieve authorization from the Google redirect. Please try again.' };
        }
      }

      // ── Auto-create student profile for first-time Google users ──────────────
      if (session?.user?.id) {
        const userId = session.user.id;
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingProfile) {
          console.log('[GoogleAuth] 🆕 Auto-creating profile for new Google user:', userId);
          const meta = session.user.user_metadata ?? {};
          const fullName = meta.full_name ?? '';
          const nameParts = fullName.trim().split(' ');
          const firstName = meta.first_name ?? nameParts[0] ?? 'Student';
          const lastName = meta.last_name ?? nameParts.slice(1).join(' ') ?? '';

          const { error: profileError } = await supabase
            .from('student_profiles')
            .insert({
              id: userId,
              first_name: firstName,
              last_name: lastName,
              email: session.user.email ?? '',
              matric_number: null,
              department: 'Computer Science',
              level: '100L',
              skills: [],
              hobbies: [],
              avatar_url: meta.avatar_url ?? null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('[GoogleAuth] ⚠️ Failed to auto-create profile:', profileError.message);
          } else {
            console.log('[GoogleAuth] ✅ Profile auto-created successfully!');
          }
        }
      }

      return { error: null, session };
    }

    // User cancelled (closed the browser) — not an error, just return quietly
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { error: null };
    }

    return { error: 'Google sign-in was not completed.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { error: message };
  }
}
