"use client";

import type * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    );
    const [message, setMessage] = useState("");

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setStatus("loading");
        setMessage("Creating your BIRAMY Galaxy Pass...");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    username,
                    password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || data?.ok === false) {
                throw new Error(data?.error ?? "Signup failed.");
            }

            setStatus("success");
            setMessage("Galaxy Pass created! Sending you to login...");

            setTimeout(() => {
                router.push("/login");
            }, 900);
        } catch (error) {
            setStatus("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while creating your Galaxy Pass."
            );
        }
    }

    return (
        <main className="min-h-screen bg-[#070711] px-6 py-16 text-white">
            <section className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                    <p className="mb-4 text-sm uppercase tracking-[0.35em] text-amber-100/70">
                        BIRAMY Galaxy
                    </p>

                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                        Create your Galaxy Pass
                    </h1>

                    <p className="mt-5 text-lg leading-8 text-white/70">
                        Try the Galaxy as a guest, then create a pass when you want to save
                        your favourite pieces, build your Closet, and join future style
                        missions.
                    </p>

                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">
                        <p className="font-medium text-white">Guest access stays open:</p>
                        <p className="mt-2">
                            Visitors can explore, try items on, and shop. A Galaxy Pass is
                            needed for saving to Closet, chat, quests, and personal styling.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur"
                >
                    <h2 className="text-2xl font-semibold">Join the Galaxy</h2>

                    <label className="mt-6 block text-sm font-medium text-white/80">
                        Display name
                    </label>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/40"
                        placeholder="Example: Jen"
                        autoComplete="name"
                        required
                    />

                    <label className="mt-5 block text-sm font-medium text-white/80">
                        Username
                    </label>
                    <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/40"
                        placeholder="Choose a username"
                        autoComplete="username"
                        required
                    />

                    <label className="mt-5 block text-sm font-medium text-white/80">
                        Password
                    </label>
                    <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/40"
                        placeholder="Create a password"
                        type="password"
                        autoComplete="new-password"
                        required
                    />

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="mt-7 w-full rounded-2xl bg-amber-100 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {status === "loading" ? "Creating Pass..." : "Create Galaxy Pass"}
                    </button>

                    {message && (
                        <p
                            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status === "error"
                                    ? "bg-red-500/15 text-red-200"
                                    : status === "success"
                                        ? "bg-emerald-500/15 text-emerald-200"
                                        : "bg-white/10 text-white/70"
                                }`}
                        >
                            {message}
                        </p>
                    )}

                    <p className="mt-5 text-center text-sm text-white/60">
                        Already have a Galaxy Pass?{" "}
                        <Link href="/login" className="font-semibold text-amber-100">
                            Login
                        </Link>
                    </p>
                </form>
            </section>
        </main>
    );
}