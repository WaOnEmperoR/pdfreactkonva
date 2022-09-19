import React, { useEffect, useRef } from "react";
import "./styles.css";
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Text, Circle } from 'react-konva';
import useImage from "use-image";
import logo from './img/pngegg.png';

const PDFJS = window.pdfjsLib;

export default function App() {
  const [pdf, setPdf] = React.useState("");

  const [stageWidth, setStageWidth] = React.useState(0);
  const [stageHeight, setStageHeight] = React.useState(0);
  const [stageWidthInitial, setStageWidthInitial] = React.useState(0);
  const [stageHeightInitial, setStageHeightInitial] = React.useState(0);

  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(0);

  const [radius, setRadius] = React.useState(100);

  const [pdfRendering, setPdfRendering] = React.useState("");
  const [pageRendering, setPageRendering] = React.useState("");
  const [singlePage, setSinglePage] = React.useState();

  const [scale, setScale] = React.useState(1)

  const [scaleX, setScaleX] = React.useState(1)
  const [scaleY, setScaleY] = React.useState(1)

  const [xPos, setXPos] = React.useState(0);
  const [yPos, setYPos] = React.useState(0);
  const [boxWidth, setBoxWidth] = React.useState(0);
  const [boxHeight, setBoxHeight] = React.useState(0);

  const [firstOpened, setFirstOpened] = React.useState(true);

  const [signatureImage] = useImage(logo)

  const initialWidthRef = useRef({});

  const xPosRef = useRef({});
  const yPosRef = useRef({});
  const boxWidthRef = useRef({});
  const boxHeightRef = useRef({});

  const stageWidthRef = useRef({});
  const stageHeightRef = useRef({});

  const layer_page_pdf_ref = useRef(null);
  const stage_page_pdf_ref = useRef(null);
  const container_ref = useRef(null);

  const checkSize = () => {
    // now we need to fit stage into parent
    var containerWidth = container_ref.current.offsetWidth;
    // console.log(containerWidth)

    // to do this we need to scale the stage
    var scale = containerWidth / initialWidthRef.current;

    // console.log(scale)

    var width_updated = initialWidthRef.current * scale

    // console.log(width_updated)

    // setStageWidth(initialWidthRef.current * scale);
    // setStageHeight(stageHeightInitial * scale);

    setScaleX(scale)
    setScaleY(scale)
  };

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

    await page.render(render_context).promise;
    let img = canvas.toDataURL("image/png");

    setStageWidthInitial(viewport.width);
    setStageHeightInitial(viewport.height);

    setStageWidth(viewport.width);
    setStageHeight(viewport.height);

    stageWidthRef.current = viewport.width
    stageHeightRef.current = viewport.height

    initialWidthRef.current = viewport.width

    const layer_pdf = layer_page_pdf_ref.current;

    if (firstOpened) {
      boxWidthRef.current = 250
      boxHeightRef.current = 176
    }

    setFirstOpened(false)
    /**
     * PART DRAW SIGNATURE BOX
     */
    var strokeWidth = 2

    var signatureImage_box = new Konva.Image({
      x: 20,
      y: 20,
      width: 250,
      height: 176,
      stroke: 'red',
      strokeWidth: strokeWidth,
      draggable: true,
      image: signatureImage,
      dragBoundFunc: (pos) => {
        console.log(pos)
        console.log("--> " + boxWidthRef.current + " -- " + boxHeightRef.current)

        var topleft_x = pos.x;
        var topleft_y = pos.y;
        var bottomright_x = pos.x + boxWidthRef.current;
        var bottomright_y = pos.y + boxHeightRef.current;

        // if located in left border then cannot drag in horizontal direction 
        var canDragLeft = topleft_x > strokeWidth;

        // if located in top border then cannot drag in vertical direction
        var canDragTop = topleft_y > strokeWidth;

        // if located in right border then cannot drag in horizontal direction 
        var canDragRight = bottomright_x < stageWidthRef.current - strokeWidth;

        // if located in bottom border then cannot drag in vertical direction
        var canDragBottom = bottomright_y < stageHeightRef.current - strokeWidth;

        var newX = pos.x;
        var newY = pos.y;

        if (!canDragLeft) {
          newX = strokeWidth;
        }
        else if (!canDragRight) {
          newX = stageWidthRef.current - boxWidthRef.current - strokeWidth;
        }

        if (!canDragTop) {
          newY = strokeWidth;
        }
        else if (!canDragBottom) {
          newY = stageHeightRef.current - boxHeightRef.current - strokeWidth;
        }

        return {
          x: newX,
          y: newY
        }
      }
    })

    layer_pdf.add(signatureImage_box)

    const tr = new Konva.Transformer({
      id: 'transformer_box',
      node: signatureImage_box,
      keepRatio: true,
      rotateEnabled: false,
      ignoreStroke: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      boundBoxFunc: (oldBox, newBox) => {
        console.log(newBox)

        const isOut =
          newBox.x < 0 ||
          newBox.y < 0 ||
          newBox.x + newBox.width > stageWidthRef.current ||
          newBox.y + newBox.height > stageHeightRef.current;

        // if new bounding box is out of visible viewport, let's just skip transforming
        // this logic can be improved by still allow some transforming if we have small available space
        if (isOut) {
          boxWidthRef.current = oldBox.width
          boxHeightRef.current = oldBox.height

          return oldBox;
        }
        boxWidthRef.current = newBox.width
        boxHeightRef.current = newBox.height

        return newBox;
      },
    });
    layer_pdf.add(tr);

    /**
     * PART DRAW BACKGROUND
     */
    var imageObj_page = new Image();
    // PDF page data as background	
    imageObj_page.onload = function () {
      // remove previous background
      const prev_bg = layer_pdf.find('.background')
      if (prev_bg.length > 0) {
        prev_bg[0].destroy();
      }

      const prev_img = layer_pdf.find('Image')
      // console.log(prev_img.length)
      for (let i = 1; i < prev_img.length; i++) {
        prev_img[i].destroy();
      }

      const prev_transfomer = layer_pdf.find('Transformer')
      // console.log(prev_transfomer.length)
      for (let i = 1; i < prev_transfomer.length; i++) {
        prev_transfomer[i].destroy();
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

    layer_pdf.draw()
    // console.log("after render : " + initialWidthRef.current)

    setSinglePage(img)
    setPageRendering(false)
  }

  useEffect(() => {
    pdf && renderSinglePage(currentPage);
    // eslint-disable-next-line
  }, [pdf, currentPage]);

  useEffect(() => {
    window.addEventListener('resize', checkSize);

    // cleanup this component
    return () => {
      window.removeEventListener('resize', checkSize);
    };
  }, []);

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

      <div id="pdf-container" ref={container_ref} style={{
        border: "1px solid grey", display: "inline-block"
      }} >
        <Stage width={stageWidth} height={stageHeight} ref={stage_page_pdf_ref} scaleX={scaleX} scaleY={scaleY}>
          <Layer id="layer_page_pdf" ref={layer_page_pdf_ref} >
          </Layer>
        </Stage>
      </div>

    </div>
  );
}
