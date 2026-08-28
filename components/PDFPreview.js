"use client";

import { useEffect, useRef, useState } from "react";

export default function PDFPreview({ file }) {
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    async function renderPDF() {
      try {
        setLoading(true);
        setError("");

        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        const data = await file.arrayBuffer();

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(data),
        });

        const pdf = await loadingTask.promise;

        if (cancelled) return;

        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        const originalViewport =
          page.getViewport({
            scale: 1,
          });

        const parentWidth =
          canvas.parentElement.clientWidth - 20;

        const scale =
          Math.min(
            parentWidth / originalViewport.width,
            1.5
          );

        const viewport =
          page.getViewport({
            scale,
          });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

      } catch (err) {
        console.error("PDF ERROR:", err);

        if (!cancelled) {
          setError(
            "Unable to display this PDF preview."
          );
        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }
    }

    renderPDF();

    return () => {
      cancelled = true;
    };

  }, [file]);

  return (
    <div className="pdf-preview-container">

      {loading && (
        <div className="pdf-loading">
          Loading PDF...
        </div>
      )}

      {error && (
        <div className="pdf-error">
          {error}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="pdf-canvas"
      />

    </div>
  );
            }
