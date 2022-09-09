import React, { useEffect } from "react";
import "./styles.css";

const PDFJS = window.pdfjsLib;

export default function App() {
  const [pdf, setPdf] = React.useState("");
  const [width, setWidth] = React.useState(0);
  const [images, setImages] = React.useState([]);
  const [height, setHeight] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pdfRendering, setPdfRendering] = React.useState("");
  const [pageRendering, setPageRendering] = React.useState("");
  const [singlePage, setSinglePage] = React.useState();

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

    setSinglePage(img)
    setPageRendering(false)
  }

  async function renderAllPages() {
    setPageRendering(true);
    const imagesList = [];
    const canvas = document.createElement("canvas");
    canvas.setAttribute("className", "canv");
    let canv = document.querySelector(".canv");

    setTotalPages(pdf.numPages)
    console.log("page lenght", pdf.numPages);

    for (let i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
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
      imagesList.push(img);
    }
    setImages(imagesList);
    setPageRendering(false);
  }

  useEffect(() => {
    pdf && renderSinglePage(currentPage);
    // pdf && renderAllPages();
    // console.log(currentPage)
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
          <div id="image-convas-row">
            {/* <canvas id="pdf-canvas" width={width} height={height}></canvas> */}
            <div style={styles.wrapper}>
              <div style={styles.imageWrapper}>
                <img
                  id="image-generated"
                  src={singlePage}
                  alt="pdfImage"
                  style={{
                    width: "100%",
                    height: "100%",
                    margin: "0",
                    border: "none"
                  }}
                />
              </div>
              {/* {images.map((image, idx) => (
                <div key={idx} style={styles.imageWrapper}>
                  <img
                    id="image-generated"
                    src={image}
                    alt="pdfImage"
                    style={{
                      width: "100%",
                      height: "100%",
                      margin: "0",
                      border: "none"
                    }}
                  />
                </div>
              ))} */}
            </div>
          </div>
          <div id="page-loader" hidden={!pageRendering}>
            Loading page ...
          </div>
          <button>Show PNG</button>
          <button>Download PNG</button>
        </div>
      </div>
    </div>
  );
}
