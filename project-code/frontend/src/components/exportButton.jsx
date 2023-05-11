import React, {useState} from "react";
import Button from 'react-bootstrap';

const ExportButton = ({component}) => {
    const [exportData, setExportData] = useState("");
    const [isExported, setIsExported] = useState(false);

    const handleExport = () => {
        const data = JSON.stringify([component]);
        setExportData(data);
        setIsExported(true);
    };

    const exportButtonStyle = {
        backgroundColor: "#FF7F50", // coral color
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "8px 16px",
        cursor: "pointer",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.25)",
        marginRight: "8px",
    };

    const downloadLinkStyle = {
        backgroundColor: "#40E0D0", // turquoise color
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "8px 16px",
        cursor: "pointer",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.25)",
    };

    return (

        <div>
            <Button onClick={handleExport}>Export to JSON</Button>
            {exportData && (
                <a
                    href={`data:text/json;charset=utf-8,${encodeURIComponent(
                        exportData
                    )}`}
                    download="component.json"
                >
                    Download Export
                </a>
            )}
        </div>

    );
};

export default ExportButton;
