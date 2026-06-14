import { NextRequest, NextResponse } from "next/server";

// This route handler proxies the survey creation request to the backend.
// Because this runs on the server, the actual call to the backend URL
// never appears in the browser's Network tab — only the call to
// /api/surveys/create is visible to the client.

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    // API_BASE_URL is intentionally NOT prefixed with NEXT_PUBLIC_
    // so it is only available server-side and never exposed to the browser.
    const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8000";

    try {
        const backendRes = await fetch(`${baseUrl}/surveys/create`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json(
            { message: "Failed to reach survey service" },
            { status: 502 }
        );
    }
}
