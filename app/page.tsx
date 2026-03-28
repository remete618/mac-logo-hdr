"use client";

import { useState, useRef, useCallback } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upscale, setUpscale] = useState(true);
  const [targetSize, setTargetSize] = useState(800);
  const [threshold, setThreshold] = useState(240);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f?.type.startsWith("image/")) handleFile(f);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    setResultBlob(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("upscale", String(upscale));
      formData.append("targetSize", String(targetSize));
      formData.append("threshold", String(threshold));

      const res = await fetch("/api/process", { method: "POST", body: formData });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Processing failed");
      }

      const blob = await res.blob();
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !resultBlob) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    const name = file?.name?.replace(/\.[^.]+$/, "") || "output";
    a.download = `${name}_hdr.jpg`;
    a.click();
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          HDR Logo Glow
        </h1>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mb-6 flex h-40 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-400/10"
              : "border-neutral-700 hover:border-neutral-500"
          }`}
        >
          <p className="text-neutral-400">
            {file ? file.name : "Drop an image here or click to browse"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Options */}
        <div className="mb-6 space-y-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={upscale}
              onChange={(e) => setUpscale(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-500"
            />
            <span>Upscale small images</span>
          </label>

          {upscale && (
            <label className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0">Target size</span>
              <input
                type="number"
                value={targetSize}
                onChange={(e) => setTargetSize(Number(e.target.value))}
                min={100}
                max={4000}
                className="w-24 rounded bg-neutral-800 px-2 py-1 text-white"
              />
              <span className="text-neutral-500">px</span>
            </label>
          )}

          <label className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>White threshold</span>
              <span className="font-mono text-neutral-400">{threshold}</span>
            </div>
            <input
              type="range"
              min={200}
              max={254}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="accent-blue-500"
            />
          </label>
        </div>

        {/* Process button */}
        <button
          onClick={process}
          disabled={!file || processing}
          className="mb-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {processing ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            "Process"
          )}
        </button>

        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Preview */}
        {(originalUrl || resultUrl) && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            {originalUrl && (
              <div>
                <p className="mb-2 text-center text-xs text-neutral-500">
                  Original
                </p>
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full rounded-lg border border-neutral-800"
                />
              </div>
            )}
            {resultUrl && (
              <div>
                <p className="mb-2 text-center text-xs text-neutral-500">
                  HDR Result
                </p>
                <img
                  src={resultUrl}
                  alt="Result"
                  className="w-full rounded-lg border border-neutral-800"
                />
              </div>
            )}
          </div>
        )}

        {/* Download */}
        {resultUrl && (
          <button
            onClick={download}
            className="w-full rounded-xl border border-green-600 py-3 font-semibold text-green-400 transition-colors hover:bg-green-600/10"
          >
            Download HDR Image
          </button>
        )}
      </div>
    </main>
  );
}
