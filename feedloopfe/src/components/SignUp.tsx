"use client"; // runs in the browser — needed for useState, form handling, and routing

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
    const router = useRouter(); // used to redirect after successful sign-up

    // ---------------------------------------------------------------------------
    // Form field state — one state variable per payload field
    // ---------------------------------------------------------------------------
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");

    // ---------------------------------------------------------------------------
    // UI state
    // ---------------------------------------------------------------------------
    const [loading, setLoading] = useState(false);          // disables the button while request is in flight
    const [error, setError] = useState<string | null>(null); // shows server/network error below the form

    // ---------------------------------------------------------------------------
    // handleSignUp — called when the form is submitted
    // Sends a POST request to /auth/signup with the four payload fields.
    // On success: redirects to /signin so the user can log in.
    // On failure: shows the error message in the form.
    // ---------------------------------------------------------------------------
    async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault(); // prevent browser from reloading the page on form submit
        setError(null);     // clear any previous error
        setLoading(true);   // disable button + show "Creating account…"

        try {
            // Read the backend base URL from .env.local
            // Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

            // POST to /auth/signup with the required payload
            const res = await fetch(`${baseUrl}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }, // tell server we're sending JSON
                body: JSON.stringify({
                    email,
                    first_name: firstName, // map camelCase state to snake_case API field
                    last_name: lastName,
                    password,
                }),
            });

            // Parse the JSON response body
            const data = await res.json();

            // Any non-2xx response (400, 409, 422, 500…) is treated as an error
            if (!res.ok) {
                throw new Error(data?.message ?? "Sign up failed");
            }

            // Success — redirect to verify page, passing email as a query param
            // so the verify form can pre-fill the email field
            router.push(`/verify?email=${encodeURIComponent(email)}`);

        } catch (err: unknown) {
            // Network failures or thrown errors land here
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false); // re-enable the button regardless of outcome
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

                    {/* Card header */}
                    <div className="mb-7 text-center">
                        <h1 className="text-[28px] font-extrabold leading-tight text-[#090d1f]">Create your account</h1>
                        <p className="mt-1 text-sm text-slate-500">Start using FeedLoop for free</p>
                    </div>

                    <form onSubmit={handleSignUp} className="flex flex-col gap-4">

                        {/* First name + Last name — side by side */}
                        <div className="flex gap-3">
                            <div className="flex flex-1 min-w-0 flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700" htmlFor="firstName">
                                    First name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    placeholder="Jane"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="h-11 rounded-[9px] border border-slate-300 bg-white px-4 text-sm text-[#090d1f] placeholder:text-slate-400 outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                />
                            </div>
                            <div className="flex flex-1 min-w-0 flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-700" htmlFor="lastName">
                                    Last name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="h-11 rounded-[9px] border border-slate-300 bg-white px-4 text-sm text-[#090d1f] placeholder:text-slate-400 outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700" htmlFor="email">
                                Email
                            </label>
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

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700" htmlFor="password">
                                Password
                            </label>
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

                        {/* Error message */}
                        {error && (
                            <p className="rounded-[9px] bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600">
                                {error}
                            </p>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-11 rounded-[9px] bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#8c7cff]/20 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating account…" : "Create Account →"}
                        </button>

                        {/* Link to sign in */}
                        <p className="text-center text-xs text-slate-500">
                            Already have an account?{" "}
                            <a href="/signin" className="font-extrabold text-[#8c7cff] hover:underline">
                                Sign in
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
