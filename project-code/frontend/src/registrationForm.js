import React from 'react-dom';
import './css/RegistrationForm.css';
import {Link, useNavigate} from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {useState} from "react";
// This is a function component
// It's a bit more lightweight than a class-based component which can also be used.
// This one doesn't take any parameters, but they can take them.
// The CSS styling for this component is in App.css. For React class names are put into className rather than 'class'.
// Using Bracket notation is a different way of representing functions: This is the same as "function Header {...}"
// with an export statement on a different line.
export const RegistrationForm = () => {
    const navigate = useNavigate();
    // State objects to store the current input in the input boxes
    const [username, setUname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    /**
     * Function fired when the form is submitted
     * Sends the input details to the backend for insertion to the database
     */
    const obtainInput = async () => {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/authentication/register`, {
            method: "post",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({"username": username, "password": password, email})
        });
        const body = await res.json();

        if (body.error) {
            if (body.error_description) {
                alert(`${body.error}: ${body.error_description}`);
            } else {
                alert(`${body.status}: ${body.error}`);
            }
        } else {
            setUname("");
            setEmail("");
            setPassword("");
            navigate("/browser");
        }
    }
    return (
        <div className="RegistrationForm">
            <div id="bgImage">
                <div id="welcome">WELCOME!</div>
            </div>
            <div id="form">
                <h2>Register</h2>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Enter username" id="regUname"
                                      onChange={(e) => setUname(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Enter email (don't use an actual email address)"
                                      id="regEmail" onChange={(e) => setEmail(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="Password" id="regPassword"
                                      onChange={(e) => setPassword(e.target.value)}/>
                    </Form.Group>

                    <Button variant="primary" type="button" onClick={obtainInput} className="w-100">
                        Sign Up
                    </Button>
                </Form>
                <div id="returnToLogin">Return to <Link to="/login" style={{color: 'white'}}>Login</Link></div>
            </div>
        </div>

    )

};


export default RegistrationForm;