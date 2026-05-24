import { Suspense } from "react";
import VerifyForm from "@/components/Verify";

// useSearchParams() inside VerifyForm requires a Suspense boundary.
// Next.js App Router enforces this to allow server-side static rendering.
export default function VerifyPage() {
    return (
        <Suspense>
            <VerifyForm />
        </Suspense>
    );
}
