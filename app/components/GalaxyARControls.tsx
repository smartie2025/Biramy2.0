
"use client";

import React from "react";
import { useTryOnStore } from "../store/tryon";

type Metric = "x" | "y" | "scale" | "rotation" | "z" | "opacity";

type MetricConfig = {
  id: Metric;
  label: string;
  min: number;
  max: number;
  step: number;
  precision: number;
  suffix: string;
};

const METRICS: MetricConfig[] = [
  {
    id: "x",
    label: "Position X",
    min: -250,
    max: 250,
    step: 1,
    precision: 0,
    suffix: "",
  },
  {
    id: "y",
    label: "Position Y",
    min: -250,
    max: 250,
    step: 1,
    precision: 0,
    suffix: "",
  },
  {
    id: "scale",
    label: "Scale",
    min: 0.1,
    max: 3,
    step: 0.01,
    precision: 2,
    suffix: "x",
  },
  {
    id: "rotation",
    label: "Rotation",
    min: -180,
    max: 180,
    step: 1,
    precision: 0,
    suffix: "°",
  },
  {
    id: "z",
    label: "Depth (Z)",
    min: -0.5,
    max: 0.5,
    step: 0.01,
    precision: 2,
    suffix: "",
  },
  {
    id: "opacity",
    label: "Opacity",
    min: 0,
    max: 1,
    step: 0.01,
    precision: 0,
    suffix: "%",
  },
];

export default function GalaxyARControls() {
  const { layers, activeLayerId, updateLayer } = useTryOnStore();

  const [selectedMetric, setSelectedMetric] =
    React.useState<Metric>("y");

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const activeLayer =
    (activeLayerId &&
      layers.find((layer) => layer.id === activeLayerId)) ||
    layers[layers.length - 1] ||
    null;

  const selectedConfig =
    METRICS.find((metric) => metric.id === selectedMetric) ??
    METRICS[1];

  const value = activeLayer
    ? activeLayer[selectedMetric]
    : 0;

  function updateValue(nextValue: number) {
    if (!activeLayer) return;

    const clamped = Math.max(
      selectedConfig.min,
      Math.min(selectedConfig.max, nextValue)
    );

    const rounded = Number(
      clamped.toFixed(
        selectedMetric === "opacity" ||
          selectedMetric === "scale" ||
          selectedMetric === "z"
          ? 2
          : 0
      )
    );

    updateLayer(activeLayer.id, {
      [selectedMetric]: rounded,
    });
  }

  function fineTune(direction: -1 | 1) {
    updateValue(value + direction * selectedConfig.step);
  }

  function resetLayer() {
    if (!activeLayer) return;

    updateLayer(activeLayer.id, {
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      rotation: 0,
      opacity: 0.95,
    });
  }

  function formatValue() {
    if (selectedMetric === "opacity") {
      return `${(value * 100).toFixed(0)}%`;
    }

    return (
      value.toFixed(selectedConfig.precision) +
      selectedConfig.suffix
    );
  }

  function metricButton(metric: MetricConfig) {
    const selected = selectedMetric === metric.id;

    return (
      <button
        key={metric.id}
        type="button"
        onClick={() => setSelectedMetric(metric.id)}
        disabled={!activeLayer}
        aria-pressed={selected}
        className={[
          "min-h-11 rounded-xl border px-2 py-3",
          "text-xs font-semibold transition",
          "disabled:cursor-not-allowed disabled:opacity-40",
          selected
            ? "border-amber-100 bg-amber-100 text-slate-950"
            : "border-white/15 bg-white/5 text-white hover:border-amber-100/50",
        ].join(" ")}
      >
        {metric.id === "rotation"
          ? "Rotate"
          : metric.id === "scale"
            ? "Scale"
            : metric.id === "opacity"
              ? "Opacity"
              : metric.id === "z"
                ? "Depth"
                : metric.id.toUpperCase()}
      </button>
    );
  }

  return (
    <section className="mt-4 rounded-[1.75rem] border border-amber-100/25 bg-slate-900/90 p-4 shadow-xl shadow-black/20">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-100">
          BIRAMY Galaxy
        </div>

        <h2 className="mt-2 font-serif text-xl font-semibold text-white">
          AR Control Deck
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Select an adjustment and fine-tune your look
          while watching the AR Mirror.
        </p>
      </div>

      {!activeLayer ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
          Select an accessory to activate your controls.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="truncate text-sm font-semibold text-amber-100">
            Adjusting:{" "}
            {activeLayer.asset.name ??
              activeLayer.asset.id}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {METRICS.slice(0, 4).map(metricButton)}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <label
                htmlFor="galaxy-active-slider"
                className="text-sm font-semibold text-white"
              >
                {selectedConfig.label}
              </label>

              <span className="text-sm font-semibold tabular-nums text-amber-100">
                {formatValue()}
              </span>
            </div>

            <input
              id="galaxy-active-slider"
              type="range"
              min={selectedConfig.min}
              max={selectedConfig.max}
              step={selectedConfig.step}
              value={value}
              onChange={(event) =>
                updateValue(Number(event.target.value))
              }
              aria-label={selectedConfig.label}
              className="w-full accent-amber-100"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fineTune(-1)}
                disabled={value <= selectedConfig.min}
                aria-label={`Decrease ${selectedConfig.label}`}
                className="min-h-11 rounded-xl border border-amber-100/30 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"
              >
                − Fine Tune
              </button>

              <button
                type="button"
                onClick={() => fineTune(1)}
                disabled={value >= selectedConfig.max}
                aria-label={`Increase ${selectedConfig.label}`}
                className="min-h-11 rounded-xl border border-amber-100/30 bg-white/5 px-3 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40"
              >
                + Fine Tune
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white"
            >
              <span>Advanced Adjustments</span>
              <span>{showAdvanced ? "−" : "+"}</span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
                {METRICS.slice(4).map(metricButton)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={resetLayer}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Reset Layer
          </button>
        </div>
      )}
    </section>
  );
}
