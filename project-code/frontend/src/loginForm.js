import React from 'react-dom';
import {Link, useNavigate} from 'react-router-dom';
import './css/LoginForm.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.css';
import {useContext, useEffect, useState} from "react";
import Modal from "react-bootstrap/Modal";
import {UserContext} from "./components/UserContext";

// This is a function component
// It's a bit more lightweight than a class-based component which can also be used.
// This one doesn't take any parameters, but they can take them.
// The CSS styling for this component is in App.css. For React class names are put into className rather than 'class'.
// Using Bracket notation is a different way of representing functions: This is the same as "function Header {...}"
// with an export statement on a different line.
export const LoginForm = () => {

    // Import user context to retrieve information about the current user
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const [modalShown, setModal] = useState(false);

    // Redirect user to browse page if already logged in
    useEffect(()=> {
        if (user) {
            navigate("/browser");

        }

    }, [user])

    const [username, setUname] = useState("");
    const [password, setPassword] = useState("");

    /**
     * Function fired when the submit button is pressed
     * Send request with input details for validation
     */
    const obtainInput = async () => {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/authentication/login`, {
            method: "post",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({"username": username, "password": password})
        });
        const body = await res.json();

        if (body.error) {
            if (body.error_description) {
                alert(`${body.error}: ${body.error_description}`);
            } else {
                alert(`${body.status}: ${body.error}`);
            }
        } else {
            // Reset state object for next usage
            setUname("");
            setPassword("");
            navigate("/browser");
        }

    }

    /*

     */
    return (
        <div className="LoginForm">
            { modalShown && <FedApiModal handleClose={()=> setModal(false)} />}
            <div id="bgImage">
                <div id="welcome">WELCOME!</div>
            </div>
            <div id="form">
                <h2>Login</h2>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Enter username" id="logUname"
                                      onChange={(e) => setUname(e.target.value)}/>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="Password" id="logPassword"
                                      onChange={(e) => setPassword(e.target.value)}/>
                    </Form.Group>

                    <Button variant="primary" type="button" onClick={obtainInput} className="w-100">
                        Enter
                    </Button>
                </Form>

                <br/>

                <Button variant="danger" type="button" className="w-100" onClick={()=> setModal(true)}>Login with other
                    group?</Button>
                <br/>
                <div id="goToRegister">Don't have an account yet? Sign up <Link to="/registration"
                                                                                style={{color: 'white'}}>here</Link>
                </div>
            </div>
        </div>

    )
};

const FedApiModal = ({handleClose})=> {
    const [groupId, setGroupId] = useState();
    function oAuthHandle () {
        if (groupId) {
            const cb = encodeURIComponent(`${process.env.REACT_APP_BACKEND_HOST}/fedapi/auth/redirect/${groupId}`);
            return window.location.href = process.env.REACT_APP_OAUTH.replace(/#/g, "" + groupId) + `&redirect_uri=${cb}`;
        }
    }

    return (<Modal show={true} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Log in with other group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Super-group authentication allows you to log into our server using your account on another Tens Supergroup server.</p>
            <p>Please select the group number of your "home server" that you'd like to log in from, and we'll send you there to log in.</p>

                <Form.Select aria-label="Supergroup selection" value={groupId} onChange={e => setGroupId(e.target.value)}>
                    <option>Select a group to login with</option>
                    <option value={10}>10</option>
                    <option value={11}>11</option>
                    <option value={12}>12</option>
                    <option value={13}>13</option>
                    <option value={14}>14</option>
                    <option value={15}>15</option>
                    <option value={16}>16</option>
                    <option value={17}>17</option>
                    <option value={18}>18</option>
                </Form.Select>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Cancel
            </Button>
            <Button variant="success" onClick={oAuthHandle}>
                Login
            </Button>
        </Modal.Footer>
    </Modal>)}


export default LoginForm;
