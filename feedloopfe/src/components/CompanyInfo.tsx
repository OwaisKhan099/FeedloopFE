"use client"; // This component runs in the browser (needed for useState, useEffect, localStorage)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Type definition — describes the shape of data returned by GET /company/info
// and the payload sent to POST/PUT /company/info.
// ---------------------------------------------------------------------------
type CompanyInfo = {
    id?: string | number;
    company_name?: string;
    industry?: string;
    category?: string;
    target_customers?: string;
    additional_info?: string;
    [key: string]: unknown;
};

// The five fields required by POST /company/info
const CREATE_FIELDS: { key: keyof Omit<CompanyInfo, "id">; label: string }[] = [
    { key: "company_name",    label: "Company Name" },
    { key: "industry",        label: "Industry" },
    { key: "category",        label: "Category" },
    { key: "target_customers", label: "Target Customers" },
    { key: "additional_info", label: "Additional Info" },
];

export default function CompanyInfo() {
    const router = useRouter(); // used to programmatically navigate between pages

    // ---------------------------------------------------------------------------
    // State for fetching company data (GET /company/info)
    // ---------------------------------------------------------------------------
    const [company, setCompany] = useState<CompanyInfo | null>(null); // holds the data from the API
    const [loading, setLoading] = useState(true);                     // true while the GET request is running
    const [error, setError] = useState<string | null>(null);          // holds any fetch error message
    const [noCompany, setNoCompany] = useState(false);                // true when the API returns 404 (new user)

    // ---------------------------------------------------------------------------
    // State for creating company data (POST /company/info)
    // ---------------------------------------------------------------------------
    const [createData, setCreateData] = useState<Omit<CompanyInfo, "id">>({});
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // ---------------------------------------------------------------------------
    // State for editing company data (PUT /company/info)
    // ---------------------------------------------------------------------------
    const [isEditing, setIsEditing] = useState(false);          // toggles between view mode and edit mode
    const [editData, setEditData] = useState<CompanyInfo>({});  // a working copy of the data while editing
                                                                 // (we never mutate `company` directly)
    const [saving, setSaving] = useState(false);                 // true while the PUT request is running
    const [saveError, setSaveError] = useState<string | null>(null);  // error from PUT request
    const [saveSuccess, setSaveSuccess] = useState(false);            // true briefly after a successful save

    // ---------------------------------------------------------------------------
    // useEffect — runs once when the component mounts (loads into the browser).
    // Checks if the user is logged in, then fetches company info from the backend.
    // ---------------------------------------------------------------------------
    useEffect(() => {
        // Read the JWT token that was saved to localStorage during sign-in
        const accessToken = localStorage.getItem("access_token");
        const tokenType = localStorage.getItem("token_type");

        // If no token exists, the user is not logged in — redirect to sign-in page
        if (!accessToken) {
            router.replace("/signin");
            return; // stop here, don't attempt the fetch
        }

        // Read the backend base URL from the environment variable in .env.local
        // e.g. NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

        // Send GET request to /company/info with the JWT token in the Authorization header
        fetch(`${baseUrl}/company/info`, {
            method: "GET",
            headers: {
                Authorization: `${tokenType} ${accessToken}`, // e.g. "bearer eyJhbGci..."
                "Content-Type": "application/json",
            },
        })
            .then(async (res) => {
                // 401 means the token is expired or invalid
                // Clear the bad token and send user back to sign-in
                if (res.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("token_type");
                    router.replace("/signin");
                    return;
                }
                // 404 means this user has no company info yet — show the create form
                if (res.status === 404) {
                    setNoCompany(true);
                    return;
                }
                // Parse the JSON response body
                const data = await res.json();
                // Any non-2xx status (400, 500, etc.) is treated as an error
                if (!res.ok) {
                    throw new Error(data?.message ?? "Failed to load company info");
                }
                // Store the fetched data in state — this triggers a re-render to show the data
                setCompany(data);
            })
            .catch((err: unknown) => {
                // Network failures or thrown errors land here
                setError(err instanceof Error ? err.message : "Something went wrong");
            })
            .finally(() => {
                // Always stop the loading spinner whether the request succeeded or failed
                setLoading(false);
            });
    }, [router]); // dependency array — re-run only if `router` changes (practically never)

    // ---------------------------------------------------------------------------
    // handleEditClick — called when the user clicks the "✏️ Edit" button
    // Copies the current company data into editData so all inputs are pre-filled,
    // then switches the UI to edit mode.
    // ---------------------------------------------------------------------------
    function handleEditClick() {
        setEditData({ ...company }); // spread creates a shallow copy — editing won't affect `company`
        setSaveError(null);
        setSaveSuccess(false);
        setIsEditing(true);
    }

    // ---------------------------------------------------------------------------
    // handleCancel — called when the user clicks "Cancel" in edit mode
    // Discards all edits by just switching off edit mode.
    // editData is simply ignored — company state was never touched.
    // ---------------------------------------------------------------------------
    function handleCancel() {
        setIsEditing(false);
        setSaveError(null);
    }

    // ---------------------------------------------------------------------------
    // handleFieldChange — called on every keystroke in any edit input
    // Updates only the changed field in editData, leaving all other fields intact.
    // ---------------------------------------------------------------------------
    function handleFieldChange(key: string, value: string) {
        setEditData((prev) => ({ ...prev, [key]: value }));
        // Example: if user types in the "name" field:
        // prev = { name: "Old Name", email: "a@b.com" }
        // result = { name: "New Name", email: "a@b.com" }
    }

    // ---------------------------------------------------------------------------
    // handleCreate — called when the user submits the "Add Company Info" form.
    // Sends createData to the backend via POST /company/info.
    // On success: sets company state and exits create mode.
    // ---------------------------------------------------------------------------
    async function handleCreate() {
        setCreating(true);
        setCreateError(null);

        const accessToken = localStorage.getItem("access_token");
        const tokenType = localStorage.getItem("token_type");

        if (!accessToken) {
            router.replace("/signin");
            return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

        try {
            const res = await fetch(`${baseUrl}/company/info`, {
                method: "POST",
                headers: {
                    Authorization: `${tokenType} ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(createData),
            });

            if (res.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("token_type");
                router.replace("/signin");
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message ?? "Failed to create company info");
            }

            // Company created — switch to view/edit mode with the returned data
            setCompany(data);
            setNoCompany(false);
        } catch (err: unknown) {
            setCreateError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setCreating(false);
        }
    }

    // ---------------------------------------------------------------------------
    // handleSave — called when the user clicks "Save Changes"
    // Sends editData to the backend via PUT /company/info.
    // On success: updates the displayed company data, exits edit mode.
    // On failure: shows an error banner without leaving edit mode.
    // ---------------------------------------------------------------------------
    async function handleSave() {
        setSaving(true);       // disable buttons + show "Saving…"
        setSaveError(null);
        setSaveSuccess(false);

        // Re-read the token from localStorage (it may have expired since page load)
        const accessToken = localStorage.getItem("access_token");
        const tokenType = localStorage.getItem("token_type");

        if (!accessToken) {
            router.replace("/signin");
            return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

        try {
            // Send all editData fields to the backend as JSON
            const res = await fetch(`${baseUrl}/company/info`, {
                method: "PUT",
                headers: {
                    Authorization: `${tokenType} ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editData), // converts the editData object to a JSON string
            });

            // Token expired during edit session — clear and redirect
            if (res.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("token_type");
                router.replace("/signin");
                return;
            }

            const data = await res.json(); // parse the server's response

            if (!res.ok) {
                throw new Error(data?.message ?? "Failed to save changes");
            }

            // Backend returns the updated company object — use it as the new source of truth
            setCompany(data);
            setIsEditing(false);   // switch back to view mode
            setSaveSuccess(true);  // show the green success banner
            // Auto-hide the success banner after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: unknown) {
            // Show the error inside the form — user stays in edit mode to try again
            setSaveError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false); // re-enable buttons regardless of outcome
        }
    }

    // ---------------------------------------------------------------------------
    // Render: Loading state
    // ---------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
                <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#8c7cff]" />
                <p className="text-sm font-medium">Loading company info…</p>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Render: Fetch error state
    // ---------------------------------------------------------------------------
    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm font-medium text-rose-600">
                {error}
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Render: No company info yet — show the create form
    // ---------------------------------------------------------------------------
    if (noCompany) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-8 py-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white/70">Company</p>
                    <h2 className="mt-1 text-2xl font-extrabold text-white">Add Company Info</h2>
                    <p className="mt-1 text-sm text-white/70">No company info found. Fill in the details below to get started.</p>
                </div>

                {/* Error banner */}
                {createError && (
                    <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-200 px-8 py-3 text-sm font-medium text-rose-600">
                        <span>✕</span> {createError}
                    </div>
                )}

                {/* Form fields */}
                <div className="divide-y divide-slate-100">
                    {CREATE_FIELDS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-4 px-8 py-4">
                            <label className="w-40 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
                                {label}
                            </label>
                            <input
                                type="text"
                                value={String(createData[key] ?? "")}
                                onChange={(e) =>
                                    setCreateData((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                className="flex-1 rounded-[9px] border border-slate-300 bg-white px-3 py-2 text-sm text-[#090d1f] outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                placeholder={`Enter ${label.toLowerCase()}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end border-t border-slate-100 px-8 py-5">
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="h-10 rounded-[9px] bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#8c7cff]/20 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {creating ? "Saving…" : "Save Company Info"}
                    </button>
                </div>
            </div>
        );
    }

    if (!company) return null;

    // Build the list of fields to display.
    // In view mode  → use `company`  (original data from API)
    // In edit mode  → use `editData` (working copy that the user is modifying)
    // Filter out null/undefined values so we don't render empty rows.
    const fields = Object.entries(isEditing ? editData : company).filter(
        ([, v]) => v !== null && v !== undefined
    );

    // ---------------------------------------------------------------------------
    // Render: Main UI
    // ---------------------------------------------------------------------------
    return (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(28,31,55,.08)] overflow-hidden">

            {/* ---- Header bar ---- */}
            <div className="bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-8 py-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/70">Company</p>
                    {/* Show the name from editData while editing so it updates live as the user types */}
                    <h2 className="mt-1 text-2xl font-extrabold text-white">
                        {(isEditing ? editData.company_name : company.company_name) ?? "Company Info"}
                    </h2>
                </div>
                {/* Edit button is hidden while in edit mode — Save/Cancel take its place at the bottom */}
                {!isEditing && (
                    <button
                        onClick={handleEditClick}
                        className="h-9 rounded-[9px] border border-white/40 bg-white/10 px-5 text-xs font-extrabold text-white hover:bg-white/20 transition"
                    >
                        ✏️ Edit
                    </button>
                )}
            </div>

            {/* ---- Success banner (shown for 3 seconds after a successful save) ---- */}
            {saveSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-8 py-3 text-sm font-medium text-emerald-600">
                    <span>✓</span> Changes saved successfully
                </div>
            )}

            {/* ---- Save error banner (shown when PUT request fails) ---- */}
            {saveError && (
                <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-200 px-8 py-3 text-sm font-medium text-rose-600">
                    <span>✕</span> {saveError}
                </div>
            )}

            {/* ---- Field rows ---- */}
            <dl className="divide-y divide-slate-100">
                {fields.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4 px-8 py-4">
                        {/* Field label — underscores replaced with spaces for readability */}
                        <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
                            {key.replace(/_/g, " ")}
                        </dt>
                        <dd className="flex-1 text-sm">
                            {isEditing ? (
                                // Edit mode: render an input bound to editData
                                <input
                                    type="text"
                                    value={String(value ?? "")}
                                    onChange={(e) => handleFieldChange(key, e.target.value)}
                                    className="w-full rounded-[9px] border border-slate-300 bg-white px-3 py-2 text-sm text-[#090d1f] outline-none focus:border-[#8c7cff] focus:ring-2 focus:ring-[#8c7cff]/20 transition"
                                />
                            ) : (
                                // View mode: render plain text
                                <span className="font-medium text-[#090d1f] break-all">
                                    {String(value)}
                                </span>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>

            {/* ---- Save / Cancel buttons (only visible in edit mode) ---- */}
            {isEditing && (
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-8 py-5">
                    {/* Cancel discards all changes and exits edit mode */}
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="h-10 rounded-[9px] border border-slate-300 bg-white px-6 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    {/* Save sends editData to the backend via PUT */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-10 rounded-[9px] bg-gradient-to-r from-[#ff6f97] to-[#8c7cff] px-6 text-sm font-extrabold text-white shadow-lg shadow-[#8c7cff]/20 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            )}
        </div>
    );
}
