import React from 'react-dom';
import {ErrorMessage} from "./UserContext";

export const NotFound = () => {
    return (
        <ErrorMessage
            title="404: Not Found"
            message={<>Oops! It looks like this page is lost at sea. Why not try to <a href="javascript:history.back()">go
                back to shore?</a></>}
            style={{
                color: "#FFFFFF", // Set font color to white
                backgroundColor: "#2B2D42",
                padding: "2rem",
                borderRadius: "0.5rem",
                backgroundImage: "url(https://media.giphy.com/media/3o7TKDcct1FnGh4FyM/giphy.gif)",
                backgroundPosition: "center",
                backgroundSize: "cover"
            }}
        />
    )
};

export default NotFound;



