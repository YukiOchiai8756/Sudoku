import {Container} from "react-bootstrap";
import {useContext, useEffect, useState} from "react";
import {UserContext} from "../UserContext";
import {UserList} from "./UserList";
import {EditUser} from "./EditUser";
import {request} from "../../util";

const ADMIN_PERMISSION = parseInt(process.env.ADMIN_PERM || 2, 10);


// Pass in URL, title, standardise modals
export function PuzzleAdminDashboard() {
    const user = useContext(UserContext);

    const [target, setTarget] = useState();
    const [items, setItems] = useState([]);
    const [error, setError] = useState();

    useEffect(function () {
        async function getUsers() {
            const resp = await request(`/api/user`);
            if (resp.error) {
                throw new Error(resp.error);
            } else {
                setItems(resp);
            }
        }

        getUsers().catch(e => {
            setError(e.message);
            console.error(e)
        });

    }, [target]);


    // Local-only validation. This is not really a security measure: more to avoid confusion and people thinking they
    // have access that they don't
    if (user.permission !== ADMIN_PERMISSION) {
        return <Container>
            <h1>You do not have access to that resource.</h1>
            <p>Permission <code>Administrator</code> is required to access the admin dashboard. If you think you should
                have access, please contact an administrator.</p>
        </Container>
    }

    if (error) {
        return <Container>
            <h1>Oops! Something went wrong.</h1>
            <code>{error}</code>
        </Container>
    }


    return (<Container>
        {target ?
            (<EditUser target={target} handleClose={() => setTarget(null)}/>) : ""
        }
        <h1>Admin Dashboard</h1>
        <UserList users={items} selectUser={setTarget}/>
    </Container>);
}
