import React, {useRef} from "react";
import html2pdf from "html2pdf.js";
import {css} from "glamor";

const ExportToPDFButton = ({component}) => {
    const componentRef = useRef(null);

    const handleExport = () => {
        const options = {
            margin: 0,
            filename: "puzzle.pdf",
            image: {type: "jpeg", quality: 0.98},
            html2canvas: {scale: 2},
            jsPDF: {unit: "pt", format: "a4", orientation: "portrait"},
        };

        html2pdf().set(options).from(componentRef.current).save();
    };

    return (
        <div>
            <button style={{
                backgroundColor: "#3D5A80",
                color: "#F4F4F4",
                padding: "10px 20px",
                borderRadius: "5px",
                border: "none"
            }} onClick={handleExport}>
                Export to PDF
            </button>
            <div ref={componentRef} {...css({
                backgroundColor: "#E0FBFC",
                width: "210mm",
                minHeight: "297mm",
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: "20px",
                padding: "20px",
                border: "1px solid #3D5A80"
            })}>
                {component}
            </div>
        </div>
    );
};

export default ExportToPDFButton;
