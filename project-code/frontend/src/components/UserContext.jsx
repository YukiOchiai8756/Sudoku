import {createContext, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {request} from "../util";
import {Container} from "react-bootstrap";

/*
    Authenticated provides a context, which means that **all** child elements, no matter how deeply they are nested,
    Can access the user object it provides.
    You can read more about context here: https://reactjs.org/docs/context.html
    The useContext hook is very useful, and is what I recommend using:
    https://reactjs.org/docs/hooks-reference.html#usecontext


    Authenticated will handle the fetching of user information for you - all you need to do is consume the context,
    i.e.:
    <Authenticated>
        <Something>
               <MyComponent/>

         </Something>
    <Authenticated>

    function MyComponent () {
        const user = useContext(UserContext);
        return (<p>Hello ${user.username}<p>);
    }

 */

export const UserContext = createContext(null);

/**
 *
 * @param allowLoggedOut - Prop - Boolean indicating whether child elements should still render if the user
 * is not logged into an account. Otherwise, an error will be shown.
 * @param children: Children of this element
 * @returns {JSX.Element}
 * @constructor
 */
export const Authenticated = ({children, allowLoggedOut} = {}) => {
    const allowAnon = allowLoggedOut;
    // UseEffect to fetch info
    const [user, setUser] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            const resp = await request(`${process.env.REACT_APP_BACKEND_HOST}/api/user/@me`);

            if (resp.error) {
                if (resp.status !== 401) {
                    throw new Error(resp.error_description || resp.error);
                }

            } else {
                setUser(resp);
            }
            setHasFetched(true);
        }

        fetchUser().catch(e => {
            console.log(e);
            if (e instanceof TypeError) {
                setHasFetched("OFFLINE");
            } else {
                setHasFetched(true);
            }

        })


    }, []);

    if (!hasFetched) {
        return <Container>
            <h1>Loading...</h1>
        </Container>;
    }

    if (hasFetched === "OFFLINE") {
        return <ErrorMessage title="Server offline."
                             message="The backend server is currently offline. Please try again later."/>
    }

    if (!user && !allowAnon) {
        return <ErrorMessage title="You are not logged in."
                             message={<>This page requires you to be logged in. Please login <Link to="/login">here
                                 first.</Link></>}/>
    }

    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>);
};

/**
 * For serious errors we can't recover from
 * @param title
 * @param message
 * @returns {JSX.Element}
 * @constructor
 */
export const ErrorMessage = ({title, message}) => {
    return <Container className="pt-3">
        <h1 style={{color: "red"}}>{title}</h1>
        <p>{message}</p>
    </Container>
}