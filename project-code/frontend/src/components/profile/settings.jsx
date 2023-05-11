import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {Alert, Container} from "react-bootstrap";

function UserSettings() {
    return (
        <Container>
            <h2>Basic settings</h2>
            <p>You can update your basic profile information here, such as your username and email address.</p>
            <Form>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter email"/>
                    <Form.Text className="text-muted">
                        We'll never share your email with anyone else.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password"/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicCheckbox">
                    <Form.Check type="checkbox" label="Check me out"/>
                </Form.Group>
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
            <h2 className="mt-3">Security & Authentication</h2>
            <h4>Update your password</h4>
            <h4>Session management</h4>
            <div>
                <Button>Log out all other sessions</Button>{'  '}
                <Button>Log out</Button>

            </div>
            <h4>Connected groups</h4>
            <p>The following groups currently have access to your basic profile information (username, id, email & home
                group number)</p>

            <h2>Delete account</h2>
            <Alert variant="warning">
                <p>Warning: Deleting your account cannot be undone. There is no going back.</p>
                <ul>
                    <li>All of your creations will be deleted.</li>
                    <li>All of your likes and comments will be removed.</li>
                    <li>This will <strong>not</strong> delete your account on other groups in the supergroup. If you
                        want to delete your creations & data with other groups, you <strong>must</strong> first go to
                        them and delete your account, before deleting here.<br/> Otherwise, you will be unable to login
                        to other groups.
                    </li>
                </ul>
            </Alert>
        </Container>);
}

export default UserSettings;