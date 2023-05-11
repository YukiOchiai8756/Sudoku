import {Container} from "react-bootstrap";
import {useEffect, useState} from "react";
import {UserList} from "./UserList";
import {EditUser} from "./EditUser";
import {request} from "../../util";

// Pass in URL, Title, Modal, List
export function UserAdminDashboard() {

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
        <h1>User admin</h1>
        <UserList users={items} selectUser={setTarget}/>
    </Container>);
}
