import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFacultyById } from "@/lib/db/faculty";
import { getAllSemesters } from "@/lib/db/semesters";
import { getActiveQuestions, getUserReviewForFaculty } from "@/lib/db/reviews";
import ReviewWizard from "@/components/faculty/ReviewWizard";

export default async function ReviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/login?callbackUrl=/faculty/${resolvedParams.id}/review`);
    }

    const [faculty, semesters, questions] = await Promise.all([
        getFacultyById(resolvedParams.id),
        getAllSemesters(),
        getActiveQuestions(),
    ]);

    if (!faculty) notFound();

    const existingReview = await getUserReviewForFaculty((session.user as any).id, faculty.id);

    return (
        <ReviewWizard 
            faculty={faculty} 
            questions={questions} 
            semesters={semesters} 
            existingReview={existingReview} 
        />
    );
}
