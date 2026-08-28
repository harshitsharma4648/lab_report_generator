"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function Home() {
  const [reportFile, setReportFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);

  const [reportPreview, setReportPreview] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);

  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Report PDF
  function handleReportUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setReportFile(file);

    const url = URL.createObjectURL(file);
    setReportPreview(url);

    setDownloadUrl(null);
    setMessage("");
  }

  // Template PDF
  function handleTemplateUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setTemplateFile(file);

    const url = URL.createObjectURL(file);
    setTemplatePreview(url);

    setDownloadUrl(null);
    setMessage("");
  }

  // Generate final PDF
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

      const reportPages = await finalPDF.copyPages(
        reportPDF,
        reportPDF.getPageIndices()
      );

      const templatePages = await finalPDF.copyPages(
        templatePDF,
        templatePDF.getPageIndices()
      );

      for (let i = 0; i < reportPages.length; i++) {
        const reportPage = reportPages[i];

        const width = reportPage.getWidth();
        const height = reportPage.getHeight();

        const page = finalPDF.addPage([width, height]);

        // Template
        const templatePage =
          templatePages[Math.min(i, templatePages.length - 1)];

        page.drawPage(templatePage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });

        // Report
        page.drawPage(reportPage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const finalBytes = await finalPDF.save();

      const blob = new Blob([finalBytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setMessage("Report generated successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Unable to generate the report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">

      {/* Header */}

      <header>
        <div className="logo">🧪</div>

        <h1>
          Medical Lab Report Generator
        </h1>

        <p>
          Generate a professional laboratory report
          using your own laboratory template.
        </p>
      </header>


      {/* Main Card */}

      <section className="card">

        {/* Report */}

        <div className="upload-section">

          <h2>
            1. Main Laboratory Report
          </h2>

          <p>
            Upload the PDF received from the main laboratory.
          </p>

          <label className="upload-box">

            <span className="upload-icon">
              📄
            </span>

            <strong>
              {reportFile
                ? reportFile.name
                : "Choose Report PDF"}
            </strong>

            <small>
              PDF files only
            </small>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleReportUpload}
            />

          </label>

        </div>


        {/* Report Preview */}

        {reportPreview && (
          <div className="preview-section">

            <h3>
              Report Preview
            </h3>

            <iframe
              src={reportPreview}
              className="pdf-preview"
              title="Main laboratory report"
            />

          </div>
        )}


        {/* Template */}

        <div className="upload-section">

          <h2>
            2. Laboratory Template
          </h2>

          <p>
            Upload your laboratory header and footer
            template.
          </p>

          <label className="upload-box">

            <span className="upload-icon">
              📋
            </span>

            <strong>
              {templateFile
                ? templateFile.name
                : "Choose Template PDF"}
            </strong>

            <small>
              PDF files only
            </small>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleTemplateUpload}
            />

          </label>

        </div>


        {/* Template Preview */}

        {templatePreview && (
          <div className="preview-section">

            <h3>
              Template Preview
            </h3>

            <iframe
              src={templatePreview}
              className="pdf-preview"
              title="Laboratory template"
            />

          </div>
        )}


        {/* Generate */}

        <button
          className="generate-button"
          onClick={generateReport}
          disabled={loading}
        >
          {loading
            ? "Generating Report..."
            : "Generate Final Report"}
        </button>


        {/* Message */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}


        {/* Download */}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download="medical-lab-report.pdf"
            className="download-button"
          >
            ⬇️ Download Final PDF
          </a>
        )}

      </section>


      {/* Privacy */}

      <footer>
        🔒 Your PDF is processed directly in your browser.
        <br />
        No database or backend is required.
      </footer>

    </main>
  );
      }
