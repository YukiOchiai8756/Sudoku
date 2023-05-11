import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {Alert, Form} from "react-bootstrap";
import {request} from "../../util";

export function EditUser({target, handleClose}) {
    const [user, setUser] = useState(target);
    const {username, email, userID, permission, password = "", external} = user;
    const [error, setError] = useState("");

    console.log(user);
    function handleUpdate(name, value) {
        setUser({
            ...user,
            [name]: value,
            // Update-taint: So we can ignore clicks to save if the user object hasn't actually changed.
            _userUpdated: true
        });
    }

    async function handleSave() {
        delete user._userUpdated;

        const res = await request(`/api/user/${user.userID || user.id}`, {
            method: "PATCH",
            body: user
        });

        if (res.error) {
            setError(`${res.error}: ${res.error_description}`);
        } else {
            handleClose(null);
        }
    }

    async function handleDelete() {
        const res = await request(`/api/user/${user.userID}`, {
            method: "DELETE"
        });

        if (res.error) {
            setError(`${res.error}: ${res.error_description}`);
        } else {
            handleClose(null);
        }
    }

    if (!target) return <></>;

    return (

        <Modal show={true} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit user - {username} ({userID})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error ?
                    <Alert variant="danger">
                        <Alert.Heading>Error saving changes</Alert.Heading>
                        {error}
                    </Alert>

                    : ""}
                <Form>
                    <Form.Group className="mb-3" controlId="editUserUsername">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text"
                                      placeholder="Enter username"
                                      value={username}
                                      onChange={(e) => handleUpdate("username", e.target.value)}
                                      disabled={external}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="editUserEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" placeholder="Enter email"
                                      value={email}
                                      onChange={(e) => handleUpdate("email", e.target.value)}
                                      disabled={external}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="editUserPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Password"
                                      disabled={external}
                                      value={password}
                                      onChange={(e) => handleUpdate("password", e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="editUserPermission">
                        <Form.Label>Permission level</Form.Label>
                        <Form.Select aria-label="Default select example" value={permission}
                                     onChange={(e) => handleUpdate("permission", parseInt(e.target.value), 10)}>
                            <option value="0">User</option>
                            <option value={"" + process.env.REACT_APP_MOD_PERM}>Moderator</option>
                            <option value={"" + process.env.REACT_APP_ADMIN_PERM}>Admin</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
                <hr/>
                <h4>Danger zone</h4>
                <p>Take care when using these buttons. </p>
                {external ? <p>This user is external. Deleting this user will only delete the local user instance.
                    Group: {external.groupID}</p> : <></>}

                <Button variant="danger" onClick={handleDelete}>
                    Delete user
                </Button>
                {"  "}
                <Button disabled={!external} onClick={() => alert("Not implemented")}>
                    Resync
                </Button>

            </Modal.Body>
            <Modal.Footer>


                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="success" onClick={handleSave}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>

    );
}
