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

    if (file.type !== "application/pdf") {
      setMessage("Please select a PDF file.");
      return;
    }

    setReportFile(file);
    setDownloadUrl(null);
    setMessage("");
  }

  function handleTemplate(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please select a PDF file.");
      return;
    }

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
      setMessage("Please upload your laboratory template.");
      return;
    }

    try {

      setLoading(true);
      setMessage("");
      setDownloadUrl(null);

      const reportBytes =
        await reportFile.arrayBuffer();

      const templateBytes =
        await templateFile.arrayBuffer();

      const reportPDF =
        await PDFDocument.load(reportBytes);

      const templatePDF =
        await PDFDocument.load(templateBytes);

      const finalPDF =
        await PDFDocument.create();

      const reportPages =
        await reportPDF.getPages();

      const templatePages =
        await templatePDF.getPages();

      for (let i = 0; i < reportPages.length; i++) {

        const reportPage =
          reportPages[i];

        const reportWidth =
          reportPage.getWidth();

        const reportHeight =
          reportPage.getHeight();

        const templatePage =
          templatePages[
            Math.min(
              i,
              templatePages.length - 1
            )
          ];

        const templateWidth =
          templatePage.getWidth();

        const templateHeight =
          templatePage.getHeight();

        const page =
          finalPDF.addPage([
            templateWidth,
            templateHeight
          ]);

        /*
         * Draw the template first.
         * This becomes the background.
         */

        const [templateEmbedded] =
          await finalPDF.embedPages([
            templatePage
          ]);

        page.drawPage(
          templateEmbedded,
          {
            x: 0,
            y: 0,
            width: templateWidth,
            height: templateHeight
          }
        );

        /*
         * Calculate available report area.
         */

        const availableWidth =
          templateWidth -
          leftMargin -
          rightMargin;

        const availableHeight =
          templateHeight -
          topMargin -
          bottomMargin;

        /*
         * Scale the report so it fits
         * inside the selected area.
         */

        const widthScale =
          availableWidth /
          reportWidth;

        const heightScale =
          availableHeight /
          reportHeight;

        const scale =
          Math.min(
            widthScale,
            heightScale
          );

        const finalWidth =
          reportWidth * scale;

        const finalHeight =
          reportHeight * scale;

        /*
         * Center report horizontally
         * inside the available area.
         */

        const x =
          leftMargin +
          (availableWidth - finalWidth) / 2;

        /*
         * PDF coordinates start
         * from the bottom.
         */

        const y =
          bottomMargin;

        /*
         * Embed the report page.
         */

        const [reportEmbedded] =
          await finalPDF.embedPages([
            reportPage
          ]);

        page.drawPage(
          reportEmbedded,
          {
            x: x,
            y: y,
            width: finalWidth,
            height: finalHeight
          }
        );
      }

      const finalBytes =
        await finalPDF.save();

      const blob =
        new Blob(
          [finalBytes],
          {
            type: "application/pdf"
          }
        );

      const url =
        URL.createObjectURL(blob);

      setDownloadUrl(url);

      setMessage(
        "Final laboratory report generated successfully."
      );

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to generate the final PDF."
      );

    } finally {

      setLoading(false);

    }
  }

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
          Add your laboratory template
          to the main laboratory report.
        </p>

      </header>


      <section className="card">


        {/* MAIN REPORT */}

        <div className="upload-section">

          <h2>
            1. Main Laboratory Report
          </h2>

          <p>
            Upload the PDF received
            from the main laboratory.
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
            Upload your laboratory
            header and footer template.
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


        {/* POSITION SETTINGS */}

        <div className="settings">

          <h2>
            3. Report Position
          </h2>

          <p>
            Adjust these values to control
            where the main report appears
            on your laboratory template.
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

        🔒 All PDF processing happens
        directly in your browser.

        <br />

        No database • No backend • No server upload

      </footer>

    </main>
  );
      }
