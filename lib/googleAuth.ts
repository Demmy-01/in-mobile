import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Required for iOS to properly close the auth browser session
WebBrowser.maybeCompleteAuthSession();

// Hardcode the redirect URL to exactly match what's in Supabase's allowed list.
// Linking.createURL can produce inconsistent results (e.g. triple-slash) in Expo Go.
const REDIRECT_URL = 'mobilelearning://';

/**
 * @returns { error: string | null } — null means success or user cancelled
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const redirectUrl = REDIRECT_URL;

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
      // Exchange the authorization code in the redirect URL for a Supabase session
      await supabase.auth.exchangeCodeForSession(result.url);
      return { error: null };
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
