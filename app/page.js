"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

export default function Home() {
  const [reportFile, setReportFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  async function generateReport() {
    if (!reportFile || !templateFile) {
      setMessage("Please upload both PDF files.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setDownloadUrl(null);

      const reportData = await reportFile.arrayBuffer();
      const templateData = await templateFile.arrayBuffer();

      const reportPDF = await PDFDocument.load(reportData);
      const templatePDF = await PDFDocument.load(templateData);

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

        const templatePage =
          templatePages[Math.min(i, templatePages.length - 1)];

        page.drawPage(templatePage, {
          x: 0,
          y: 0,
          width,
          height
        });

        page.drawPage(reportPage, {
          x: 0,
          y: 0,
          width,
          height
        });
      }

      const pdfBytes = await finalPDF.save();

      const blob = new Blob([pdfBytes], {
        type: "application/pdf"
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

      <header>
        <div className="logo">🧪</div>

        <h1>Medical Lab Report Generator</h1>

        <p>
          Add your laboratory template to the report received
          from the main laboratory.
        </p>
      </header>

      <section className="card">

        <div className="upload-section">

          <h2>1. Main Laboratory Report</h2>

          <p>
            Upload the PDF received from the main laboratory.
          </p>

          <label className="upload-box">

            <span className="upload-icon">📄</span>

            <strong>
              {reportFile
                ? reportFile.name
                : "Choose Report PDF"}
            </strong>

            <small>PDF files only</small>

            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                setReportFile(event.target.files[0]);
                setMessage("");
                setDownloadUrl(null);
              }}
            />

          </label>

        </div>

        <div className="upload-section">

          <h2>2. Laboratory Template</h2>

          <p>
            Upload your laboratory header and footer template.
          </p>

          <label className="upload-box">

            <span className="upload-icon">📋</span>

            <strong>
              {templateFile
                ? templateFile.name
                : "Choose Template PDF"}
            </strong>

            <small>PDF files only</small>

            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                setTemplateFile(event.target.files[0]);
                setMessage("");
                setDownloadUrl(null);
              }}
            />

          </label>

        </div>

        <button
          className="generate-button"
          onClick={generateReport}
          disabled={loading}
        >
          {loading
            ? "Generating..."
            : "Generate Final Report"}
        </button>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {downloadUrl && (
          <a
            className="download-button"
            href={downloadUrl}
            download="medical-lab-report.pdf"
          >
            ⬇️ Download Final PDF
          </a>
        )}

      </section>

      <footer>
        🔒 PDF processing happens directly in your browser.
        <br />
        No database or backend is required.
      </footer>

    </main>
  );
}
