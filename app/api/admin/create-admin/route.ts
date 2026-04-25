import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password } = await req.json();

    if (!email?.trim() || !password?.trim()) {
        return NextResponse.json(
            { error: "Email and password required." },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: "Password must be at least 6 characters." },
            { status: 400 }
        );
    }

    const { error } = await supabase.rpc("create_admin_account", {
        p_email: email.trim(),
        p_password: password,
    });

    if (error) {
        if (error.message.includes("unique")) {
            return NextResponse.json(
                { error: "An admin with this email already exists." },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}