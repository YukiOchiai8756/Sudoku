import {ErrorMessage} from "./UserContext";
import React from "react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return {error};
    }

    componentDidCatch(error, info) {
        console.error("Boundary caught error");
        console.log(error);
        console.log(info);
    }

    render() {
        const error = this.state.error;
        if (this.state.error) {
            // You can render any custom fallback UI
            return <ErrorMessage title={error.error || "Oops, something went wrong"}
                                 message={error.error_description || error.message}/>
        }

        return this.props.children;
    }
}