"use client";

import { useRef, useState } from "react";

export default function TemplateEditor({
  x,
  y,
  width,
  height,
  onChange,
}) {
  const canvasRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const startRef = useRef(null);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 800;

  function getPointerPosition(event) {
    const canvas =
      canvasRef.current;

    if (!canvas) return null;

    const rect =
      canvas.getBoundingClientRect();

    const clientX =
      event.clientX;

    const clientY =
      event.clientY;

    const scaleX =
      CANVAS_WIDTH / rect.width;

    const scaleY =
      CANVAS_HEIGHT / rect.height;

    return {
      x:
        (clientX - rect.left) *
        scaleX,

      y:
        (clientY - rect.top) *
        scaleY,
    };
  }

  function startDrag(event) {
    event.preventDefault();

    const point =
      getPointerPosition(event);

    if (!point) return;

    setDragging(true);

    startRef.current = {
      mouseX: point.x,
      mouseY: point.y,
      originalX: x,
      originalY: y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  function moveDrag(event) {
    if (!dragging) return;

    const point =
      getPointerPosition(event);

    if (!point) return;

    const start =
      startRef.current;

    const newX =
      start.originalX +
      (point.x - start.mouseX);

    const newY =
      start.originalY +
      (point.y - start.mouseY);

    onChange({
      x: Math.max(
        0,
        Math.min(
          CANVAS_WIDTH - width,
          newX
        )
      ),

      y: Math.max(
        0,
        Math.min(
          CANVAS_HEIGHT - height,
          newY
        )
      ),

      width,
      height,
    });
  }

  function stopDrag() {
    setDragging(false);
  }

  function startResize(event) {
    event.preventDefault();
    event.stopPropagation();

    const point =
      getPointerPosition(event);

    if (!point) return;

    setResizing(true);

    startRef.current = {
      mouseX: point.x,
      mouseY: point.y,
      originalWidth: width,
      originalHeight: height,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  function moveResize(event) {
    if (!resizing) return;

    const point =
      getPointerPosition(event);

    if (!point) return;

    const start =
      startRef.current;

    const newWidth =
      Math.max(
        100,
        start.originalWidth +
          (point.x - start.mouseX)
      );

    const newHeight =
      Math.max(
        80,
        start.originalHeight +
          (point.y - start.mouseY)
      );

    onChange({
      x,
      y,
      width: Math.min(
        newWidth,
        CANVAS_WIDTH - x
      ),
      height: Math.min(
        newHeight,
        CANVAS_HEIGHT - y
      ),
    });
  }

  function stopResize() {
    setResizing(false);
  }

  return (
    <div className="editor-wrapper">

      <div
        ref={canvasRef}
        className="template-editor"
      >

        {/* HEADER AREA */}

        <div className="fake-header">
          LABORATORY HEADER
        </div>


        {/* REPORT AREA */}

        <div
          className="report-box"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}

          onPointerDown={
            startDrag
          }

          onPointerMove={
            moveDrag
          }

          onPointerUp={
            stopDrag
          }

          onPointerCancel={
            stopDrag
          }
        >

          <div className="report-content">

            <strong>
              MAIN LAB REPORT
            </strong>

            <span>
              Drag this box to move
            </span>

          </div>


          {/* RESIZE HANDLE */}

          <div
            className="resize-handle"

            onPointerDown={
              startResize
            }

            onPointerMove={
              moveResize
            }

            onPointerUp={
              stopResize
            }

            onPointerCancel={
              stopResize
            }
          />

        </div>


        {/* FOOTER */}

        <div className="fake-footer">
          LABORATORY FOOTER
        </div>

      </div>


      <div className="editor-values">

        <span>
          X: {Math.round(x)}
        </span>

        <span>
          Y: {Math.round(y)}
        </span>

        <span>
          Width: {Math.round(width)}
        </span>

        <span>
          Height: {Math.round(height)}
        </span>

      </div>

    </div>
  );
}
