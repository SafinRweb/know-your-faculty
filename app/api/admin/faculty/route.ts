import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;
    if (!session || user?.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, department, initial } = await req.json();
    if (!name?.trim() || !department?.trim()) {
        return NextResponse.json(
            { error: "Name and department required." },
            { status: 400 }
        );
    }

    const { error } = await supabase.from("faculty").insert({
        name: name.trim(),
        department: department.trim().toUpperCase(),
        initial: initial?.trim().toUpperCase() || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}