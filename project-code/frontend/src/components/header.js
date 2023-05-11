import React from 'react-dom';
import {Link, Outlet} from 'react-router-dom';
// This is a function component
// It's a bit more lightweight than a class-based component which can also be used.
// This one doesn't take any parameters, but they can take them.
// The CSS styling for this component is in App.css. For React class names are put into className rather than 'class'.
// Using Bracket notation is a different way of representing functions: This is the same as "function Header {...}"
// with an export statement on a different line.
export const Header = () => {
    return (
        <>
            <div className="header">
                <h1 className="logo">Fantastic Puzzles Fife</h1>
                <Link to="/login" className="headerButton" id="loginButton">Login</Link>
                <Link to="/registration" className="headerButton" id="registerButton">Register</Link>
                <span className="headerBottom">Group 19</span>
            </div>
            <Outlet/>
        </>
    )

};

export default Header;