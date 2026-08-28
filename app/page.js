"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function Home() {
  const [reportFile, setReportFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);

  const [topMargin, setTopMargin] = useState(70);
  const [bottomMargin, setBottomMargin] = useState(70);
  const [leftMargin, setLeftMargin] = useState(0);
  const [rightMargin, setRightMargin] = useState(0);

  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [message, setMessage] = useState("");

  function handleReport(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setReportFile(file);
    setDownloadUrl(null);
    setMessage("");
  }

  function handleTemplate(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setTemplateFile(file);
    setDownloadUrl(null);
    setMessage("");
  }

  async function generateReport() {
    if (!reportFile) {
      setMessage("Please upload the main laboratory report.");
      return;
    }

    if (!templateFile) {
      setMessage("Please upload the laboratory template.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setDownloadUrl(null);

      const reportBytes = await reportFile.arrayBuffer();
      const templateBytes = await templateFile.arrayBuffer();

      const reportPDF = await PDFDocument.load(reportBytes);
      const templatePDF = await PDFDocument.load(templateBytes);

      const finalPDF = await PDFDocument.create();

      const reportPageCount = reportPDF.getPageCount();
      const templatePageCount = templatePDF.getPageCount();

      for (let i = 0; i < reportPageCount; i++) {
        const reportPage = reportPDF.getPage(i);

        const templatePage =
          templatePDF.getPage(
            Math.min(i, templatePageCount - 1)
          );

        const templateWidth = templatePage.getWidth();
        const templateHeight = templatePage.getHeight();

        const reportWidth = reportPage.getWidth();
        const reportHeight = reportPage.getHeight();

        const page = finalPDF.addPage([
          templateWidth,
          templateHeight,
        ]);

        // Copy template page into final PDF
        const [templateEmbedded] =
          await finalPDF.embedPages([templatePage]);

        page.drawPage(templateEmbedded, {
          x: 0,
          y: 0,
          width: templateWidth,
          height: templateHeight,
        });

        // Available report area
        const availableWidth =
          templateWidth -
          leftMargin -
          rightMargin;

        const availableHeight =
          templateHeight -
          topMargin -
          bottomMargin;

        // Calculate scale
        const scale = Math.min(
          availableWidth / reportWidth,
          availableHeight / reportHeight
        );

        const finalWidth =
          reportWidth * scale;

        const finalHeight =
          reportHeight * scale;

        // Center horizontally
        const x =
          leftMargin +
          (availableWidth - finalWidth) / 2;

        const y = bottomMargin;

        // Copy report page
        const [reportEmbedded] =
          await finalPDF.embedPages([reportPage]);

        page.drawPage(reportEmbedded, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
        });
      }

      const pdfBytes = await finalPDF.save();

      const blob = new Blob(
        [pdfBytes],
        {
          type: "application/pdf",
        }
      );

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);

      setMessage(
        "Final laboratory report generated successfully."
      );
    } catch (error) {
      console.error("PDF GENERATION ERROR:", error);

      setMessage(
        "PDF generation failed: " +
        (error?.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">

      <header>
        <div className="logo">🧪</div>

        <h1>
          Medical Lab Report Generator
        </h1>

        <p>
          Add your laboratory template to the
          main laboratory report.
        </p>
      </header>

      <section className="card">

        {/* REPORT */}

        <div className="upload-section">

          <h2>
            1. Main Laboratory Report
          </h2>

          <p>
            Upload the PDF received from the
            main laboratory.
          </p>

          <label className="upload-box">

            <span className="upload-icon">
              📄
            </span>

            <strong>
              {reportFile
                ? reportFile.name
                : "Choose Main Lab PDF"}
            </strong>

            <small>
              PDF files only
            </small>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleReport}
            />

          </label>

        </div>


        {/* TEMPLATE */}

        <div className="upload-section">

          <h2>
            2. Laboratory Template
          </h2>

          <p>
            Upload your laboratory header and
            footer template.
          </p>

          <label className="upload-box">

            <span className="upload-icon">
              📋
            </span>

            <strong>
              {templateFile
                ? templateFile.name
                : "Choose Lab Template"}
            </strong>

            <small>
              PDF files only
            </small>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleTemplate}
            />

          </label>

        </div>


        {/* SETTINGS */}

        <div className="settings">

          <h2>
            3. Report Position
          </h2>

          <p>
            These values control the report
            area on your template.
          </p>

          <div className="settings-grid">

            <label>
              Top Margin

              <input
                type="number"
                value={topMargin}
                onChange={(e) =>
                  setTopMargin(
                    Number(e.target.value)
                  )
                }
              />

            </label>

            <label>
              Bottom Margin

              <input
                type="number"
                value={bottomMargin}
                onChange={(e) =>
                  setBottomMargin(
                    Number(e.target.value)
                  )
                }
              />

            </label>

            <label>
              Left Margin

              <input
                type="number"
                value={leftMargin}
                onChange={(e) =>
                  setLeftMargin(
                    Number(e.target.value)
                  )
                }
              />

            </label>

            <label>
              Right Margin

              <input
                type="number"
                value={rightMargin}
                onChange={(e) =>
                  setRightMargin(
                    Number(e.target.value)
                  )
                }
              />

            </label>

          </div>

        </div>


        {/* GENERATE */}

        <button
          className="generate-button"
          onClick={generateReport}
          disabled={loading}
        >
          {loading
            ? "Generating..."
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
            className="download-button"
          >
            ⬇️ Download Final Report
          </a>
        )}

      </section>

      <footer>
        🔒 All PDF processing happens directly
        in your browser.
        <br />
        No database • No backend • No server upload
      </footer>

    </main>
  );
                     }
