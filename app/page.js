"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

const TEMPLATE_WIDTH = 600;
const TEMPLATE_HEIGHT = 848;

export default function Home() {
  const [reportFile, setReportFile] = useState(null);

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
   * --------------------------------------------------
   * FILE SELECTION
   * --------------------------------------------------
   */

  function selectReport(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please select a PDF file.");
      return;
    }

    setReportFile(file);
    setMessage("");
    setDownloadUrl(null);
  }

  /*
   * --------------------------------------------------
   * DRAG & DROP
   * --------------------------------------------------
   */

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please drop a PDF file.");
      return;
    }

    setReportFile(file);
    setMessage("");
    setDownloadUrl(null);
  }

  /*
   * --------------------------------------------------
   * REPORT DRAGGING
   * --------------------------------------------------
   */

  function startDragging(event) {
    if (!reportFile) return;

    event.preventDefault();
    event.stopPropagation();

    const point = getPoint(event);

    if (!point) return;

    setDragging(true);

    dragStart.current = {
      mouseX: point.x,
      mouseY: point.y,
      originalX: reportPosition.x,
      originalY: reportPosition.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  function moveDragging(event) {
    if (!dragging) return;

    const point = getPoint(event);

    if (!point) return;

    const start = dragStart.current;

    const newX =
      start.originalX +
      point.x -
      start.mouseX;

    const newY =
      start.originalY +
      point.y -
      start.mouseY;

    setReportPosition((previous) => ({
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
    }));
  }

  function stopDragging() {
    setDragging(false);
  }

  /*
   * --------------------------------------------------
   * RESIZING
   * --------------------------------------------------
   */

  function startResizing(event) {
    event.preventDefault();
    event.stopPropagation();

    const point = getPoint(event);

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

  function moveResizing(event) {
    if (!resizing) return;

    const point = getPoint(event);

    if (!point) return;

    const start = dragStart.current;

    const newWidth = Math.max(
      150,
      start.originalWidth +
        point.x -
        start.mouseX
    );

    const newHeight = Math.max(
      150,
      start.originalHeight +
        point.y -
        start.mouseY
    );

    setReportPosition((previous) => ({
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
    }));
  }

  function stopResizing() {
    setResizing(false);
  }

  /*
   * --------------------------------------------------
   * POINTER POSITION
   * --------------------------------------------------
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
   * --------------------------------------------------
   * GENERATE FINAL PDF
   * --------------------------------------------------
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

      /*
       * Load report
       */

      const reportBytes =
        await reportFile.arrayBuffer();

      const reportPDF =
        await PDFDocument.load(
          reportBytes
        );

      /*
       * Load template
       */

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

      /*
       * Final PDF
       */

      const finalPDF =
        await PDFDocument.create();

      /*
       * Process every report page
       */

      for (
        let i = 0;
        i < reportPDF.getPageCount();
        i++
      ) {
        const reportPage =
          reportPDF.getPage(i);

        /*
         * Use the first template page.
         */

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

        /*
         * Draw template
         */

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

        /*
         * Draw report
         */

        const [
          reportEmbedded,
        ] =
          await finalPDF.embedPages([
            reportPage,
          ]);

        /*
         * Convert editor coordinates
         * to actual PDF coordinates.
         */

        const scaleX =
          templateWidth /
          TEMPLATE_WIDTH;

        const scaleY =
          templateHeight /
          TEMPLATE_HEIGHT;

        const x =
          reportPosition.x *
          scaleX;

        /*
         * Editor Y starts at TOP.
         * PDF Y starts at BOTTOM.
         */

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

        const width =
          reportPosition.width *
          scaleX;

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

      /*
       * Save
       */

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
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
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

          {/* TEMPLATE IMAGE */}

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


          {/* REPORT BOX */}

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

              <div className="report-overlay-content">

                <span>
                  📄
                </span>

                <strong>
                  {reportFile.name}
                </strong>

                <small>
                  Drag to move
                </small>

              </div>


              {/* RESIZE */}

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
