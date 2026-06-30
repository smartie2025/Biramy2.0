"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SessionState = {
    loggedIn: boolean;
    username: string | null;
};

export default function AuthNav() {
    const router = useRouter();
    const pathname = usePathname();

    const [session, setSession] = useState<SessionState>({
        loggedIn: false,
        username: null,
    });

    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    const loadSession = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me", {
                method: "GET",
                cache: "no-store",
            });

            const data = await response.json();

            setSession({
                loggedIn: Boolean(data.loggedIn),
                username: typeof data.username === "string" ? data.username : null,
            });
        } catch {
            setSession({
                loggedIn: false,
                username: null,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    async function handleLogout() {
        try {
            setLoggingOut(true);

            await fetch("/api/auth/logout", {
                method: "POST",
                cache: "no-store",
            });

            setSession({
                loggedIn: false,
                username: null,
            });

            router.push("/");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    }

    useEffect(() => {
        loadSession();
    }, [loadSession, pathname]);

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500">
                Checking...
            </div>
        );
    }

    if (!session.loggedIn) {
        return (
            <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="hidden max-w-[360px] rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs leading-5 text-slate-700 shadow-sm lg:block">
                    <span className="block font-bold uppercase tracking-[0.08em] text-slate-900">
                        Create a BIRAMY Account 💫
                    </span>
                    <span className="text-slate-600">
                        Step into your Style Atelier and save your Favourites
                    </span>
                </div>

                <Link
                    href="/login"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-slate-800 shadow-sm transition hover:bg-slate-100"
                >
                    LOGIN
                </Link>
            </div>
        );
    }
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 lg:block">
                {session.username ? `GALAXY PASS: ${session.username}` : "GALAXY PASS ACTIVE"}
            </div>

            <Link
                href="/closet"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-slate-800 shadow-sm transition hover:bg-slate-100">
                MY CLOSET
            </Link>

            <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">
                {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
            </button>
        </div>
    );
}