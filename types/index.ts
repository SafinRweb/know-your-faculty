export type UserRole = "student" | "admin";

export interface User {
    id: string;
    email: string;
    alias: string;
    role: UserRole;
    is_banned: boolean;
    created_at: string;
}

export interface Faculty {
    id: string;
    name: string;
    department: string;
    initial: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Semester {
    id: string;
    label: string;
    is_active: boolean;
    created_at: string;
}

export interface Course {
    id: string;
    code: string;
    title: string;
}

export interface Section {
    id: string;
    section_no: string;
    room: string | null;
    day_pattern: string | null;
    time_slot: string | null;
    semester_id: string;
    course_id: string;
    faculty_id: string;
    course?: Course;
    faculty?: Faculty;
    semester?: Semester;
}

export interface ReviewQuestion {
    id: string;
    question_text: string;
    type: "mcq" | "text";
    options: string[] | null;
    display_order: number;
    is_active: boolean;
}

export interface Review {
    id: string;
    user_id: string;
    faculty_id: string;
    semester_id: string | null;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    user?: User;
    answers?: ReviewAnswer[];
}

export interface ReviewAnswer {
    id: string;
    review_id: string;
    question_id: string;
    answer_value: string | null;
    question?: ReviewQuestion;
}

export interface FacultyAnalytics {
    faculty_id: string;
    semester_id: string | null;
    question_id: string;
    question_text?: string;
    answer_value: string;
    vote_count: number;
    percentage: number;
}

export interface FeedPost {
    id: string;
    user_id: string;
    body: string;
    status: "active" | "resolved" | "removed";
    created_at: string;
    user?: User;
}