"use client";

import { useEffect, useRef, useState } from "react";

export default function PDFPreview({ file }) {
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    async function renderPDF() {
      try {
        setLoading(true);
        setError("");

        const pdfjsLib = await import("pdfjs-dist");

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
        }).promise;

        if (cancelled) return;

        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        const containerWidth =
          canvas.parentElement.clientWidth;

        const originalViewport =
          page.getViewport({ scale: 1 });

        const scale =
          containerWidth / originalViewport.width;

        const viewport =
          page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

      } catch (err) {
        console.error(err);

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

  if (!file) {
    return null;
  }

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
