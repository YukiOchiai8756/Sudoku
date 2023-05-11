import {useState} from "react";
import {Link} from "react-router-dom";

/**
 * The built in dropdown for React bootstrap does not behave in the way I want
 * @returns {JSX.Element}
 * @constructor
 */
export const NavDropdown = ({toggleText, toggleUrl, children}) => {
    const [isShown, setIsShown] = useState(false);

    return <li className="nav-item dropdown" onMouseEnter={() => setIsShown(true)}
               onMouseLeave={() => setIsShown(false)}>
        <Link className="nav-link dropdown-toggle" to={toggleUrl} role="button" data-bs-toggle="dropdown"
              aria-expanded="false">
            {toggleText}
        </Link>
        <ul className={`dropdown-menu ${isShown ? "show" : ""}`}>
            {children}
        </ul>
    </li>

};

export default NavDropdown;