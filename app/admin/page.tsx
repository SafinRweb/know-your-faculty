import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
    getAdminStats,
    getPendingReports,
    getAllFacultyAdmin,
    getAdminAccounts,
    getDepartments,
    getContributorsAdmin,
    getSiteConfigAdmin,
} from "@/lib/db/admin";
import { getAllSemesters } from "@/lib/db/semesters";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
    const session = await auth();
    const user = session?.user as any;

    if (!session || user?.role !== "admin") redirect("/admin/login");

    const [stats, reports, faculty, adminAccounts, departments, semesters, contributors, siteConfig] = await Promise.all([
        getAdminStats(),
        getPendingReports(),
        getAllFacultyAdmin(),
        getAdminAccounts(),
        getDepartments(),
        getAllSemesters(),
        getContributorsAdmin(),
        getSiteConfigAdmin(),
    ]);

    return (
        <div style={{ paddingTop: "57px" }}>
            <AdminClient
                stats={stats}
                reports={reports}
                faculty={faculty}
                users={[]}
                adminAccounts={adminAccounts}
                departments={departments}
                semesters={semesters}
                contributors={contributors}
                siteConfig={siteConfig}
            />
        </div>
    );
}