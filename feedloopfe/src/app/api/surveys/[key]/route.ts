import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendBaseUrl";

// Server-side proxy — GET /api/surveys/[key]
// Forwards to http://localhost:8000/surveys/[key]
// The backend URL stays server-side and never appears in the browser's Network tab.

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    const { key } = await params;
    const baseUrl = getBackendBaseUrl();

    try {
        const backendRes = await fetch(`${baseUrl}/surveys/${key}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
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
