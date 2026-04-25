import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin as supabase } from "./supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,

    providers: [
        // ── STUDENT: Google OAuth (EWU only) ──
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    hd: "std.ewubd.edu",
                    prompt: "select_account",
                },
            },
        }),

        // ── ADMIN: Email + Password ──
        Credentials({
            id: "admin-credentials",
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) return null;

                const { data: verified } = await supabase
                  .rpc("verify_admin_password", { p_email: email, p_password: password });

                if (!verified) return null;

                // Get admin UUID from admins table
                const { data: adminRow } = await supabase
                  .from("admins")
                  .select("id, display_name, avatar_color")
                  .eq("email", email)
                  .single();

                if (!adminRow) return null;

                return {
                  id: adminRow.id,  // ← real UUID now
                  email,
                  name: adminRow.display_name,
                  role: "admin",
                  isSetup: true,
                  adminId: adminRow.id,
                };
            },
        }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async signIn({ account, profile }) {
            // Only run domain check for Google provider
            if (account?.provider === "google") {
                const email = profile?.email ?? "";
                if (!email.endsWith("@std.ewubd.edu")) return false;

                const { data: existing } = await supabase
                    .from("users")
                    .select("id")
                    .eq("email", email)
                    .single();

                if (!existing) {
                    const { error: insertError } = await supabase
                        .from("users")
                        .insert({
                            email,
                            alias: email.split("@")[0],
                            role: "student",
                            is_setup: false,
                        });

                    if (insertError) {
                        console.error("Failed to create user:", insertError.message);
                        return false;
                    }
                }
            }
            return true;
        },

            async jwt({ token, user, account, trigger, session }) {
                console.log("JWT CALLBACK:", { trigger, session, email: token.email });
                // Admin login via credentials
                if (account?.provider === "admin-credentials" && user) {
                    token.role = "admin";
                    token.userId = user.id;  // ← now a real UUID
                    token.alias = (user as any).name || "Know_Your_Faculty";
                    token.isSetup = true;
                    token.isAdmin = true;
                    return token;
                }

                if (trigger === "update" && session) {
                    console.log("TRIGGER UPDATE:", session);
                    token.isSetup = session.isSetup ?? token.isSetup;
                    token.alias = session.alias ?? token.alias;
                    token.avatarColor = session.avatarColor ?? token.avatarColor;
                    return token;
                }

                // Always re-fetch student data from Supabase on every token refresh
                if (!token.isAdmin && token.email) {
                    const { data } = await supabase
                        .from("users")
                        .select("id, role, alias, is_setup, avatar_color")
                        .eq("email", token.email)
                        .single();

                    console.log("SUPABASE DATA:", data);

                    if (data) {
                        token.userId = data.id;
                        token.role = data.role;
                        token.alias = data.alias;
                        token.isSetup = data.is_setup;
                        token.isAdmin = false;
                    }
                }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).role = token.role;
                (session.user as any).alias = token.alias;
                (session.user as any).isSetup = token.isSetup;
                (session.user as any).isAdmin = token.isAdmin;

                // ── FOOLPROOF FALLBACK ──
                // If the JWT cookie is stale and says isSetup is false,
                // double-check the database directly to prevent infinite onboarding loops.
                if (token.isSetup === false && token.email && !token.isAdmin) {
                    const { data } = await supabase
                        .from("users")
                        .select("is_setup, alias, avatar_color")
                        .eq("email", token.email)
                        .single();
                    
                    if (data && data.is_setup) {
                        (session.user as any).isSetup = true;
                        (session.user as any).alias = data.alias;
                    }
                }
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },
});