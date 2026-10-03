import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendBaseUrl";

export async function POST(req: NextRequest) {
    let body: unknown;

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const baseUrl = getBackendBaseUrl();

    try {
        const backendRes = await fetch(`${baseUrl}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json(
            { message: "Failed to reach auth service" },
            { status: 502 }
        );
    }
}