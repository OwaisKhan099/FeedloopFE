import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backendBaseUrl";

type SurveySummary = {
    id?: number | string;
    key?: string;
    survey_id?: number | string;
    survey_key?: string;
    survey?: {
        id?: number | string;
        key?: string;
        survey_id?: number | string;
        survey_key?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

type CompanySurveysBody = {
    surveys?: SurveySummary[];
    items?: SurveySummary[];
    data?: SurveySummary[];
    [key: string]: unknown;
};

type SurveyDetail = {
    id?: number | string;
    key?: string;
    [key: string]: unknown;
};

async function fetchResponses(baseUrl: string, authHeader: string, identifier: string) {
    const res = await fetch(`${baseUrl}/surveys/my-survey-responses/${identifier}`, {
        method: "GET",
        headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    const data = await res.json();
    return { res, data };
}

function collectSurveyList(body: CompanySurveysBody | SurveySummary[]): SurveySummary[] {
    if (Array.isArray(body)) {
        return body;
    }

    if (Array.isArray(body.surveys)) {
        return body.surveys;
    }

    if (Array.isArray(body.items)) {
        return body.items;
    }

    if (Array.isArray(body.data)) {
        return body.data;
    }

    return [];
}

function normalizeIdentifier(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).trim();
    return text ? text : null;
}

function extractSurveyId(survey: SurveySummary): string | null {
    return (
        normalizeIdentifier(survey.id) ??
        normalizeIdentifier(survey.survey_id) ??
        normalizeIdentifier(survey.survey?.id) ??
        normalizeIdentifier(survey.survey?.survey_id)
    );
}

function extractSurveyKey(survey: SurveySummary): string | null {
    return (
        normalizeIdentifier(survey.key) ??
        normalizeIdentifier(survey.survey_key) ??
        normalizeIdentifier(survey.survey?.key) ??
        normalizeIdentifier(survey.survey?.survey_key)
    );
}

async function resolveBySurveyDetail(baseUrl: string, identifier: string) {
    try {
        const detailRes = await fetch(`${baseUrl}/surveys/${identifier}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (!detailRes.ok) {
            return [] as string[];
        }

        const detail = (await detailRes.json()) as SurveyDetail;
        const candidates: string[] = [];

        if (detail.id !== undefined && detail.id !== null) {
            candidates.push(String(detail.id));
        }
        if (typeof detail.key === "string" && detail.key) {
            candidates.push(detail.key);
        }

        return candidates;
    } catch {
        return [] as string[];
    }
}

async function resolveAlternateIdentifier(baseUrl: string, authHeader: string, identifier: string) {
    const companyRes = await fetch(`${baseUrl}/surveys/company`, {
        method: "GET",
        headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!companyRes.ok) {
        return null;
    }

    const companyData = (await companyRes.json()) as CompanySurveysBody | SurveySummary[];
    const surveys = collectSurveyList(companyData);

    const byKey = surveys.find((s) => extractSurveyKey(s) === identifier);
    if (byKey) {
        const id = extractSurveyId(byKey);
        if (id) {
            return id;
        }
    }

    const byId = surveys.find((s) => extractSurveyId(s) === identifier);
    if (byId) {
        const key = extractSurveyKey(byId);
        if (key) {
            return key;
        }
    }

    return null;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ surveyId: string }> }
) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { surveyId } = await params;
    const fallbackId = req.nextUrl.searchParams.get("fallbackId");
    const baseUrl = getBackendBaseUrl();

    try {
        const tried = new Set<string>();
        const candidates: string[] = [];

        candidates.push(surveyId);
        if (fallbackId) {
            candidates.push(fallbackId);
        }

        const mappedFromCompany = await resolveAlternateIdentifier(baseUrl, authHeader, surveyId);
        if (mappedFromCompany) {
            candidates.push(mappedFromCompany);
        }

        if (fallbackId) {
            const mappedFromFallback = await resolveAlternateIdentifier(baseUrl, authHeader, fallbackId);
            if (mappedFromFallback) {
                candidates.push(mappedFromFallback);
            }
        }

        const detailsFromSurveyId = await resolveBySurveyDetail(baseUrl, surveyId);
        candidates.push(...detailsFromSurveyId);

        if (fallbackId) {
            const detailsFromFallback = await resolveBySurveyDetail(baseUrl, fallbackId);
            candidates.push(...detailsFromFallback);
        }

        let last404Data: unknown = { message: "No responses found" };

        for (const candidate of candidates) {
            if (!candidate || tried.has(candidate)) {
                continue;
            }

            tried.add(candidate);
            const attempt = await fetchResponses(baseUrl, authHeader, candidate);

            if (attempt.res.status === 404) {
                last404Data = attempt.data;
                continue;
            }

            return NextResponse.json(attempt.data, { status: attempt.res.status });
        }

        return NextResponse.json(
            {
                message: "No responses found for requested survey",
                attempted_identifiers: Array.from(tried),
                backend: last404Data,
            },
            { status: 404 }
        );
    } catch {
        return NextResponse.json(
            { message: "Failed to reach response service" },
            { status: 502 }
        );
    }
}