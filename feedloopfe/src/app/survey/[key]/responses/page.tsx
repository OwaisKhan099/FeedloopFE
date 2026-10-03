import PageShell from "@/components/PageShell";
import SurveyResponses from "@/components/SurveyResponses";

export default async function SurveyResponsesPage({
    params,
}: {
    params: Promise<{ key: string }>;
}) {
    const { key } = await params;

    return (
        <PageShell>
            <SurveyResponses surveyId={key} />
        </PageShell>
    );
}