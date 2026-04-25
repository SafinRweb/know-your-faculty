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
    
    const [faculty, semesters, questions, session] = await Promise.all([
        getFacultyById(resolvedParams.id),
        getAllSemesters(),
        getActiveQuestions(),
        auth(),
    ]);

    if (!faculty) notFound();
    if (!session?.user) redirect("/login");

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
