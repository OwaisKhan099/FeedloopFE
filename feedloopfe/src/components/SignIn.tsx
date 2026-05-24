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
            // Navigate to dashboard after successful login
            router.push("/");


         } catch (err: any) {

            // If anything fails, show an error message on screen
            setError(err.message || "Something went wrong");
            } finally {
                setLoading(false); // re-enable button + hide "Signing in..."
            }

         }
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_15%_75%,rgba(172,151,255,.28),transparent_35%),radial-gradient(circle_at_78%_80%,rgba(255,131,173,.28),transparent_32%),linear-gradient(180deg,#fbfcff_0%,#fff8fb_100%)] flex flex-col font-[Inter,Arial,sans-serif]">
                {/* Navbar */}
                <nav className="h-[58px] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl flex items-center px-6">
                    <a href="/" className="flex items-center gap-2 text-[22px] font-black tracking-tight">
                        <span className="relative block h-[27px] w-[27px] -rotate-6 rounded-[8px_8px_16px_8px] bg-gradient-to-br from-[#ff6f97] to-[#8c7cff]">
                            <span className="absolute -right-2 -top-2 rotate-[28deg] text-[18px] text-[#111229]">▲</span>
                        </span>
                        <span>FEED<span className="text-[#ff6f97]">LOOP</span></span>
                    </a>
                </nav>

                {/* Card */}
                <div className="flex flex-1 items-center justify-center px-4 py-12">
                    <div className="w-full max-w-[420px] rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_22px_70px_rgba(35,28,72,.12)]">
                        <div className="mb-7 text-center">
                            <h1 className="text-[28px] font-extrabold leading-tight text-[#090d1f]">Welcome back</h1>
                            <p className="mt-1 text-sm text-slate-500">Sign in to your FeedLoop account</p>
                        </div>

                        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 rounded-[9px] border border-slate-300 bg-white px-4 text-sm text-[#090d1f] placeholder:text-slate-400 outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700" htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 rounded-[9px] border border-slate-300 bg-white px-4 text-sm text-[#090d1f] placeholder:text-slate-400 outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                />
                            </div>

                            {error && (
                                <p className="rounded-[9px] bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-1 h-11 rounded-[9px] bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#8c7cff]/20 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Signing in…" : "Sign In →"}
                            </button>

                            {/* Link to sign up */}
                            <p className="text-center text-xs text-slate-500">
                                Don&apos;t have an account?{" "}
                                <a href="/signup" className="font-extrabold text-[#8c7cff] hover:underline">
                                    Create one
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        );
        }