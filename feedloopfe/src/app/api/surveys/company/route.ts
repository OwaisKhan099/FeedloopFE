import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendBaseUrl";

// Server-side proxy — GET /api/surveys/company
// Forwards to http://localhost:8000/surveys/company (requires auth)
// Backend URL stays server-side and never appears in the browser's Network tab.

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = getBackendBaseUrl();

    try {
        const backendRes = await fetch(`${baseUrl}/surveys/company`, {
            method: "GET",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
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
