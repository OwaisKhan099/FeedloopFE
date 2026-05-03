"use client"; // Marks this as a Client Component (needed because we use useState + browser APIs like localStorage)

import { useRouter } from "next/navigation"; // App Router navigation hook (works in Next.js /app)
import { useState } from "react"; // React hook to store component state

// TypeScript type describing the successful API response from your sign-in endpoint
type SignInResponse = {
  access_token: string; // JWT token returned by backend
  token_type: "bearer" | string; // typically "bearer", but allowing any string to be safe
};

export default function SignInPage() {
  const router = useRouter(); // lets us redirect after successful login

  // Form input states
  const [email, setEmail] = useState(""); // holds the email input value
  const [password, setPassword] = useState(""); // holds the password input value

  // UI states
  const [loading, setLoading] = useState(false); // true while API request is in progress
  const [error, setError] = useState<string | null>(null); // holds error message to show on screen

  // Runs when the form is submitted
  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // prevents the browser from refreshing the page on form submit
    setError(null); // clear any previous error
    setLoading(true); // disable button + show "Signing in..."

    try {
      // Read backend base URL from environment variable.
      // Example in .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
      // If not set, baseUrl becomes "" and the call becomes "/auth/signin" (same-origin).
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

      // Call the backend sign-in API
      const res = await fetch(`${baseUrl}/auth/signin`, {
        method: "POST", // sign-in is usually a POST request
        headers: { "Content-Type": "application/json" }, // tells server we're sending JSON
        body: JSON.stringify({ email, password }), // send form fields to backend
      });

      // Parse JSON response body from the server
      // (Using `any` here is quick; later you can type-check more strictly)
      const data = (await res.json()) as any;

      // If server responded with 400/401/500 etc, throw an error
      // Many APIs return { message: "..."} on failures
      if (!res.ok) {
        throw new Error(data?.message ?? "Sign in failed");
      }

      // Extract token fields from the successful response
      const { access_token, token_type } = data as SignInResponse;

      // Store token in browser storage (simple approach)
      // Later, you can read it to call protected APIs
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("token_type", token_type);

      // If you need it for later API calls, you usually build the Authorization header like this:
      // const authHeader = `${token_type} ${access_token}`;

      // Navigate to home page after successful login
      router.push("/");
    } catch (err) {
      // If anything fails, show an error message on screen
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      // Always stop loading state (whether success or error)
      setLoading(false);
    }
  }

  // UI: a simple sign-in form
  return (
    <form onSubmit={handleSignIn}>
      <input
        type="email" // browser will validate email format
        placeholder="Email" // hint text
        value={email} // bind to email state
        onChange={(e) => setEmail(e.target.value)} // update state when user types
        required // browser prevents empty submit
      />

      <input
        type="password" // hides characters
        placeholder="Password"
        value={password} // bind to password state
        onChange={(e) => setPassword(e.target.value)} // update state when user types
        required
      />

      {/* Show error message only if it exists */}
      {error ? <p>{error}</p> : null}

      <button type="submit" disabled={loading}>
        {/* Change button text depending on loading state */}
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}