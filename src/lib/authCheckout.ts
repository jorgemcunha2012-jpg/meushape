import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the user is authenticated (signup or signin) and then
 * calls create-checkout to get a Stripe URL.
 * Returns the checkout URL or throws an error.
 */
export async function signUpAndCheckout({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<string> {
  // Step 1: Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: window.location.origin + "/app",
    },
  });

  if (signUpError) {
    // If user already exists, try sign in
    if (
      signUpError.message?.includes("already registered") ||
      signUpError.message?.includes("already been registered")
    ) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } else {
      throw signUpError;
    }
  } else if (!signUpData?.session) {
    // Signup succeeded but no session (e.g. email confirmation pending)
    // Try signing in immediately (works with auto-confirm enabled)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
  }

  // Step 2: Verify we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Não foi possível autenticar. Tente novamente.");
  }

  // Step 3: Call create-checkout
  const { data, error } = await supabase.functions.invoke("create-checkout");
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error("URL de checkout não retornada.");

  return data.url;
}
