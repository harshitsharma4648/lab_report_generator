"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

const TEMPLATE_WIDTH = 600;
const TEMPLATE_HEIGHT = 848;

export default function Home() {
  const [reportFile, setReportFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [reportPosition, setReportPosition] = useState({
    x: 50,
    y: 170,
    width: 500,
    height: 600,
  });

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const dragStart = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

  /*
   * ==========================================
   * CREATE PDF PREVIEW
   * ==========================================
   */

  useEffect(() => {
    if (!reportFile) {
      setPreviewUrl(null);
      return;
    }

    let objectUrl = null;

    async function createPreview() {
      try {
        setMessage("Loading report preview...");

        const pdfjs =
          await import("pdfjs-dist");

        const pdfjsLib =
          pdfjs;

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer =
          await reportFile.arrayBuffer();

        const pdf =
          await pdfjsLib.getDocument({
            data: arrayBuffer,
          }).promise;

        /*
         * Show first page in editor.
         */

        const page =
          await pdf.getPage(1);

        const originalViewport =
          page.getViewport({
            scale: 1,
          });

        const desiredWidth = 1000;

        const scale =
          desiredWidth /
          originalViewport.width;

        const viewport =
          page.getViewport({
            scale,
          });

        const canvas =
          document.createElement("canvas");

        const context =
          canvas.getContext("2d");

        canvas.width =
          viewport.width;

        canvas.height =
          viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setMessage(
                "Unable to create PDF preview."
              );
              return;
            }

            objectUrl =
              URL.createObjectURL(blob);

            setPreviewUrl(objectUrl);

            setMessage("");
          },
          "image/png"
        );
      } catch (error) {
        console.error(
          "PDF PREVIEW ERROR:",
          error
        );

        setPreviewUrl(null);

        setMessage(
          "Unable to display PDF preview."
        );
      }
    }

    createPreview();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [reportFile]);

  /*
   * ==========================================
   * FILE SELECTION
   * ==========================================
   */

  function selectReport(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      file.type !==
      "application/pdf"
    ) {
      setMessage(
        "Please select a PDF file."
      );
      return;
    }

    setReportFile(file);
    setDownloadUrl(null);
    setMessage("");
  }

  /*
   * ==========================================
   * DRAG & DROP
   * ==========================================
   */

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const file =
      event.dataTransfer.files?.[0];

    if (!file) return;

    if (
      file.type !==
      "application/pdf"
    ) {
      setMessage(
        "Please drop a PDF file."
      );
      return;
    }

    setReportFile(file);
    setDownloadUrl(null);
    setMessage("");
  }

  /*
   * ==========================================
   * GET POINTER POSITION
   * ==========================================
   */

  function getPoint(event) {
    const editor =
      document.getElementById(
        "template-editor"
      );

    if (!editor) return null;

    const rect =
      editor.getBoundingClientRect();

    const scaleX =
      TEMPLATE_WIDTH /
      rect.width;

    const scaleY =
      TEMPLATE_HEIGHT /
      rect.height;

    return {
      x:
        (event.clientX -
          rect.left) *
        scaleX,

      y:
        (event.clientY -
          rect.top) *
        scaleY,
    };
  }

  /*
   * ==========================================
   * START DRAGGING
   * ==========================================
   */

  function startDragging(event) {
    if (!reportFile) return;

    event.preventDefault();
    event.stopPropagation();

    const point =
      getPoint(event);

    if (!point) return;

    setDragging(true);

    dragStart.current = {
      mouseX: point.x,
      mouseY: point.y,
      originalX:
        reportPosition.x,
      originalY:
        reportPosition.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  /*
   * ==========================================
   * MOVE REPORT
   * ==========================================
   */

  function moveDragging(event) {
    if (!dragging) return;

    const point =
      getPoint(event);

    if (!point) return;

    const start =
      dragStart.current;

    const newX =
      start.originalX +
      point.x -
      start.mouseX;

    const newY =
      start.originalY +
      point.y -
      start.mouseY;

    setReportPosition(
      (previous) => ({
        ...previous,

        x: Math.max(
          0,
          Math.min(
            TEMPLATE_WIDTH -
              previous.width,
            newX
          )
        ),

        y: Math.max(
          0,
          Math.min(
            TEMPLATE_HEIGHT -
              previous.height,
            newY
          )
        ),
      })
    );
  }

  function stopDragging() {
    setDragging(false);
  }

  /*
   * ==========================================
   * START RESIZE
   * ==========================================
   */

  function startResizing(event) {
    event.preventDefault();
    event.stopPropagation();

    const point =
      getPoint(event);

    if (!point) return;

    setResizing(true);

    dragStart.current = {
      mouseX: point.x,
      mouseY: point.y,

      originalWidth:
        reportPosition.width,

      originalHeight:
        reportPosition.height,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  /*
   * ==========================================
   * RESIZE REPORT
   * ==========================================
   */

  function moveResizing(event) {
    if (!resizing) return;

    const point =
      getPoint(event);

    if (!point) return;

    const start =
      dragStart.current;

    const newWidth =
      Math.max(
        150,
        start.originalWidth +
          point.x -
          start.mouseX
      );

    const newHeight =
      Math.max(
        150,
        start.originalHeight +
          point.y -
          start.mouseY
      );

    setReportPosition(
      (previous) => ({
        ...previous,

        width: Math.min(
          newWidth,
          TEMPLATE_WIDTH -
            previous.x
        ),

        height: Math.min(
          newHeight,
          TEMPLATE_HEIGHT -
            previous.y
        ),
      })
    );
  }

  function stopResizing() {
    setResizing(false);
  }

  /*
 * ==========================================
 * FIT REPORT
 * ==========================================
 */

function fitReport() {
  setReportPosition({
    x: 50,
    y: 170,
    width: 500,
    height: 600,
  });
}


/*
 * ==========================================
 * RESET REPORT POSITION
 * ==========================================
 */

function resetReportPosition() {
  setReportPosition({
    x: 50,
    y: 170,
    width: 500,
    height: 600,
  });
}

  /*
   * ==========================================
   * GENERATE FINAL PDF
   * ==========================================
   */

  async function generateReport() {
    if (!reportFile) {
      setMessage(
        "Please select or drop the main laboratory PDF first."
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setDownloadUrl(null);

      const reportBytes =
        await reportFile.arrayBuffer();

      const reportPDF =
        await PDFDocument.load(
          reportBytes
        );

      const templateResponse =
        await fetch(
          "/sample-template.pdf"
        );

      if (!templateResponse.ok) {
        throw new Error(
          "Sample template PDF could not be loaded."
        );
      }

      const templateBytes =
        await templateResponse.arrayBuffer();

      const templatePDF =
        await PDFDocument.load(
          templateBytes
        );

      const finalPDF =
        await PDFDocument.create();

      for (
        let i = 0;
        i < reportPDF.getPageCount();
        i++
      ) {
        const reportPage =
          reportPDF.getPage(i);

        const templatePage =
          templatePDF.getPage(0);

        const templateWidth =
          templatePage.getWidth();

        const templateHeight =
          templatePage.getHeight();

        const finalPage =
          finalPDF.addPage([
            templateWidth,
            templateHeight,
          ]);

        const [
          templateEmbedded,
        ] =
          await finalPDF.embedPages([
            templatePage,
          ]);

        finalPage.drawPage(
          templateEmbedded,
          {
            x: 0,
            y: 0,
            width: templateWidth,
            height: templateHeight,
          }
        );

        const [
          reportEmbedded,
        ] =
          await finalPDF.embedPages([
            reportPage,
          ]);

        const scaleX =
          templateWidth /
          TEMPLATE_WIDTH;

        const scaleY =
          templateHeight /
          TEMPLATE_HEIGHT;

        const x =
          reportPosition.x *
          scaleX;

        const width =
          reportPosition.width *
          scaleX;

        const height =
          reportPosition.height *
          scaleY;

        const y =
          templateHeight -
          (
            reportPosition.y +
            reportPosition.height
          ) *
            scaleY;

        finalPage.drawPage(
          reportEmbedded,
          {
            x,
            y,
            width,
            height,
          }
        );
      }

      const finalBytes =
        await finalPDF.save();

      const blob =
        new Blob(
          [finalBytes],
          {
            type: "application/pdf",
          }
        );

      const url =
        URL.createObjectURL(blob);

      setDownloadUrl(url);

      setMessage(
        "Final report generated successfully."
      );
    } catch (error) {
      console.error(
        "PDF GENERATION ERROR:",
        error
      );

      setMessage(
        "PDF generation failed: " +
          (
            error?.message ||
            "Unknown error"
          )
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <main className="container">

      <header>
        <div className="logo">
          🧪
        </div>

        <h1>
          Medical Lab Report Generator
        </h1>

        <p>
          Place your main laboratory report
          on your laboratory template.
        </p>
      </header>


      <section className="card">

        <h2>
          Laboratory Template
        </h2>

        <p className="editor-help">
          {reportFile
            ? "Drag the report to move it. Drag the blue corner to resize it."
            : "Drop your main laboratory PDF here or select it from your device."}
        </p>


        {/* TEMPLATE EDITOR */}

        <div
          id="template-editor"
          className="template-editor-main"

          onDragOver={
            handleDragOver
          }

          onDrop={
            handleDrop
          }
        >

          {/* TEMPLATE */}

          <img
            src="/sample-template.png"
            alt="Laboratory Template"
            className="template-image"
          />


          {/* DROP AREA */}

          {!reportFile && (

            <div className="drop-area">

              <div className="drop-icon">
                📄
              </div>

              <strong>
                Drop Main Lab PDF Here
              </strong>

              <span>
                or
              </span>

              <label className="select-pdf-button">

                Select PDF

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={
                    selectReport
                  }
                />

              </label>

            </div>

          )}


          {/* ACTUAL REPORT PREVIEW */}

          {reportFile && (

            <div
              className="report-overlay"

              style={{
                left:
                  `${(
                    reportPosition.x /
                    TEMPLATE_WIDTH
                  ) * 100}%`,

                top:
                  `${(
                    reportPosition.y /
                    TEMPLATE_HEIGHT
                  ) * 100}%`,

                width:
                  `${(
                    reportPosition.width /
                    TEMPLATE_WIDTH
                  ) * 100}%`,

                height:
                  `${(
                    reportPosition.height /
                    TEMPLATE_HEIGHT
                  ) * 100}%`,
              }}

              onPointerDown={
                startDragging
              }

              onPointerMove={
                moveDragging
              }

              onPointerUp={
                stopDragging
              }

              onPointerCancel={
                stopDragging
              }
            >

              {previewUrl ? (

                <img
                  src={previewUrl}
                  alt="Main laboratory report preview"
                  className="report-preview-image"
                  draggable="false"
                />

              ) : (

                <div className="preview-loading">
                  Loading PDF...
                </div>

              )}


              {/* RESIZE HANDLE */}

              <div
                className="resize-handle-main"

                onPointerDown={
                  startResizing
                }

                onPointerMove={
                  moveResizing
                }

                onPointerUp={
                  stopResizing
                }

                onPointerCancel={
                  stopResizing
                }
              />

            </div>

          )}

        </div>


        {/* FILE INFORMATION */}

        {reportFile && (

          <div className="file-information">

            <div>
              <strong>
                Main Lab Report
              </strong>

              <span>
                {reportFile.name}
              </span>
            </div>

            <label className="change-file-button">

              Change PDF

              <input
                type="file"
                accept="application/pdf"
                onChange={
                  selectReport
                }
              />

            </label>

          </div>

        )}


        {/* POSITION */}

        {reportFile && (

          <div className="position-information">

            <span>
              X:{" "}
              {Math.round(
                reportPosition.x
              )}
            </span>

            <span>
              Y:{" "}
              {Math.round(
                reportPosition.y
              )}
            </span>

            <span>
              W:{" "}
              {Math.round(
                reportPosition.width
              )}
            </span>

            <span>
              H:{" "}
              {Math.round(
                reportPosition.height
              )}
            </span>

          </div>

        )}

{/* REPORT CONTROLS */}

{reportFile && (

  <div className="report-controls">

    <button
      type="button"
      onClick={fitReport}
      className="control-button"
    >
      Fit Report
    </button>

    <button
      type="button"
      onClick={resetReportPosition}
      className="control-button"
    >
      Reset Position
    </button>

  </div>

)}

        {/* GENERATE */}

        <button
          className="generate-button-main"
          onClick={
            generateReport
          }
          disabled={loading}
        >
          {loading
            ? "Generating Final PDF..."
            : "Generate Final Report"}
        </button>


        {/* MESSAGE */}

        {message && (

          <div className="message">
            {message}
          </div>

        )}


        {/* DOWNLOAD */}

        {downloadUrl && (

          <a
            href={downloadUrl}
            download="medical-lab-report.pdf"
            className="download-button-main"
          >
            ⬇️ Download Final Report
          </a>

        )}

      </section>


      <footer>
        🔒 Your PDF is processed directly
        in your browser.
        <br />
        No database • No backend • No server upload
      </footer>

    </main>
  );
              }
