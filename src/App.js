import React, { useEffect, useRef } from "react";
import "./styles.css";
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Text, Circle } from 'react-konva';

const PDFJS = window.pdfjsLib;

export default function App() {
  const [pdf, setPdf] = React.useState("");
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pdfRendering, setPdfRendering] = React.useState("");
  const [pageRendering, setPageRendering] = React.useState("");
  const [singlePage, setSinglePage] = React.useState();
  const layer_page_pdf_ref = useRef(null);
  const stage_page_pdf_ref = useRef(null);

  async function showPdf(event) {
    try {
      setPdfRendering(true);
      const file = event.target.files[0];
      const uri = URL.createObjectURL(file);
      var _PDF_DOC = await PDFJS.getDocument({ url: uri });
      setTotalPages(_PDF_DOC.numPages)
      setPdf(_PDF_DOC);
      setPdfRendering(false);
      document.getElementById("file-to-upload").value = "";
    } catch (error) {
      alert(error.message);
    }
  }

  function changePage(mPage) {
    var newPage = ((mPage % totalPages) + totalPages) % totalPages
    setCurrentPage(newPage);
  }

  async function renderSinglePage(pageNum) {
    setPageRendering(true);

    const canvas = document.createElement("canvas");
    canvas.setAttribute("className", "canv");

    var page = await pdf.getPage(pageNum + 1);
    var viewport = page.getViewport({ scale: 1 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    var render_context = {
      canvasContext: canvas.getContext("2d"),
      viewport: viewport
    };

    setWidth(viewport.width);
    setHeight(viewport.height);
    await page.render(render_context).promise;
    let img = canvas.toDataURL("image/png");

    var imageObj_page = new Image();

    const layer_pdf = layer_page_pdf_ref.current;

    const prev_bg = layer_pdf.find('.background')

    // text_ref.current.text = "mmm"
    console.log(prev_bg.length)
    // PDF page data as background	
    imageObj_page.onload = function () {
      // remove previous background
      const prev_bg = layer_pdf.find('.background')
      if (prev_bg.length > 0) {
        prev_bg[0].destroy();
      }

      var background = new Konva.Image({
        name: 'background',
        image: imageObj_page,
      });
      // add new one
      layer_pdf.add(background);
      background.moveToBottom();
      layer_pdf.draw();
    };
    imageObj_page.src = img;

    stage_page_pdf_ref.current.draw();

    setSinglePage(img)
    setPageRendering(false)
  }

  useEffect(() => {
    pdf && renderSinglePage(currentPage);
    // eslint-disable-next-line
  }, [pdf, currentPage]);

  const styles = {
    wrapper: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "5px"
    },
    imageWrapper: {
      // width: "300px",
      // height: "350px",
      border: "1px solid rgba(0,0,0,0.15)",
      borderRadius: "3px",
      boxShadow: "0 2px 5px 0 rgba(0,0,0,0.25)",
      padding: "0"
    }
  };

  return (
    <div className="App">
      <button
        id="upload-button"
        onClick={() => document.getElementById("file-to-upload").click()}
      >
        Select PDF
      </button>
      <input
        type="file"
        id="file-to-upload"
        accept="application/pdf"
        hidden
        onChange={showPdf}
      />
      <div id="pdf-main-container">
        <div id="pdf-loader" hidden={!pdfRendering}>
          Loading document ...
        </div>
        <div id="page-count-container">
          Page {currentPage + 1} of <div id="pdf-total-pages">{totalPages}</div>
        </div>
        <div id="pdf-contents">
          <div id="pdf-meta">
            <div id="pdf-buttons">
              <button id="pdf-prev" onClick={() => changePage(currentPage - 1)}>
                Previous
              </button>
              <button id="pdf-next" onClick={() => changePage(currentPage + 1)}>
                Next
              </button>
            </div>
          </div>
          <div id="page-loader" hidden={!pageRendering}>
            Loading page ...
          </div>
        </div>
      </div>

      <div id="pdf-container">
        <Stage width={width} height={height} ref={stage_page_pdf_ref}>
          <Layer id="layer_page_pdf" ref={layer_page_pdf_ref} >
          </Layer>
        </Stage>
      </div>

    </div>
  );
}
