"use client"

import { use, useState } from "react";
import { useRouter } from "next/navigation";

type SignInSuccess = {
    access_token:string;
    token_type: "bearer" | string;
}

export default function SignInPage(){
    const router =useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    async function handleSignIn(e: React.FormEvent<HTMLFormElement>){
       e.preventDefault(); // prevents the browser from refreshing the page on form submit
       setError(null); // clear any previous error
       setLoading(true); // disable button + show "Signing in..."

         try {
            // Read backend base URL from environment variable.
            // Example in .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
            // If not set, baseUrl becomes "" and the call becomes "/auth/signin" (same-origin).
            // const signinApi = process.env.NEXT_API_BASE_URL
            const signinApi = process.env.NEXT_PUBLIC_API_BASE_URL

            const res = await fetch(`${signinApi}/auth/signin`,{
                method: "POST",
                headers: {"Content-Type": "application/json"}, // tells server we're sending JSON
                body: JSON.stringify({email, password}), // send form fields to backend
            })
            // Parse JSON response body from the server
            // (Using `any` here is quick; later you can type-check more strictly)
            const data = await res.json();
            
            // If server responded with 400/401/500 etc, throw an error
            // Many APIs return { message: "..."} on failures
            if (!res.ok) {
                throw new Error(data?.message ?? "Sign in failed");
            }
            // Extract token fields from the successful response
            const { access_token, token_type } = data as SignInSuccess;
            // Store token in browser storage (simple approach)
            // Later, you can read it to call protected APIs
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("token_type", token_type);
            // If you need it for later API calls, you usually build the Authorization header like this:
            // const authHeader = `${token_type} ${access_token}`;
            // Navigate to home page after successful login
            router.push("/");


         } catch (err: any) {

            // If anything fails, show an error message on screen
            setError(err.message || "Something went wrong");
            } finally {
                setLoading(false); // re-enable button + hide "Signing in..."
            }

         }
         return (
            <form onSubmit= {handleSignIn}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                <button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </button>
                {error && <p>{error}</p>}
            </form>
        );
        }