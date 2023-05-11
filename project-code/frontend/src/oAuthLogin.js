import React from 'react-dom';
//import './css/LoginForm.css';
import {useState} from "react";
import {ErrorMessage} from "./components/UserContext";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";


export const OAuthLogin = () => {
    const [state, setState] = useState({username: "", password: ""});
    const [err, setError] = useState();

    const searchParams = new URLSearchParams(window.location.search);
    const clientId = searchParams.get("client_id");

    if (!clientId) {
        return <ErrorMessage title="Oops, invalid request." message="Cannot continue: No client ID provided." />
    }


    function handleUpdate(ev) {
        setState({
            ...state,
            [ev.target.name]: ev.target.value
        });

        if (err) {
            setError("");
        }

    }

    async function handleSubmit() {

        if (!state.username || !state.password) {
            setError("Please fill out all fields before submitting.");
            return;

        }
        const res = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/authentication/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({"username": state.username, "password": state.password})
        })

        if (res.ok) {
            window.location.href = `${process.env.REACT_APP_BACKEND_HOST}/fedapi/auth/authorise?state=${searchParams.get("state")}&client_id=${clientId}`

        } else {
            const body = await res.json();
            setError(body.error_description || body.error);
        }

    }


    return (
        <div className="LoginForm">
            <div id="bgImage">

            </div>

            <div id="form">
                <h2>Supergroup Login</h2>
                <h3>Please log in to continue to Group <code>{clientId}</code>.</h3>
                <p style={{color: "red"}}>{err || ""}</p>

                <Form>
                    <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Enter username" name="username" value={state.username}
                                      onChange={handleUpdate}/>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="Password" name="password" value={state.password}
                                      onChange={handleUpdate}/>
                    </Form.Group>

                    <Button type="button" onClick={handleSubmit} className="w-100">
                        Login & Authorise
                    </Button>
                </Form>
                <br/>
                <Button type="button" variant="warning" className="back" onClick={()=> {
                    window.location.href = `${process.env.REACT_APP_OAUTH}`.replaceAll("#", clientId);
                }
                }>Cancel - Go back to Group {clientId}</Button>
            </div>

        </div>
    )

};


export default OAuthLogin;