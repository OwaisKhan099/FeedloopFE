// Server component — awaits the dynamic [key] param and passes it to the client component.
// This page is public: no authentication required. It is used by end-users
// who receive the survey link from the company.
import SurveyRespond from "@/components/SurveyRespond";

export default async function SurveyRespondPage({
    params,
}: {
    params: Promise<{ key: string }>;
}) {
    const { key } = await params;
    return <SurveyRespond surveyKey={key} />;
}
