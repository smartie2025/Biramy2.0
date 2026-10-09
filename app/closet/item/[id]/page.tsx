
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ClosetItem = Record<string, unknown>;

function getText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function getRecordId(item: ClosetItem): string | null {
  return getText(item.closetItemId, item.id);
}

function getList(value: unknown): ClosetItem[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is ClosetItem =>
        v !== null &&
        typeof v === "object" &&
        !Array.isArray(v)
    );
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of [
      "closet",
      "items",
      "value",
      "results",
      "data",
    ]) {
      if (Array.isArray(record[key])) {
        return getList(record[key]);
      }
    }
  }

  return [];
}

function formatDate(value: unknown): string {
  const text = getText(value);
  if (!text) return "Saved recently";

  const date = new Date(text);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() < 1900
  ) {
    return "Saved recently";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ClosetItemPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [item, setItem] = useState<ClosetItem | null>(null);

  const [status, setStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setStatus("missing");
      return;
    }

    let cancelled = false;

    async function loadItem() {
      try {
        const response = await fetch("/api/closet", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || data.ok === false) {
          throw new Error(
            data.error || "Unable to load Closet."
          );
        }

        const records = getList(data.closet);

        const selected = records.find(
          (record) => getRecordId(record) === id
        );

        if (cancelled) return;

        if (!selected) {
          setStatus("missing");
          return;
        }

        setItem(selected);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unknown error."
        );

        setStatus("error");
      }
    }

    loadItem();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const name = item
    ? getText(
        item.nickName,
        item.nickname,
        item.name
      ) ?? "Saved BIRAMY Piece"
    : "";

  const category = item
    ? getText(
        item.categoryName,
        item.category,
        item.type,
        item.itemType,
        item.productType
      ) ?? "Saved Item"
    : "";

  const image = item
    ? getText(
        item.image,
        item.imageUrl,
        item.url,
        item.src,
        item.thumb,
        item.thumbnail
      )
    : null;

  const savedDate = item
    ? formatDate(
        item.purchaseDate ??
        item.createdAt ??
        item.dateCreated
      )
    : "";

  const rating = item
    ? getText(item.rating)
    : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
            BIRAMY Galaxy
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            {status === "ready"
              ? name
              : "Saved Item Details"}
          </h1>

          <p className="mt-2 font-serif text-lg italic text-amber-100">
            Your Closet. Your Style. Your Voice.
          </p>
        </header>

        {status === "loading" && (
          <p className="text-slate-300">
            Retrieving your saved Galaxy piece...
          </p>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6">
            <h2 className="font-semibold text-rose-100">
              Could not load this item.
            </h2>

            <p className="mt-2 text-sm text-rose-200">
              {error}
            </p>
          </div>
        )}

        {status === "missing" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h2 className="font-serif text-2xl">
              We couldn't find this saved piece.
            </h2>

            <p className="mt-3 text-slate-300">
              It may have been removed from your Closet.
            </p>
          </div>
        )}

        {status === "ready" && item && (
          <section className="grid gap-6 lg:grid-cols-2">

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900">

              <div className="flex aspect-[4/3] items-center justify-center bg-slate-950">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="p-8 text-center text-slate-400">
                    Item preview unavailable
                  </p>
                )}
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-100">
                  {category}
                </p>

                <h2 className="mt-2 font-serif text-3xl">
                  {name}
                </h2>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">

              <h2 className="mb-6 font-serif text-2xl">
                Your Saved Piece
              </h2>

              <div className="space-y-5">

                <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Category
                  </span>

                  <span className="font-semibold">
                    {category}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Saved
                  </span>

                  <span className="font-semibold">
                    {savedDate}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Rating
                  </span>

                  <span className="font-semibold text-amber-100">
                    {rating ?? "Not rated"}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
                  <span className="text-slate-400">
                    Status
                  </span>

                  <span className="font-semibold text-amber-100">
                    Saved in Closet
                  </span>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-amber-100/20 bg-amber-100/5 p-4">

                <p className="font-serif text-lg text-amber-100">
                  Your Galaxy, Your Style.
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  This piece is part of your personal
                  BIRAMY collection.
                </p>
              </div>
            </aside>
          </section>
        )}

        <div className="mt-8">
          <Link
            href="/closet"
            className="inline-flex rounded-2xl bg-amber-100 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-50"
          >
            ← Return to My Closet
          </Link>
        </div>
      </div>
    </main>
  );
}
