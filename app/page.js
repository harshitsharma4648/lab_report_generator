"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import TemplateEditor from "../components/TemplateEditor";

const DEFAULT_SETTINGS = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

export default function Home() {
  const [reportFile, setReportFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);

  const [templateName, setTemplateName] =
    useState("My Laboratory Template");

  const [xPosition, setXPosition] =
    useState(DEFAULT_SETTINGS.x);

  const [yPosition, setYPosition] =
    useState(DEFAULT_SETTINGS.y);

  const [reportWidth, setReportWidth] =
    useState(DEFAULT_SETTINGS.width);

  const [reportHeight, setReportHeight] =
    useState(DEFAULT_SETTINGS.height);

  const [savedTemplates, setSavedTemplates] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [downloadUrl, setDownloadUrl] =
    useState(null);

  const [message, setMessage] =
    useState("");

  /*
   * Load saved templates
   */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "medicalLabTemplates"
        );

      if (saved) {
        setSavedTemplates(
          JSON.parse(saved)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  /*
   * Upload report
   */

  function handleReport(event) {
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
   * Upload template
   */

  function handleTemplate(event) {
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

    setTemplateFile(file);
    setDownloadUrl(null);
    setMessage("");
  }

  /*
   * Save template settings
   */

  function saveTemplate() {
    if (!templateFile) {
      setMessage(
        "Please upload a template first."
      );
      return;
    }

    if (!templateName.trim()) {
      setMessage(
        "Please enter a template name."
      );
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName.trim(),

      x: xPosition,
      y: yPosition,

      width: reportWidth,
      height: reportHeight,

      /*
       * The PDF itself is not stored
       * in localStorage.
       *
       * We will improve template storage
       * in the next stage.
       */
    };

    const updated = [
      ...savedTemplates.filter(
        (item) =>
          item.name !==
          newTemplate.name
      ),
      newTemplate,
    ];

    setSavedTemplates(updated);

    localStorage.setItem(
      "medicalLabTemplates",
      JSON.stringify(updated)
    );

    setMessage(
      "Template settings saved successfully."
    );
  }

  /*
   * Load template settings
   */

  function loadTemplate(template) {
    setTemplateName(
      template.name
    );

    setXPosition(template.x);
    setYPosition(template.y);

    setReportWidth(
      template.width
    );

    setReportHeight(
      template.height
    );

    setMessage(
      "Template settings loaded."
    );
  }

  /*
   * Delete template
   */

  function deleteTemplate(id) {
    const updated =
      savedTemplates.filter(
        (item) =>
          item.id !== id
      );

    setSavedTemplates(updated);

    localStorage.setItem(
      "medicalLabTemplates",
      JSON.stringify(updated)
    );

    setMessage(
      "Template deleted."
    );
  }

  /*
   * Generate PDF
   */

  async function generateReport() {
    if (!reportFile) {
      setMessage(
        "Please upload the main laboratory report."
      );
      return;
    }

    if (!templateFile) {
      setMessage(
        "Please upload the laboratory template."
      );
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
        await PDFDocument.load(
          reportBytes
        );

      const templatePDF =
        await PDFDocument.load(
          templateBytes
        );

      const finalPDF =
        await PDFDocument.create();

      const reportPageCount =
        reportPDF.getPageCount();

      const templatePageCount =
        templatePDF.getPageCount();

      for (
        let i = 0;
        i < reportPageCount;
        i++
      ) {
        const reportPage =
          reportPDF.getPage(i);

        const templatePage =
          templatePDF.getPage(
            Math.min(
              i,
              templatePageCount - 1
            )
          );

        const templateWidth =
          templatePage.getWidth();

        const templateHeight =
          templatePage.getHeight();

        const originalWidth =
          reportPage.getWidth();

        const originalHeight =
          reportPage.getHeight();

        const page =
          finalPDF.addPage([
            templateWidth,
            templateHeight,
          ]);

        /*
         * Template background
         */

        const [
          templateEmbedded,
        ] =
          await finalPDF.embedPages([
            templatePage,
          ]);

        page.drawPage(
          templateEmbedded,
          {
            x: 0,
            y: 0,
            width: templateWidth,
            height: templateHeight,
          }
        );

        /*
         * Report size
         */

        let width =
          reportWidth > 0
            ? reportWidth
            : originalWidth;

        let height =
          reportHeight > 0
            ? reportHeight
            : originalHeight;

        /*
         * Keep original ratio
         * when only width is provided.
         */

        if (
          reportWidth > 0 &&
          reportHeight === 0
        ) {
          height =
            originalHeight *
            (width /
              originalWidth);
        }

        /*
         * Keep original ratio
         * when only height is provided.
         */

        if (
          reportHeight > 0 &&
          reportWidth === 0
        ) {
          width =
            originalWidth *
            (height /
              originalHeight);
        }

        /*
         * Report
         */

        const [
          reportEmbedded,
        ] =
          await finalPDF.embedPages([
            reportPage,
          ]);

        page.drawPage(
          reportEmbedded,
          {
            x: xPosition,
            y: yPosition,
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
        "Final laboratory report generated successfully."
      );

    } catch (error) {
      console.error(error);

      setMessage(
        "PDF generation failed: " +
        (error?.message ||
          "Unknown error")
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
          Generate professional reports
          using your laboratory template.
        </p>

      </header>


      <section className="card">


        {/* STEP 1 */}

        <div className="upload-section">

          <h2>
            1. Main Laboratory Report
          </h2>

          <p>
            Upload the report received
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
              onChange={
                handleReport
              }
            />

          </label>

        </div>


        {/* STEP 2 */}

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
              onChange={
                handleTemplate
              }
            />

          </label>

        </div>

        {/* VISUAL EDITOR */}

<div className="settings">

  <h2>
    3. Visual Template Editor
  </h2>

  <p>
    Drag the report area to move it.
    Drag the blue circle to resize it.
  </p>

  <TemplateEditor
    x={xPosition}
    y={yPosition}
    width={
      reportWidth > 0
        ? reportWidth
        : 400
    }
    height={
      reportHeight > 0
        ? reportHeight
        : 550
    }
    onChange={(values) => {
      setXPosition(values.x);
      setYPosition(values.y);
      setReportWidth(values.width);
      setReportHeight(values.height);
    }}
  />

</div>
 
        {/* STEP 3 */}

        <div className="settings">

          <h2>
            3. Template Settings
          </h2>

          <p>
            Configure where the main
            laboratory report should appear.
          </p>


          <label className="template-name">

            Template Name

            <input
              type="text"
              value={templateName}
              onChange={(e) =>
                setTemplateName(
                  e.target.value
                )
              }
            />

          </label>


          <div className="settings-grid">

            <label>
              X Position

              <input
                type="number"
                value={xPosition}
                onChange={(e) =>
                  setXPosition(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>


            <label>
              Y Position

              <input
                type="number"
                value={yPosition}
                onChange={(e) =>
                  setYPosition(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>


            <label>
              Report Width

              <input
                type="number"
                value={reportWidth}
                placeholder="Original"
                onChange={(e) =>
                  setReportWidth(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>


            <label>
              Report Height

              <input
                type="number"
                value={reportHeight}
                placeholder="Original"
                onChange={(e) =>
                  setReportHeight(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </label>

          </div>


          <button
            className="secondary-button"
            onClick={saveTemplate}
          >
            💾 Save Template Settings
          </button>

        </div>


        {/* SAVED TEMPLATES */}

        {savedTemplates.length > 0 && (

          <div className="saved-templates">

            <h2>
              Saved Templates
            </h2>

            {savedTemplates.map(
              (template) => (

                <div
                  key={template.id}
                  className="saved-template"
                >

                  <div>

                    <strong>
                      {template.name}
                    </strong>

                    <small>
                      X: {template.x}
                      {" | "}
                      Y: {template.y}
                      {" | "}
                      W: {template.width}
                      {" | "}
                      H: {template.height}
                    </small>

                  </div>


                  <div className="template-actions">

                    <button
                      onClick={() =>
                        loadTemplate(
                          template
                        )
                      }
                    >
                      Load
                    </button>

                    <button
                      onClick={() =>
                        deleteTemplate(
                          template.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}


        {/* GENERATE */}

        <button
          className="generate-button"
          onClick={
            generateReport
          }
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

        🔒 Your PDF is processed directly
        in your browser.

        <br />

        No database • No backend • No server upload

      </footer>

    </main>
  );
      }
