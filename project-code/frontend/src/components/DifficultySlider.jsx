import React from 'react-dom';

export function difficultyName(x) {
    switch (x) {
        case 0:
            return "NO RATING";
        case 1:
            return "BEG";
        case 2:
            return "INT";
        case 3:
            return "ADV"
        default:
            return "NO RATING";
    }
}


export const DifficultySlider = ({handleUpdate, value}) => {
    const colors = ['#3b3c4f', '#4c4d62', '#5f6075', '#727386', '#858599', '#9898ac'];
    const backgroundColor = colors[value];

    return (
        <div style={{display: "flex", alignItems: "center"}}>
            <input
                type="range"
                min="0"
                value={value}
                max="3"
                className="slider"
                id="difficulty-slider"
                onChange={(e) => handleUpdate(parseInt(e.target.value, 10))}
                style={{backgroundColor: "#fff", width: "100%", margin: "0 10px"}}
            />
            <label
                htmlFor="difficulty-slider"
                id="difficulty-label"
                style={{
                    minWidth: "50px",
                    backgroundColor: backgroundColor,
                    color: "#fff",
                    borderRadius: "5px",
                    padding: "5px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                }}
            >
                {difficultyName(value)}
            </label>
        </div>
    );
};

