import React, {useState} from "react";

export const CommentForm = ({
                                handleSubmit,
                                submitLabel,
                                hasCancelButton = false,
                                handleCancel,
                                initialText = "",
                            }) => {
    const [text, setText] = useState(initialText);
    const isTextareaDisabled = text.length === 0;
    const onSubmit = (event) => {
        event.preventDefault();
        handleSubmit(text);
        setText("");
    };
    return (
        <form onSubmit={onSubmit}
              style={{backgroundColor: "rgba(0, 73, 124, 0.7)", padding: "20px", borderRadius: "10px"}}>
            <textarea
                className="comment-form-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    border: "2px solid #60c7d9",
                    borderRadius: "5px",
                    padding: "10px",
                    width: "100%",
                    height: "150px",
                    resize: "none",
                    fontSize: "16px",
                    color: "#262728"
                }}
                placeholder="Enter your comment here..."
            />
            <button className="comment-form-button" style={{
                backgroundColor: "#60c7d9",
                color: "#FFF",
                padding: "10px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                margin: "10px 0",
                width: "100%",
                fontSize: "16px"
            }} disabled={isTextareaDisabled}>
                {submitLabel}
            </button>
            {hasCancelButton && (
                <button
                    type="button"
                    className="comment-form-button comment-form-cancel-button"
                    onClick={handleCancel}
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        color: "#60c7d9",
                        border: "2px solid #60c7d9",
                        borderRadius: "5px",
                        padding: "10px",
                        width: "100%",
                        cursor: "pointer",
                        fontSize: "16px"
                    }}
                >
                    Cancel
                </button>
            )}
        </form>
    );
};

export default CommentForm;
