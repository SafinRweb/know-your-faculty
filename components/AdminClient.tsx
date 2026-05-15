"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "faculty" | "users" | "reports" | "admins" | "contributors" | "schedule" | "reviews" | "import";

interface Props {
    stats: {
        faculty: number;
        reviews: number;
        users: number;
        posts: number;
        pendingReports: number;
    };
    reports: any[];
    faculty: any[];
    users: any[];
    adminAccounts: any[];
    departments: any[];
    semesters: any[];
    contributors: any[];
    siteConfig: Record<string, string>;
}

export default function AdminClient({
    stats, reports, faculty, users, adminAccounts, departments, semesters, contributors, siteConfig,
}: Props) {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("overview");
    const [saving, setSaving] = useState<string | null>(null);

    // Faculty form
    const [newFaculty, setNewFaculty] = useState({
        name: "", department: "", initial: "",
    });
    const [facultyMsg, setFacultyMsg] = useState<string | null>(null);

    // New admin form
    const [newAdmin, setNewAdmin] = useState({ email: "", password: "" });
    const [adminMsg, setAdminMsg] = useState<string | null>(null);

    // Departments
    const [newDept, setNewDept] = useState("");
    const [deptMsg, setDeptMsg] = useState<string | null>(null);

    // Contributors
    const [newContributor, setNewContributor] = useState({
        role: "", name: "", student_id: "", email: "", website: "", display_order: "99",
    });
    const [contributorMsg, setContributorMsg] = useState<string | null>(null);
    const [newVersion, setNewVersion] = useState(siteConfig.version || "1.0");
    const [versionMsg, setVersionMsg] = useState<string | null>(null);

    // Faculty editing
    const [editingFaculty, setEditingFaculty] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", department: "", initial: "" });
    const [editMsg, setEditMsg] = useState<string | null>(null);

    // Reviews management
    const [adminReviews, setAdminReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewFilter, setReviewFilter] = useState("");
    const [reviewsLoaded, setReviewsLoaded] = useState(false);

    async function handleDeptAction(action: string, id?: string, name?: string) {
        setSaving("dept");
        const res = await fetch("/api/admin/departments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, id, name }),
        });
        const data = await res.json();
        if (!res.ok) setDeptMsg(data.error);
        else { setDeptMsg(action === "add" ? "✓ Department added." : "✓ Removed."); setNewDept(""); router.refresh(); }
        setSaving(null);
    }

    async function handleAddFaculty() {
        if (!newFaculty.name.trim() || !newFaculty.department.trim()) {
            setFacultyMsg("Name and department are required.");
            return;
        }
        setSaving("faculty");
        setFacultyMsg(null);

        const res = await fetch("/api/admin/faculty", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newFaculty),
        });

        const data = await res.json();
        if (!res.ok) {
            setFacultyMsg(data.error || "Failed to add faculty.");
        } else {
            setFacultyMsg("✓ Faculty added successfully.");
            setNewFaculty({ name: "", department: "", initial: "" });
            router.refresh();
        }
        setSaving(null);
    }

    async function handleAddAdmin() {
        if (!newAdmin.email.trim() || !newAdmin.password.trim()) {
            setAdminMsg("Email and password are required.");
            return;
        }
        if (newAdmin.password.length < 6) {
            setAdminMsg("Password must be at least 6 characters.");
            return;
        }
        setSaving("admin");
        setAdminMsg(null);

        const res = await fetch("/api/admin/create-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAdmin),
        });

        const data = await res.json();
        if (!res.ok) {
            setAdminMsg(data.error || "Failed to create admin.");
        } else {
            setAdminMsg("✓ Admin account created.");
            setNewAdmin({ email: "", password: "" });
            router.refresh();
        }
        setSaving(null);
    }

    async function handleReportAction(
        reportId: string,
        action: "actioned" | "dismissed"
    ) {
        setSaving(reportId);
        await fetch("/api/admin/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reportId, action }),
        });
        setSaving(null);
        router.refresh();
    }

    async function handleToggleBan(userId: string, isBanned: boolean) {
        setSaving(userId);
        await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, action: isBanned ? "unban" : "ban" }),
        });
        setSaving(null);
        router.refresh();
    }

    async function handleDeleteUser(userId: string, email: string) {
        if (!confirm(`Are you sure you want to completely delete the user ${email}? This cannot be undone.`)) return;
        setSaving(userId);
        try {
            const res = await fetch("/api/admin/users/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (!res.ok) alert(data.error || "Failed to delete user");
            router.refresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(null);
        }
    }

    async function handleAddContributor() {
        if (!newContributor.role.trim() || !newContributor.name.trim()) {
            setContributorMsg("Role and name are required.");
            return;
        }
        setSaving("contributor");
        const res = await fetch("/api/admin/contributors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "add", data: newContributor }),
        });
        const data = await res.json();
        if (!res.ok) setContributorMsg(data.error);
        else {
            setContributorMsg("✓ Contributor added.");
            setNewContributor({ role: "", name: "", student_id: "", email: "", website: "", display_order: "99" });
            router.refresh();
        }
        setSaving(null);
    }

    async function handleDeleteContributor(id: string) {
        if (!confirm("Remove this contributor?")) return;
        setSaving(id);
        await fetch("/api/admin/contributors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id }),
        });
        setSaving(null);
        router.refresh();
    }

    async function handleUpdateVersion() {
        setSaving("version");
        const res = await fetch("/api/admin/contributors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update_version", data: { version: newVersion } }),
        });
        const data = await res.json();
        if (!res.ok) setVersionMsg(data.error);
        else { setVersionMsg("✓ Version updated."); router.refresh(); }
        setSaving(null);
    }

    async function handleEditFaculty(facultyId: string) {
        setSaving("edit-faculty");
        setEditMsg(null);
        const res = await fetch("/api/admin/faculty", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: facultyId, ...editForm }),
        });
        const data = await res.json();
        if (!res.ok) { setEditMsg(data.error || "Failed."); }
        else { setEditMsg("✓ Updated."); setEditingFaculty(null); router.refresh(); }
        setSaving(null);
    }

    async function loadReviews() {
        setReviewsLoading(true);
        const res = await fetch("/api/admin/reviews");
        const data = await res.json();
        if (res.ok) { setAdminReviews(data.reviews || []); setReviewsLoaded(true); }
        setReviewsLoading(false);
    }

    async function handleReviewAdminAction(reviewId: string, action: "delete" | "hide" | "show") {
        if (action === "delete" && !confirm("Permanently delete this review and all its answers?")) return;
        setSaving(reviewId);
        await fetch("/api/admin/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewId, action }),
        });
        setSaving(null);
        loadReviews();
        router.refresh();
    }

    const TABS: Tab[] = ["overview", "faculty", "reviews", "import", "users", "reports", "admins", "contributors", "schedule"];

    return (
        <div>
            {/* Header */}
            <div style={{
                padding: "48px 32px 0",
                borderBottom: "1.5px solid #f5f2eb",
            }}>
                <div style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    opacity: 0.4, marginBottom: "12px",
                }}>
                    Admin Panel
                </div>
                <h1 style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    fontWeight: 800, letterSpacing: "-0.03em",
                    lineHeight: 1, marginBottom: "32px",
                }}>
                    Dashboard
                </h1>

                <div style={{ display: "flex", overflowX: "auto" }}>
                    {TABS.map((t) => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "14px 20px",
                            background: tab === t ? "#f5f2eb" : "transparent",
                            color: tab === t ? "#0f0f0f" : "#f5f2eb",
                            border: "none", borderRight: "1px solid #2a2725",
                            cursor: "pointer", whiteSpace: "nowrap",
                            display: "inline-flex", alignItems: "center", gap: "6px",
                        }}>
                            {t}
                            {t === "reports" && stats.pendingReports > 0 && (
                                <span style={{
                                    background: "#e8622c", color: "#0f0f0f",
                                    borderRadius: "50%", width: "16px", height: "16px",
                                    fontSize: "10px", display: "inline-flex",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    {stats.pendingReports}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "48px 32px" }}>

                {/* ── OVERVIEW ── */}
                {tab === "overview" && (
                    <div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5,1fr)",
                            border: "1.5px solid #f5f2eb",
                            marginBottom: "48px",
                        }} className="stats-overview">
                            {[
                                { label: "Faculty", val: stats.faculty },
                                { label: "Reviews", val: stats.reviews },
                                { label: "Students", val: stats.users },
                                { label: "Feed posts", val: stats.posts },
                                {
                                    label: "Pending reports", val: stats.pendingReports,
                                    alert: stats.pendingReports > 0,
                                },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    padding: "32px 24px",
                                    borderRight: i < 4 ? "1.5px solid #f5f2eb" : "none",
                                }}>
                                    <div style={{
                                        fontFamily: "var(--font-sans)", fontSize: "40px",
                                        fontWeight: 800, letterSpacing: "-0.04em",
                                        color: s.alert ? "#e8622c" : "#f5f2eb",
                                        marginBottom: "6px",
                                    }}>
                                        {s.val}
                                    </div>
                                    <div style={{
                                        fontFamily: "var(--font-mono)", fontSize: "11px",
                                        letterSpacing: "0.08em", textTransform: "uppercase",
                                        opacity: 0.45,
                                    }}>
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p style={{
                            fontFamily: "var(--font-mono)", fontSize: "13px",
                            lineHeight: 1.7, opacity: 0.5, maxWidth: "480px",
                        }}>
                            Use the tabs above to manage faculty, moderate reports,
                            manage student accounts, and create new admin credentials.
                        </p>
                    </div>
                )}

                {/* ── FACULTY ── */}
                {tab === "faculty" && (
                    <div>
                        <div style={{
                            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px",
                        }} className="two-col">

                        <div>
                            <div style={sectionLabel}>Add new faculty</div>
                            {[
                                { label: "Full name", key: "name", placeholder: "Dr. A. Rahman" },
                                { label: "Department", key: "department", placeholder: "CSE" },
                                { label: "Initial (optional)", key: "initial", placeholder: "AR" },
                            ].map((f) => (
                                <div key={f.key} style={{ marginBottom: "14px" }}>
                                    <div style={fieldLabel}>{f.label}</div>
                                    <input
                                        value={(newFaculty as any)[f.key]}
                                        onChange={(e) =>
                                            setNewFaculty((p) => ({ ...p, [f.key]: e.target.value }))
                                        }
                                        placeholder={f.placeholder}
                                        style={inputStyle}
                                    />
                                </div>
                            ))}
                            {facultyMsg && (
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    color: facultyMsg.startsWith("✓") ? "#1a4fd4" : "#e8622c",
                                    marginBottom: "12px",
                                }}>
                                    {facultyMsg}
                                </div>
                            )}
                            <button
                                onClick={handleAddFaculty}
                                disabled={saving === "faculty"}
                                style={primaryBtn}>
                                {saving === "faculty" ? "Adding…" : "Add faculty →"}
                            </button>
                        </div>

                        <div>
                            <div style={sectionLabel}>{faculty.length} faculty listed</div>
                            {editMsg && (
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    color: editMsg.startsWith("✓") ? "#1a4fd4" : "#e8622c",
                                    marginBottom: "12px",
                                }}>
                                    {editMsg}
                                </div>
                            )}
                            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                                {faculty.map((f) => (
  <div key={f.id} style={{
    padding: "14px 0",
    borderBottom: "1px solid #2a2725",
  }}>
    {editingFaculty === f.id ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div>
            <div style={fieldLabel}>Name</div>
            <input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder={f.name} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>Department</div>
            <input value={editForm.department} onChange={(e) => setEditForm(p => ({ ...p, department: e.target.value }))} placeholder={f.department} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>Initial</div>
            <input value={editForm.initial} onChange={(e) => setEditForm(p => ({ ...p, initial: e.target.value }))} placeholder={f.initial || "—"} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => handleEditFaculty(f.id)} disabled={saving === "edit-faculty"} style={primaryBtn}>
            {saving === "edit-faculty" ? "Saving…" : "Save"}
          </button>
          <button onClick={() => { setEditingFaculty(null); setEditMsg(null); }} style={{ ...primaryBtn, background: "transparent", color: "#f5f2eb" }}>
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: "14px",
            fontWeight: 700, letterSpacing: "-0.01em",
          }}>
            {f.name}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            opacity: 0.4, textTransform: "uppercase",
            letterSpacing: "0.06em", marginTop: "2px",
          }}>
            {f.department}{f.initial && ` · ${f.initial}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => {
              setEditingFaculty(f.id);
              setEditForm({ name: f.name, department: f.department, initial: f.initial || "" });
              setEditMsg(null);
            }}
            style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 12px", background: "transparent",
              color: "#1a4fd4", border: "1px solid #1a4fd4",
              cursor: "pointer",
            }}>
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove ${f.name} from the directory?`)) {
                setSaving(f.id);
                fetch("/api/admin/faculty/delete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ facultyId: f.id }),
                }).then(() => { setSaving(null); router.refresh(); });
              }
            }}
            style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 12px", background: "transparent",
              color: "#e8622c", border: "1px solid #e8622c",
              cursor: "pointer",
            }}>
            {saving === f.id ? "…" : "Remove"}
          </button>
        </div>
      </div>
    )}
  </div>
))}
                            </div>
                        </div>
                        </div>

                        {/* Departments manager */}
                        <div style={{
                            marginTop: "48px", paddingTop: "48px",
                            borderTop: "1.5px solid #f5f2eb",
                        }}>
                            <div style={sectionLabel}>Manage departments</div>
                            <div style={{
                                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px",
                            }} className="two-col">
                                <div>
                                    <div style={fieldLabel}>New department name</div>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <input
                                            value={newDept}
                                            onChange={(e) => setNewDept(e.target.value)}
                                            placeholder="e.g. MBA"
                                            style={{ ...inputStyle, flex: 1 }}
                                        />
                                        <button
                                            onClick={() => handleDeptAction("add", undefined, newDept)}
                                            disabled={saving === "dept"}
                                            style={primaryBtn}>
                                            Add
                                        </button>
                                    </div>
                                    {deptMsg && (
                                        <div style={{
                                            fontFamily: "var(--font-mono)", fontSize: "12px",
                                            color: deptMsg.startsWith("✓") ? "#1a4fd4" : "#e8622c",
                                            marginTop: "10px",
                                        }}>
                                            {deptMsg}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={sectionLabel}>{departments.length} departments</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {departments.map((d: any) => (
                                            <div key={d.id} style={{
                                                display: "flex", alignItems: "center", gap: "0",
                                                border: "1.5px solid #f5f2eb",
                                            }}>
                                                <span style={{
                                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                                    letterSpacing: "0.06em", padding: "7px 12px",
                                                }}>
                                                    {d.name}
                                                </span>
                                                <button
                                                    onClick={() => handleDeptAction("delete", d.id)}
                                                    style={{
                                                        fontFamily: "var(--font-mono)", fontSize: "11px",
                                                        padding: "7px 10px", background: "none",
                                                        border: "none", borderLeft: "1.5px solid #f5f2eb",
                                                        cursor: "pointer", color: "#e8622c",
                                                    }}>
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── USERS ── */}
                {tab === "users" && (
                    <div>
                        <div style={sectionLabel}>{users.length} registered students</div>
                        {users.map((u) => (
                            <div key={u.id} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto auto auto",
                                alignItems: "center", gap: "16px",
                                padding: "16px 0", borderBottom: "1px solid #2a2725",
                            }} className="user-row">
                                <div>
                                    <div style={{
                                        fontFamily: "var(--font-mono)", fontSize: "13px",
                                        fontWeight: 500, marginBottom: "2px",
                                    }}>
                                        {u.alias}
                                    </div>
                                    <div style={{
                                        fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.4,
                                    }}>
                                        {u.email}
                                    </div>
                                </div>
                                <span style={{
                                    ...badge,
                                    background: u.role === "admin" ? "#f5f2eb" : "#2a2725",
                                    color: u.role === "admin" ? "#0f0f0f" : "#f5f2eb",
                                }}>
                                    {u.role}
                                </span>
                                <span style={{
                                    ...badge,
                                    background: u.is_banned ? "#e8622c" : "#2a2725",
                                    color: u.is_banned ? "#0f0f0f" : "#f5f2eb",
                                }}>
                                    {u.is_banned ? "Banned" : "Active"}
                                </span>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => handleToggleBan(u.id, u.is_banned)}
                                        disabled={saving === u.id || u.role === "admin"}
                                        style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            letterSpacing: "0.06em", textTransform: "uppercase",
                                            padding: "7px 14px", background: "transparent",
                                            color: u.is_banned ? "#1a4fd4" : "#e8622c",
                                            border: `1px solid ${u.is_banned ? "#1a4fd4" : "#e8622c"}`,
                                            cursor: u.role === "admin" ? "not-allowed" : "pointer",
                                            opacity: u.role === "admin" ? 0.3 : 1,
                                        }}>
                                        {saving === u.id ? "…" : u.is_banned ? "Unban" : "Ban"}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                        disabled={saving === u.id || u.role === "admin"}
                                        style={{
                                            fontFamily: "var(--font-mono)", fontSize: "11px",
                                            letterSpacing: "0.06em", textTransform: "uppercase",
                                            padding: "7px 14px", background: "transparent",
                                            color: "#f87171", border: "1px solid rgba(248,113,113,0.4)",
                                            cursor: u.role === "admin" ? "not-allowed" : "pointer",
                                            opacity: u.role === "admin" ? 0.3 : 1,
                                        }}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── REPORTS ── */}
                {tab === "reports" && (
                    <div>
                        <div style={sectionLabel}>
                            {reports.length} pending report{reports.length !== 1 ? "s" : ""}
                        </div>
                        {reports.length === 0 ? (
                            <div style={{
                                fontFamily: "var(--font-mono)", fontSize: "13px",
                                opacity: 0.4, padding: "48px 0",
                            }}>
                                No pending reports. All clear.
                            </div>
                        ) : (
                            reports.map((r) => (
                                <div key={r.id} style={{
                                    padding: "24px", border: "1.5px solid #f5f2eb",
                                    marginBottom: "16px",
                                }}>
                                    <div style={{
                                        fontFamily: "var(--font-mono)", fontSize: "11px",
                                        opacity: 0.4, marginBottom: "12px",
                                    }}>
                                        Reported by {r.reporter?.alias || "unknown"} ·{" "}
                                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                                    </div>
                                    <div style={{
                                        fontFamily: "var(--font-mono)", fontSize: "13px",
                                        lineHeight: 1.7, padding: "14px",
                                        background: "#2a2725", marginBottom: "16px",
                                    }}>
                                        {r.post?.body}
                                    </div>
                                    {r.reason && (
                                        <div style={{
                                            fontFamily: "var(--font-mono)", fontSize: "12px",
                                            opacity: 0.5, marginBottom: "16px",
                                        }}>
                                            Reason: {r.reason}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => handleReportAction(r.id, "actioned")}
                                            disabled={saving === r.id}
                                            style={{ ...primaryBtn, background: "#e8622c", borderColor: "#e8622c" }}>
                                            Remove post
                                        </button>
                                        <button
                                            onClick={() => handleReportAction(r.id, "dismissed")}
                                            disabled={saving === r.id}
                                            style={primaryBtn}>
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── ADMINS ── */}
                {tab === "admins" && (
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px",
                    }} className="two-col">

                        <div>
                            <div style={sectionLabel}>Create admin account</div>
                            <div style={{ marginBottom: "14px" }}>
                                <div style={fieldLabel}>Email</div>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) =>
                                        setNewAdmin((p) => ({ ...p, email: e.target.value }))
                                    }
                                    placeholder="newadmin@kyf.com"
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: "20px" }}>
                                <div style={fieldLabel}>Password</div>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) =>
                                        setNewAdmin((p) => ({ ...p, password: e.target.value }))
                                    }
                                    placeholder="min 6 characters"
                                    style={inputStyle}
                                />
                            </div>
                            {adminMsg && (
                                <div style={{
                                    fontFamily: "var(--font-mono)", fontSize: "12px",
                                    color: adminMsg.startsWith("✓") ? "#1a4fd4" : "#e8622c",
                                    marginBottom: "12px",
                                }}>
                                    {adminMsg}
                                </div>
                            )}
                            <button
                                onClick={handleAddAdmin}
                                disabled={saving === "admin"}
                                style={primaryBtn}>
                                {saving === "admin" ? "Creating…" : "Create admin →"}
                            </button>
                        </div>

                        <div>
                            <div style={sectionLabel}>
                                {adminAccounts.length} admin account{adminAccounts.length !== 1 ? "s" : ""}
                            </div>
                            {adminAccounts.map((a) => (
  <div key={a.id} style={{
    padding: "16px 0", borderBottom: "1px solid #2a2725",
  }}>
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", marginBottom: "10px",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
      }}>
        {a.email}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => {
            const newPass = prompt(`New password for ${a.email} (min 6 chars):`);
            if (newPass && newPass.length >= 6) {
              setSaving(a.id);
              fetch("/api/admin/update-admin-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId: a.id, newPassword: newPass }),
              }).then(() => { setSaving(null); router.refresh(); });
            }
          }}
          style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "6px 12px", background: "transparent",
            color: "#1a4fd4", border: "1px solid #1a4fd4",
            cursor: "pointer",
          }}>
          Change pass
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete admin ${a.email}? This cannot be undone.`)) {
              setSaving(a.id);
              fetch("/api/admin/delete-admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId: a.id }),
              }).then(async (res) => {
                const data = await res.json();
                if (!res.ok) alert(data.error);
                setSaving(null);
                router.refresh();
              });
            }
          }}
          style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "6px 12px", background: "transparent",
            color: "#e8622c", border: "1px solid #e8622c",
            cursor: "pointer",
          }}>
          {saving === a.id ? "…" : "Delete"}
        </button>
      </div>
    </div>
    <div style={{
      fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.4,
    }}>
      Created {new Date(a.created_at).toLocaleDateString("en-GB")}
    </div>
  </div>
))}
                        </div>
                    </div>
                )}

                {/* ── CONTRIBUTORS ── */}
                {tab === "contributors" && (
                  <div>
                    {/* Version control */}
                    <div style={{
                      marginBottom: "48px", paddingBottom: "48px",
                      borderBottom: "1.5px solid #f5f2eb",
                    }}>
                      <div style={sectionLabel}>Site version</div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", maxWidth: "360px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={fieldLabel}>Current version</div>
                          <input
                            value={newVersion}
                            onChange={(e) => setNewVersion(e.target.value)}
                            placeholder="e.g. 1.1"
                            style={inputStyle}
                          />
                        </div>
                        <button onClick={handleUpdateVersion} disabled={saving === "version"} style={primaryBtn}>
                          {saving === "version" ? "Saving…" : "Update"}
                        </button>
                      </div>
                      {versionMsg && (
                        <div style={{
                          fontFamily: "var(--font-mono)", fontSize: "12px",
                          color: versionMsg.startsWith("✓") ? "#1a4fd4" : "#e8622c",
                          marginTop: "8px",
                        }}>
                          {versionMsg}
                        </div>
                      )}
                    </div>

                    {/* Add contributor */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px",
                    }} className="two-col">
                      <div>
                        <div style={sectionLabel}>Add contributor</div>
                        {[
                          { label: "Role / Title", key: "role", type: "select" },
                          { label: "Full name", key: "name", placeholder: "e.g. MD. Safin Rahman" },
                          { label: "Student ID", key: "student_id", placeholder: "e.g. 2023-3-60-072" },
                          { label: "Email (optional)", key: "email", placeholder: "e.g. name@gmail.com" },
                          { label: "Website (optional)", key: "website", placeholder: "e.g. example.com" },
                          { label: "Display order", key: "display_order", placeholder: "e.g. 1" },
                        ].map((f) => (
                          <div key={f.key} style={{ marginBottom: "12px" }}>
                            <div style={fieldLabel}>{f.label}</div>
                            {f.type === "select" ? (
                              <select
                                value={(newContributor as any)[f.key]}
                                onChange={(e) => setNewContributor((p) => ({ ...p, [f.key]: e.target.value }))}
                                style={inputStyle}
                              >
                                <option value="" disabled>Select a role...</option>
                                <option value="Idea and Marketing">Idea and Marketing</option>
                                <option value="Data Collector">Data Collector</option>
                              </select>
                            ) : (
                              <input
                                value={(newContributor as any)[f.key]}
                                onChange={(e) => setNewContributor((p) => ({ ...p, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                style={inputStyle}
                              />
                            )}
                          </div>
                        ))}
                        {contributorMsg && (
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                            color: contributorMsg.startsWith("✓") ? "#1a4fd4" : "#e8622c",
                            marginBottom: "12px",
                          }}>
                            {contributorMsg}
                          </div>
                        )}
                        <button onClick={handleAddContributor} disabled={saving === "contributor"} style={primaryBtn}>
                          {saving === "contributor" ? "Adding…" : "Add contributor →"}
                        </button>
                      </div>

                      {/* Current contributors */}
                      <div>
                        <div style={sectionLabel}>{contributors.length} contributors</div>
                        {contributors.map((c) => (
                          <div key={c.id} style={{
                            padding: "16px 0", borderBottom: "1px solid #2a2725",
                            display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", gap: "12px",
                          }}>
                            <div>
                              <div style={{
                                fontFamily: "var(--font-mono)", fontSize: "10px",
                                letterSpacing: "0.1em", textTransform: "uppercase",
                                color: "#e8622c", opacity: 0.8, marginBottom: "4px",
                              }}>
                                {c.role}
                              </div>
                              <div style={{
                                fontFamily: "var(--font-sans)", fontSize: "14px",
                                fontWeight: 700, marginBottom: "2px",
                              }}>
                                {c.name}
                              </div>
                              {c.student_id && (
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.4 }}>
                                  {c.student_id}
                                </div>
                              )}
                              {c.email && (
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.4 }}>
                                  {c.email}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteContributor(c.id)}
                              disabled={saving === c.id}
                              style={{
                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                letterSpacing: "0.06em", textTransform: "uppercase",
                                padding: "6px 12px", background: "transparent",
                                color: "#e8622c", border: "1px solid #e8622c",
                                cursor: "pointer", flexShrink: 0,
                              }}>
                              {saving === c.id ? "…" : "Remove"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── REVIEWS ── */}
                {tab === "reviews" && (
                    <div>
                        {!reviewsLoaded ? (
                            <div>
                                <div style={sectionLabel}>Review management</div>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", opacity: 0.5, marginBottom: "20px" }}>
                                    Load all reviews to search, hide, or delete them.
                                </p>
                                <button onClick={loadReviews} disabled={reviewsLoading} style={primaryBtn}>
                                    {reviewsLoading ? "Loading…" : "Load reviews →"}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                                    <div style={sectionLabel}>{adminReviews.length} reviews total</div>
                                    <input
                                        value={reviewFilter}
                                        onChange={(e) => setReviewFilter(e.target.value)}
                                        placeholder="Filter by faculty name, student alias…"
                                        style={{ ...inputStyle, maxWidth: "360px" }}
                                    />
                                </div>
                                <div style={{ maxHeight: "700px", overflowY: "auto" }}>
                                    {adminReviews
                                        .filter((r) => {
                                            if (!reviewFilter.trim()) return true;
                                            const q = reviewFilter.toLowerCase();
                                            return (
                                                r.faculty?.name?.toLowerCase().includes(q) ||
                                                r.user?.alias?.toLowerCase().includes(q) ||
                                                r.user?.email?.toLowerCase().includes(q)
                                            );
                                        })
                                        .map((r) => (
                                            <div key={r.id} style={{
                                                padding: "20px", border: "1.5px solid #2a2725",
                                                marginBottom: "12px",
                                                opacity: r.is_visible ? 1 : 0.5,
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "12px" }}>
                                                    <div>
                                                        <div style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>
                                                            {r.faculty?.name || "Unknown faculty"}
                                                        </div>
                                                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", opacity: 0.5, display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                                            <span>by {r.user?.alias || "anon"}</span>
                                                            <span>{r.semester?.label || "No semester"}</span>
                                                            <span>{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                                                            {!r.is_visible && <span style={{ color: "#e8622c" }}>HIDDEN</span>}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                                        <button
                                                            onClick={() => handleReviewAdminAction(r.id, r.is_visible ? "hide" : "show")}
                                                            disabled={saving === r.id}
                                                            style={{
                                                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                                                letterSpacing: "0.06em", textTransform: "uppercase",
                                                                padding: "6px 12px", background: "transparent",
                                                                color: "#1a4fd4", border: "1px solid #1a4fd4",
                                                                cursor: "pointer",
                                                            }}>
                                                            {r.is_visible ? "Hide" : "Show"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReviewAdminAction(r.id, "delete")}
                                                            disabled={saving === r.id}
                                                            style={{
                                                                fontFamily: "var(--font-mono)", fontSize: "11px",
                                                                letterSpacing: "0.06em", textTransform: "uppercase",
                                                                padding: "6px 12px", background: "transparent",
                                                                color: "#e8622c", border: "1px solid #e8622c",
                                                                cursor: "pointer",
                                                            }}>
                                                            {saving === r.id ? "…" : "Delete"}
                                                        </button>
                                                    </div>
                                                </div>
                                                {r.answers && r.answers.length > 0 && (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                        {r.answers.map((a: any) => (
                                                            <div key={a.id} style={{
                                                                fontFamily: "var(--font-mono)", fontSize: "12px",
                                                                lineHeight: 1.6, padding: "8px 12px",
                                                                background: "#0f0f0f", border: "1px solid #2a2725",
                                                            }}>
                                                                <span style={{ opacity: 0.45 }}>{a.question?.question_text}: </span>
                                                                <span style={{ fontWeight: 500 }}>{a.answer_value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── IMPORT ── */}
                {tab === "import" && (
                    <div style={{ maxWidth: "720px" }}>
                        <ReviewImporter faculty={faculty} />
                    </div>
                )}

                {/* ── SCHEDULE ── */}
                {tab === "schedule" && (
                    <div style={{ maxWidth: "600px" }}>
                        <div style={sectionLabel}>Schedule management</div>
                        <ScheduleUploader semesters={semesters} />
                    </div>
                )}
            </div>

            <style>{`
        .stats-overview { grid-template-columns: repeat(5,1fr); }
        .two-col { grid-template-columns: 1fr 1fr; }
        .user-row { grid-template-columns: 1fr auto auto auto; }
        @media (max-width: 900px) {
          .stats-overview { grid-template-columns: repeat(2,1fr) !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .user-row { grid-template-columns: 1fr auto !important; }
          .user-row > span:first-of-type { display: none; }
        }
      `}</style>
        </div>
    );
}

const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "11px",
    letterSpacing: "0.14em", textTransform: "uppercase",
    opacity: 0.4, marginBottom: "24px",
};

const fieldLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "11px",
    letterSpacing: "0.1em", textTransform: "uppercase",
    opacity: 0.4, marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
    width: "100%", fontFamily: "var(--font-mono)",
    fontSize: "13px", padding: "12px 14px",
    border: "1.5px solid #f5f2eb", background: "transparent",
    color: "#f5f2eb", outline: "none",
};

const primaryBtn: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "12px",
    fontWeight: 500, letterSpacing: "0.06em",
    textTransform: "uppercase", padding: "12px 24px",
    background: "#f5f2eb", color: "#0f0f0f",
    border: "1.5px solid #f5f2eb", cursor: "pointer",
};

const badge: React.CSSProperties = {
    fontFamily: "var(--font-mono)", fontSize: "10px",
    letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "3px 8px", whiteSpace: "nowrap",
};

function ScheduleUploader({ semesters }: { semesters: any[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingSem, setDeletingSem] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress("Parsing PDF and setting up database...");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch("/api/admin/upload-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const sectionRows = data.sections || [];
      const batchSize = 500;
      let imported = 0;
      
      if (sectionRows.length > 0) {
        for (let i = 0; i < sectionRows.length; i += batchSize) {
          const batch = sectionRows.slice(i, i + batchSize);
          setProgress(`Importing sections ${i + 1} to ${Math.min(i + batchSize, sectionRows.length)} of ${sectionRows.length}... (${Math.round((i / sectionRows.length) * 100)}%)`);
          
          const batchRes = await fetch("/api/admin/upload-schedule-batch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sections: batch })
          });
          
          const batchData = await batchRes.json();
          if (!batchRes.ok) throw new Error(batchData.error || "Batch insertion failed.");
          imported += batch.length;
        }
      }

      setResult({
        semester: data.semester,
        sections_imported: imported,
        faculty_created: data.faculty_created,
        courses_created: data.courses_created,
        total_parsed: data.total_parsed,
      });
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function handleDeleteSemester(semesterId: string, label: string) {
    if (!confirm(`Remove all data for "${label}"? This deletes all sections for this semester.`)) return;
    setDeletingSem(semesterId);

    const res = await fetch("/api/admin/delete-semester", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semesterId }),
    });

    const data = await res.json();
    if (!res.ok) alert(data.error);
    setDeletingSem(null);
    router.refresh();
  }

  return (
    <div>
      {/* Existing semesters */}
      {semesters.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div style={sectionLabel}>Existing semesters</div>
          {semesters.map((s) => (
            <div key={s.id} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "14px 0",
              borderBottom: "1px solid #2a2725",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500,
                }}>
                  {s.label}
                </span>
                {s.is_active && (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "#1a4fd4", border: "1px solid #1a4fd4",
                    padding: "2px 7px",
                  }}>
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteSemester(s.id, s.label)}
                disabled={deletingSem === s.id}
                style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "6px 12px", background: "transparent",
                  color: "#e8622c", border: "1px solid #e8622c",
                  cursor: "pointer",
                }}>
                {deletingSem === s.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload new */}
      <div style={sectionLabel}>Upload new schedule PDF</div>

      <div style={{
        padding: "16px", background: "#2a2725",
        marginBottom: "24px",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          letterSpacing: "0.06em", textTransform: "uppercase",
          opacity: 0.5, marginBottom: "4px",
        }}>
          Note
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          lineHeight: 1.6, opacity: 0.7,
        }}>
          The semester name is detected automatically from the PDF.
          Faculty with no assignment will be shown as TBA.
          New faculty and courses are created automatically.
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div style={fieldLabel}>Select PDF</div>
        <label style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px", border: "1.5px dashed #c8c2b4",
          cursor: "pointer",
        }}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "8px 14px", background: "#f5f2eb",
            color: "#0f0f0f", flexShrink: 0,
          }}>
            Choose PDF
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: "12px", opacity: 0.5,
          }}>
            {file ? file.name : "No file selected"}
          </span>
        </label>
      </div>

      {error && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          color: "#e8622c", border: "1px solid #e8622c",
          padding: "12px 16px", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {progress && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          color: "#34d399", border: "1px solid #34d399",
          padding: "12px 16px", marginBottom: "16px",
          background: "rgba(52,211,153,0.06)",
        }}>
          {progress}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        style={{
          ...primaryBtn,
          opacity: uploading || !file ? 0.5 : 1,
          cursor: uploading || !file ? "not-allowed" : "pointer",
          width: "100%", textAlign: "center",
        }}>
        {uploading ? "Parsing & importing…" : "Upload & import →"}
      </button>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: "24px", padding: "20px",
          border: "1.5px solid #1a4fd4",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#1a4fd4", marginBottom: "12px",
          }}>
            ✓ Import successful
          </div>
          {[
            ["Semester detected", result.semester],
            ["Sections imported", result.sections_imported],
            ["Total in PDF", result.total_parsed],
            ["New faculty created", result.faculty_created],
            ["New courses created", result.courses_created],
          ].map(([label, val]) => (
            <div key={label as string} style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: "var(--font-mono)", fontSize: "12px",
              padding: "6px 0", borderBottom: "1px solid #2a2725",
            }}>
              <span style={{ opacity: 0.5 }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{val}</span>
            </div>
          ))}
          {result.faculty_created > 0 && (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              opacity: 0.5, marginTop: "12px", lineHeight: 1.6,
            }}>
              {result.faculty_created} new faculty created with initials as placeholder names.
              Go to the Faculty tab to update their full names and departments.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewImporter({ faculty }: { faculty: any[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
    setCsvPreview(null);

    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const preview = lines.slice(0, 6).map((line) => {
          const vals: string[] = [];
          let current = "";
          let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQ = !inQ; }
            else if (c === ',' && !inQ) { vals.push(current.trim()); current = ""; }
            else { current += c; }
          }
          vals.push(current.trim());
          return vals;
        });
        setCsvPreview(preview);
      };
      reader.readAsText(f);
    }
  }

  async function handleImport() {
    if (!file) { setError("Please select a CSV file."); return; }
    setImporting(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error("CSV file is empty or missing data.");

      const header = lines[0];
      const dataLines = lines.slice(1);
      
      let totalImported = 0;
      let totalSkipped = 0;
      let allSkippedReasons: string[] = [];
      const batchSize = 25; // Process 25 rows at a time to stay well within timeout
      
      for (let i = 0; i < dataLines.length; i += batchSize) {
        const chunk = dataLines.slice(i, i + batchSize);
        const csvChunk = [header, ...chunk].join("\n");
        
        setProgress(`Importing rows ${i + 1} to ${Math.min(i + batchSize, dataLines.length)} of ${dataLines.length} (${Math.round((i / dataLines.length) * 100)}%)`);

        const res = await fetch("/api/admin/import-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvContent: csvChunk }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Import failed.");
        
        totalImported += data.imported || 0;
        totalSkipped += data.skipped || 0;
        if (data.skippedReasons) {
          allSkippedReasons = [...allSkippedReasons, ...data.skippedReasons];
        }
      }

      setResult({ 
        success: true, 
        imported: totalImported, 
        skipped: totalSkipped, 
        total: dataLines.length,
        skippedReasons: allSkippedReasons.slice(0, 20)
      });
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImporting(false);
      setProgress(null);
    }
  }

  async function handleDeleteAllReviews() {
    if (!window.confirm("WARNING: This will delete ALL reviews in the database, including all imported reviews. This action cannot be undone. Are you sure?")) return;
    
    setDeletingAll(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/delete-all-reviews", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete reviews.");
      
      setResult({ deletedAll: true });
      setFile(null);
      setCsvPreview(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={sectionLabel}>Import reviews from CSV</div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: "13px",
            lineHeight: 1.7, opacity: 0.5,
            maxWidth: "520px",
          }}>
            Upload a CSV file to seed reviews. Reviews will be matched to existing faculty
            by initial or name.
          </p>
        </div>
        
        <button
          onClick={handleDeleteAllReviews}
          disabled={deletingAll}
          style={{
            fontFamily: "var(--font-mono)", fontSize: "12px",
            fontWeight: 500, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "12px 24px",
            border: "1.5px solid rgba(248,113,113,0.3)",
            color: "#f87171",
            opacity: deletingAll ? 0.5 : 1,
            cursor: deletingAll ? "not-allowed" : "pointer",
            background: "rgba(248,113,113,0.05)",
          }}>
          {deletingAll ? "Deleting..." : "Delete all reviews"}
        </button>
      </div>

      {/* Expected format */}
      <div style={{
        padding: "18px", border: "1px solid #2a2725",
        background: "#1a1917", marginBottom: "24px",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "10px",
          letterSpacing: "0.1em", textTransform: "uppercase",
          opacity: 0.4, marginBottom: "10px",
        }}>
          Expected CSV columns
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          lineHeight: 1.8, opacity: 0.7,
          display: "flex", flexWrap: "wrap", gap: "8px",
        }}>
          {["Department", "Course", "Faculty Name", "Initial",
            "Strict about attendance?", "Fair Grading?", "Clear teaching?",
            "Recommended?", "Comment(s)"].map((col) => (
            <span key={col} style={{
              padding: "3px 10px", border: "1px solid #2a2725",
              fontSize: "11px", whiteSpace: "nowrap",
            }}>
              {col}
            </span>
          ))}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "11px",
          opacity: 0.35, marginTop: "10px", lineHeight: 1.6,
        }}>
          For "Recommended?" use <strong style={{ opacity: 0.8 }}>Yes</strong> or <strong style={{ opacity: 0.8 }}>Drop</strong>.
          Other MCQ questions use Yes/No.
        </div>
      </div>

      {/* File input */}
      <div style={{ marginBottom: "20px" }}>
        <div style={fieldLabel}>CSV file</div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          style={{
            fontFamily: "var(--font-mono)", fontSize: "13px",
            color: "#f5f2eb", cursor: "pointer",
          }}
        />
      </div>

      {/* Preview */}
      {csvPreview && csvPreview.length > 0 && (
        <div style={{
          marginBottom: "24px", border: "1px solid #2a2725",
          overflow: "auto", maxHeight: "220px",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "10px",
            letterSpacing: "0.1em", textTransform: "uppercase",
            opacity: 0.4, padding: "10px 14px",
            borderBottom: "1px solid #2a2725",
            background: "#1a1917", position: "sticky", top: 0,
          }}>
            Preview (first {Math.min(csvPreview.length - 1, 5)} rows)
          </div>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontFamily: "var(--font-mono)", fontSize: "11px",
          }}>
            <thead>
              <tr>
                {csvPreview[0].map((h, i) => (
                  <th key={i} style={{
                    padding: "8px 10px", textAlign: "left",
                    borderBottom: "1.5px solid #2a2725",
                    background: "#1a1917", whiteSpace: "nowrap",
                    fontWeight: 600, opacity: 0.7,
                    letterSpacing: "0.04em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvPreview.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "6px 10px",
                      borderBottom: "1px solid #1a1917",
                      opacity: 0.6, whiteSpace: "nowrap",
                      maxWidth: "160px", overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Faculty match info */}
      {file && (
        <div style={{
          padding: "14px 18px", background: "rgba(232,98,44,0.06)",
          border: "1px solid rgba(232,98,44,0.15)",
          marginBottom: "20px",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            opacity: 0.6, lineHeight: 1.6,
          }}>
            <span style={{ color: "#e8622c", fontWeight: 600 }}>{faculty.length}</span> faculty in database available for matching.
            Rows with unmatched faculty will be skipped.
          </div>
        </div>
      )}

      {error && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          color: "#f87171", border: "1px solid rgba(248,113,113,0.3)",
          background: "rgba(248,113,113,0.06)",
          padding: "12px 16px", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {progress && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: "12px",
          color: "#34d399", border: "1px solid #34d399",
          padding: "12px 16px", marginBottom: "16px",
          background: "rgba(52,211,153,0.06)",
        }}>
          {progress}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={importing || !file}
        style={{
          ...primaryBtn,
          opacity: importing || !file ? 0.5 : 1,
          cursor: importing || !file ? "not-allowed" : "pointer",
          width: "100%", textAlign: "center",
          background: importing ? "#2a2725" : "#e8622c",
          color: importing ? "#f5f2eb" : "#0f0f0f",
          borderColor: importing ? "#2a2725" : "#e8622c",
        }}>
        {importing ? "Importing reviews…" : "Import reviews →"}
      </button>

      {/* Result */}
      {result && result.deletedAll && (
        <div style={{
          marginTop: "24px", padding: "16px 24px",
          border: "1.5px solid #f87171",
          background: "rgba(248,113,113,0.06)",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "12px",
            color: "#f87171", fontWeight: 600,
          }}>
            ✓ All reviews have been deleted successfully.
          </div>
        </div>
      )}

      {result && !result.deletedAll && (
        <div style={{
          marginTop: "24px", padding: "24px",
          border: `1.5px solid ${result.skipped > 0 ? "#fbbf24" : "#34d399"}`,
          background: result.skipped > 0
            ? "rgba(251,191,36,0.04)"
            : "rgba(52,211,153,0.04)",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: result.skipped > 0 ? "#fbbf24" : "#34d399",
            marginBottom: "16px", fontWeight: 600,
          }}>
            ✓ Import complete
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px", marginBottom: "20px",
          }}>
            {[
              { label: "Imported", val: result.imported, color: "#34d399" },
              { label: "Skipped", val: result.skipped, color: result.skipped > 0 ? "#fbbf24" : "#34d399" },
              { label: "Total rows", val: result.total, color: "#f5f2eb" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "16px", border: "1px solid #2a2725",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: "28px",
                  fontWeight: 800, letterSpacing: "-0.03em",
                  color: s.color,
                }}>
                  {s.val}
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "10px",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  opacity: 0.5, marginTop: "4px",
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Skipped reasons */}
          {result.skippedReasons && result.skippedReasons.length > 0 && (
            <div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "10px",
                letterSpacing: "0.1em", textTransform: "uppercase",
                opacity: 0.4, marginBottom: "8px",
              }}>
                Skipped details (first 20)
              </div>
              <div style={{
                maxHeight: "200px", overflowY: "auto",
                border: "1px solid #2a2725", padding: "4px 0",
              }}>
                {result.skippedReasons.map((r: string, i: number) => (
                  <div key={i} style={{
                    fontFamily: "var(--font-mono)", fontSize: "11px",
                    padding: "6px 14px", opacity: 0.6,
                    borderBottom: i < result.skippedReasons.length - 1
                      ? "1px solid #1a1917" : "none",
                  }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}