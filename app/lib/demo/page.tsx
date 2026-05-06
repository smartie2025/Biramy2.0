"use client";

import React from "react";

type DemoCategoryId = "earrings" | "sunglasses" | "tech";

interface DemoCategory {
  id: DemoCategoryId;
  label: string;
  description: string;
}

interface DemoItem {
  id: string;
  title: string;
  categoryId: DemoCategoryId;
  description: string;
  videoUrl: string;
}

const CATEGORIES: DemoCategory[] = [
  {
    id: "earrings",
    label: "Earrings Looks",
    description: "Short clips showing AR try-on for earrings.",
  },
  {
    id: "sunglasses",
    label: "Sunglasses Looks",
    description: "AR try-on experience for sunglasses.",
  },
  {
    id: "tech",
    label: "Tech & Behind the Scenes",
    description: "Developer-focused walkthroughs, pipelines, and AR magic under the hood.",
  },
];

const DEMOS: DemoItem[] = [
  {
    id: "diamond",
    title: "Diamond earrings look",
    categoryId: "earrings",
    description: "AR try-on of diamond earrings.",
    videoUrl: "/assets/demo/diamond_earrings.mp4",
  },
  {
    id: "pearl",
    title: "Pearl earrings look",
    categoryId: "earrings",
    description: "AR try-on of pearl earrings.",
    videoUrl: "/assets/demo/pearl_earrings.mp4",
  },
  {
    id: "sunglasses",
    title: "Sunglasses look",
    categoryId: "sunglasses",
    description: "AR sunglasses try-on demo.",
    videoUrl: "/assets/demo/sunglasses.mp4",
  },
    {
    id: "sunglasses-2",
    title: "Sunglasses look",
    categoryId: "sunglasses",
    description: "AR sunglasses try-on demo.",
    videoUrl: "/assets/demo/glasses.mp4",
  },
    {
    id: "sunglasses-3",
    title: "Sunglasses look",
    categoryId: "sunglasses",
    description: "AR sunglasses try-on demo.",
    videoUrl: "/assets/demo/TryOn.mp4",
  },
];

export default function DemoPage() {
  const [activeCategory, setActiveCategory] =
    React.useState<DemoCategoryId>("earrings");

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;
  const filteredDemos = DEMOS.filter(
    (demo) => demo.categoryId === activeCategory
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
        {/* Page header */}
        <header className="mb-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">
            Live Demo Library
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            See the shopping experience in action
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Use these clips when you talk to investors, brands, or early testers.
            Each category is tailored for a different kind of conversation.
          </p>
        </header>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={[
                  "rounded-full border px-4 py-2 text-xs font-medium transition",
                  isActive
                    ? "border-sky-400 bg-sky-500/10 text-sky-200 shadow-sm"
                    : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-sky-500 hover:text-sky-200",
                ].join(" ")}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Category description */}
        <p className="mb-6 text-xs text-slate-400">
          {currentCategory.description}
        </p>

        {/* Demo grid */}
        {filteredDemos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
            No demos assigned to this category yet.
            <br />
            <span className="text-xs text-slate-500">
              (Check that your demo items use{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 text-[0.7rem]">
                categoryId="{activeCategory}"
              </code>
              .)
            </span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredDemos.map((demo) => (
              <article
                key={demo.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-900">
                  <iframe
                    className="h-full w-full"
                    src={demo.videoUrl}
                    title={demo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="text-sm font-semibold text-slate-50">
                    {demo.title}
                  </h2>
                  <p className="text-xs text-slate-300">{demo.description}</p>
                  <p className="mt-auto pt-2 text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
                    {currentCategory.label}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
