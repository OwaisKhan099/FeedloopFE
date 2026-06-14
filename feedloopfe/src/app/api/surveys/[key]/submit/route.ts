import { NextRequest, NextResponse } from "next/server";

// Server-side proxy — POST /api/surveys/[key]/submit
// Forwards to http://localhost:8000/surveys/[key]/submit
// The backend URL stays server-side and never appears in the browser's Network tab.

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    const { key } = await params;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8000";

    try {
        const backendRes = await fetch(`${baseUrl}/surveys/${key}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
