"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Sidebar navigation structure.
// Each module can have sub-items (dropdown). Add new modules here.
// ---------------------------------------------------------------------------
const NAV_MODULES = [
    {
        label: "Company",
        icon: "🏢",
        children: [
            { label: "Company Info", href: "/company/info" },
        ],
    },
    // Add more modules here:
    // { label: "Users", icon: "👥", children: [{ label: "User List", href: "/users" }] },
];

export default function PageShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname(); // current URL path — used to highlight active menu item

    const [sidebarOpen, setSidebarOpen] = useState(true);   // desktop: sidebar expanded or collapsed
    const [openModules, setOpenModules] = useState<string[]>(["Company"]); // which dropdowns are open

    // Toggle a module's dropdown open/closed
    function toggleModule(label: string) {
        setOpenModules((prev) =>
            prev.includes(label)
                ? prev.filter((m) => m !== label)  // close if already open
                : [...prev, label]                  // open if closed
        );
    }

    function handleSignOut() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_type");
        router.replace("/signin");
    }

    return (
        <div className="flex min-h-screen font-[Inter,Arial,sans-serif] bg-[#f7f8fc]">

            {/* ----------------------------------------------------------------
                SIDEBAR
            ---------------------------------------------------------------- */}
            <aside
                className={`
                    flex flex-col shrink-0 bg-[#111229] transition-all duration-300 ease-in-out
                    ${sidebarOpen ? "w-[240px]" : "w-[64px]"}
                `}
            >
                {/* Logo + hamburger button */}
                <div className="flex h-[58px] items-center justify-between px-4 border-b border-white/10">
                    {sidebarOpen && (
                        <a href="/" className="flex items-center gap-2 text-[18px] font-black tracking-tight text-white">
                            <span className="relative block h-[24px] w-[24px] -rotate-6 rounded-[6px_6px_12px_6px] bg-gradient-to-br from-[#ff6f97] to-[#8c7cff]">
                                <span className="absolute -right-1.5 -top-1.5 rotate-[28deg] text-[14px] text-[#111229]">▲</span>
                            </span>
                            FEED<span className="text-[#ff6f97]">LOOP</span>
                        </a>
                    )}
                    {/* Hamburger / collapse button */}
                    <button
                        onClick={() => setSidebarOpen((o) => !o)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
                        aria-label="Toggle sidebar"
                    >
                        {/* Three-line hamburger icon */}
                        <span className="flex flex-col gap-[5px]">
                            <span className="block h-[2px] w-5 rounded-full bg-current" />
                            <span className="block h-[2px] w-5 rounded-full bg-current" />
                            <span className="block h-[2px] w-5 rounded-full bg-current" />
                        </span>
                    </button>
                </div>

                {/* Navigation modules */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    {NAV_MODULES.map((mod) => {
                        const isOpen = openModules.includes(mod.label);
                        return (
                            <div key={mod.label}>
                                {/* Module header — clicking toggles its dropdown */}
                                <button
                                    onClick={() => toggleModule(mod.label)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-extrabold text-white/70 hover:bg-white/10 hover:text-white transition"
                                >
                                    <span className="text-lg shrink-0">{mod.icon}</span>
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1">{mod.label}</span>
                                            {/* Chevron rotates when dropdown is open */}
                                            <span
                                                className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                            >
                                                ▾
                                            </span>
                                        </>
                                    )}
                                </button>

                                {/* Dropdown children — only shown when sidebar is expanded and module is open */}
                                {sidebarOpen && isOpen && (
                                    <div className="ml-4 mt-1 mb-2 border-l border-white/10 pl-3 flex flex-col gap-0.5">
                                        {mod.children.map((child) => {
                                            const isActive = pathname === child.href;
                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={`
                                                        rounded-lg px-3 py-2 text-sm font-medium transition
                                                        ${isActive
                                                            ? "bg-gradient-to-r from-[#ff6f97]/20 to-[#8c7cff]/20 text-white font-extrabold"
                                                            : "text-white/50 hover:bg-white/10 hover:text-white"
                                                        }
                                                    `}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Sign Out at the bottom of the sidebar */}
                <div className="border-t border-white/10 p-3">
                    <button
                        onClick={handleSignOut}
                        className={`
                            flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-extrabold
                            text-white/60 hover:bg-white/10 hover:text-white transition
                        `}
                    >
                        <span className="text-lg shrink-0">↩</span>
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* ----------------------------------------------------------------
                MAIN AREA (topbar + page content)
            ---------------------------------------------------------------- */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-6">
                    <p className="text-sm font-bold text-slate-400">
                        {/* Show the active page label in the topbar */}
                        {NAV_MODULES.flatMap((m) => m.children).find((c) => c.href === pathname)?.label
                            ?? "Dashboard"}
                    </p>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
