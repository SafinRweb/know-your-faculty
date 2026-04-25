import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
    getAdminStats,
    getPendingReports,
    getAllFacultyAdmin,
    getAllUsers,
    getAdminAccounts,
    getDepartments,
} from "@/lib/db/admin";
import { getAllSemesters } from "@/lib/db/semesters";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
    const session = await auth();
    const user = session?.user as any;

    if (!session || user?.role !== "admin") redirect("/admin/login");

    const [stats, reports, faculty, users, adminAccounts, departments, semesters] = await Promise.all([
        getAdminStats(),
        getPendingReports(),
        getAllFacultyAdmin(),
        getAllUsers(),
        getAdminAccounts(),
        getDepartments(),
        getAllSemesters(),
    ]);

    return (
        <div style={{ paddingTop: "57px" }}>
            <AdminClient
                stats={stats}
                reports={reports}
                faculty={faculty}
                users={users}
                adminAccounts={adminAccounts}
                departments={departments}
                semesters={semesters}
            />
        </div>
    );
}