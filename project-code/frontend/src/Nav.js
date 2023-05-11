import {Link} from 'react-router-dom';
import './css/Nav.css';
import {useContext} from 'react';
import {UserContext} from './components/UserContext';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from './components/NavDropdown';
import ImportComponent from './components/ImportComponent';

const ADMIN_PERMISSION = parseInt(process.env.ADMIN_PERM || 2, 10);

export const Navigation = () => {

    const user = useContext(UserContext);

    /**
     * Function fired when the logout button is pressed
     * Send request to the backend to delete the cookie 'autorization'
     */
    const clearCookie = async () => {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/authentication/logout`, {credentials: "include"});
        const body = await response.json();
        if (body.error) {
            if (body.error_description) {
                console.log(`${body.error}: ${body.error_description}`);
            } else {
                console.log(`${body.status}: ${body.error}`);
            }
        }
    }

    return (
        <Navbar bg="light" expand="lg" style={{marginLeft: '1vw'}}>
            <Navbar.Brand>Surf's Up Sudoku</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav"/>
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="">
                    <NavDropdown toggleText="Creator" toggleUrl="/creator">
                        <Link className="dropdown-item" to="/creator">
                            Creator
                        </Link>
                        <Link className="dropdown-item" to="/lightsoutcreator">
                            Lights out creator
                        </Link>
                        <ImportComponent/>
                    </NavDropdown>
                    <NavDropdown toggleText="Browse" toggleUrl="/browser">
                        <Link className="dropdown-item" to="/browser">
                            Puzzles
                        </Link>
                        <Link className="dropdown-item" to="/quests">
                            Quests
                        </Link>
                    </NavDropdown>

                    <Link to="/leaderboard" className="nav-link">
                        Leader Board
                    </Link>

                    <Link to="/profile" className="nav-link">
                        Profile
                    </Link>


                    <Link to="/login" className="nav-link" onClick={clearCookie}>
                        Log out
                    </Link>
                    {user && user.permission === ADMIN_PERMISSION ? (
                        <Link to="/admin" className="nav-link">
                            Admin
                        </Link>
                    ) : (
                        ''
                    )}
                </Nav>
                {user && (
                    <Nav className="ms-auto" style={{marginRight: '1vw'}}>
                        <NavDropdown toggleText={user.username} toggleUrl="/profile">
                            <Link className="dropdown-item" to="/profile">
                                Profile
                            </Link>
                            <Link className="dropdown-item" to="/profile?settings">
                                Settings
                            </Link>

                        </NavDropdown>
                    </Nav>
                )}
            </Navbar.Collapse>
        </Navbar>
    );
};

export default Navigation;