import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendBaseUrl";

function getAuthHeader(req: NextRequest) {
    return req.headers.get("authorization");
}

async function proxyRequest(req: NextRequest, method: "GET" | "POST" | "PUT") {
    const authHeader = getAuthHeader(req);
    if (!authHeader) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = getBackendBaseUrl();

    let body: unknown;
    if (method === "POST" || method === "PUT") {
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
        }
    }

    try {
        const backendRes = await fetch(`${baseUrl}/company/info`, {
            method,
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            cache: "no-store",
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch {
        return NextResponse.json(
            { message: "Failed to reach company service" },
            { status: 502 }
        );
    }
}

export async function GET(req: NextRequest) {
    return proxyRequest(req, "GET");
}

export async function POST(req: NextRequest) {
    return proxyRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
    return proxyRequest(req, "PUT");
}