import {Container} from "react-bootstrap";
import {useEffect, useState} from "react";
import {request} from "../../util";

// Pass in URL, Title, Modal, List
export function AdminDashboardPart({url, title, Modal, List}) {
    const [target, setTarget] = useState();
    const [items, setItems] = useState([]);
    const [error, setError] = useState();

    useEffect(function () {
        async function getItems() {
            const resp = await request(url);
            if (resp.error) {
                throw new Error(resp.error);
            } else {
                setItems(resp);
            }
        }

        getItems().catch(e => {
            setError(e.message);
            console.error(e)
        });

    }, [target, url]);

    if (error) {
        return <Container>
            <h1>Oops! Something went wrong.</h1>
            <code>{error}</code>
        </Container>
    }

    return (<Container>
        {target ?
            (<Modal target={target} handleClose={() => setTarget(null)}/>) : ""
        }
        <h1>{title}</h1>
        <List items={items} select={setTarget}></List>
    </Container>);
}

export default AdminDashboardPart;