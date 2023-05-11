import {UserContext} from "./UserContext";
import {useContext, useEffect, useState} from "react";
import {Tab, Tabs} from "react-bootstrap";
import PuzzleList from "./profile/PuzzleList";
import {useParams, useSearchParams} from "react-router-dom";
import {request} from "../util";
import {EditUser} from "./admin/EditUser";
import {QuestsInner} from "./quests";

export function ProfilePage() {
    const loggedInUser = useContext(UserContext);
    const {id = loggedInUser.id} = useParams();

    const [user, setUser] = useState({...loggedInUser, userID: loggedInUser.id});
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(function () {
        (async function () {
            if (id) {
                const res = await request(`/api/user/${id}`);
                setUser(res);
            }
        })().catch(e => console.error(e));
    }, [id]);

    return (<div>
        <div style={{textAlign: "center", padding: '20px'}}>
            <h1>Profile Page</h1>
            <h3>{user.username}</h3>
            {user.external ? <p>Home server: {user.external.groupID} (id: {user.external.externalID})</p> :
                <p>Home user</p>}

            {user.email && <p>Email: {user.email}</p>}

            <p>id: {user.id}, points: {user.points}</p>
        </div>

        {searchParams.get("settings") !== null ? <EditUser target={user} handleClose={() => {
            searchParams.delete("settings");
            setSearchParams(searchParams)
        }}/> : ""}

        <Tabs
            defaultActiveKey="creations"
            id="profile-tab"
            className="mb-3 justify-content-center"
        >
            <Tab eventKey="creations" title="Creations">
                <PuzzleList path={`${id}/creations`}/>
            </Tab>
            <Tab eventKey="solved" title="Solved">
                <PuzzleList path={`${id}/solved`}/>
            </Tab>
            <Tab eventKey="likes" title="Likes">
                <PuzzleList path={`${id}/likes`}/>
            </Tab>
            <Tab eventKey="comments" title="Comments">
                <PuzzleList path={`${id}/comments`}/>
            </Tab>

            <Tab eventKey="quests" title="Created quests">
                <QuestsInner creator={id}/>
            </Tab>


        </Tabs>

    </div>);
}
