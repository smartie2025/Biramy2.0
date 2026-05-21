"use client";

import type * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    );
    const [message, setMessage] = useState("");

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setStatus("loading");
        setMessage("Opening the BIRAMY Galaxy gateway...");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus("error");
                setMessage(data.error || "Login failed. Please try again.");
                return;
            }

            setStatus("success");
            setMessage("Login successful! Entering your closet...");

            router.push("/closet");
            router.refresh();
        } catch (error) {
            console.error("Login page error:", error);
            setStatus("error");
            setMessage("Something went wrong while logging in.");
        }
    }

    return (
        <main className="min-h-screen bg-[#070711] px-6 py-16 text-white">
            <section className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                    <p className="mb-4 text-sm uppercase tracking-[0.35em] text-white/50">
                        BIRAMY Galaxy
                    </p>

                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                        Login to your personal closet
                    </h1>

                    <p className="mt-5 text-lg leading-8 text-white/70">
                        Save your favourite pieces, build looks, and prepare for social
                        outfit feedback across the galaxy.
                    </p>

                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">
                        <p className="font-medium text-white">Mission unlocked:</p>
                        <p className="mt-2">
                            Your account will become the key to your closet, saved looks,
                            XP missions, and future chat features.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur"
                >
                    <h2 className="text-2xl font-semibold">Welcome back</h2>

                    <label className="mt-6 block text-sm font-medium text-white/80">
                        Username
                    </label>
                    <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/40"
                        placeholder="Enter your username"
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
                        placeholder="Enter your password"
                        type="password"
                        autoComplete="current-password"
                        required
                    />

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="mt-7 w-full rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {status === "loading" ? "Logging in..." : "Enter BIRAMY Galaxy"}
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
                        Need a Galaxy Pass?{" "}
                        <a href="/signup" className="font-semibold text-amber-100">
                            Create one
                        </a>
                    </p>
                </form>
            </section>
        </main>
    );
}