"use client"; // runs in the browser — needed for useState, useSearchParams, and routing

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyForm() {
    const router = useRouter();

    // useSearchParams reads the query string from the URL.
    // After sign-up, the user is redirected to /verify?email=user@example.com
    // so we pre-fill the email field from that query param.
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get("email") ?? "";

    // ---------------------------------------------------------------------------
    // Form field state
    // ---------------------------------------------------------------------------
    const [email, setEmail] = useState(emailFromQuery);                 // pre-filled from URL
    const [verificationCode, setVerificationCode] = useState("");       // user types the code

    // ---------------------------------------------------------------------------
    // UI state
    // ---------------------------------------------------------------------------
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---------------------------------------------------------------------------
    // handleVerify — called on form submit
    // Sends POST request with { email, verification_code } to /auth/verify-email.
    // On success: redirects to /signin so the user can log in.
    // On failure: shows the error message.
    // ---------------------------------------------------------------------------
    async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault(); // prevent browser page reload
        setError(null);
        setLoading(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

            const res = await fetch(`${baseUrl}/auth/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    verification_code: verificationCode, // snake_case to match API payload
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message ?? "Verification failed");
            }

            // Success — account is verified, redirect to sign-in
            router.push("/signin");

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
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
                        {/* Icon */}
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6f97] to-[#8c7cff] text-2xl shadow-lg shadow-[#8c7cff]/20">
                            ✉️
                        </div>
                        <h1 className="text-[28px] font-extrabold leading-tight text-[#090d1f]">Check your email</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            We sent a verification code to{" "}
                            <span className="font-bold text-[#090d1f]">{emailFromQuery || "your email"}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="flex flex-col gap-4">

                        {/* Email — editable in case the user came directly to this page */}
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

                        {/* Verification code */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700" htmlFor="verificationCode">
                                Verification code
                            </label>
                            <input
                                id="verificationCode"
                                type="text"
                                placeholder="Enter your code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                autoFocus
                                className="h-11 rounded-[9px] border border-slate-300 bg-white px-4 text-sm text-[#090d1f] placeholder:text-slate-400 outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition tracking-widest"
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
                            {loading ? "Verifying…" : "Verify Account →"}
                        </button>

                        {/* Back to sign in */}
                        <p className="text-center text-xs text-slate-500">
                            Already verified?{" "}
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
