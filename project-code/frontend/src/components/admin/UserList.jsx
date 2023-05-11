import {Table} from "react-bootstrap";

const ADMIN_PERMISSION = parseInt(process.env.ADMIN_PERM || 2, 10);
const MOD_PERMISSION = parseInt(process.env.MOD_PERM || 1, 10);

export function UserList({items, select}) {
    return (
        <Table hover>
            <thead>
            <tr>
                <th>id</th>
                <th>Username</th>
                <th>Email</th>
                <th>Group</th>
                <th>Permission</th>
            </tr>
            </thead>
            <tbody>
            {
                items.map(u => (<UserTableRow user={u} key={u.userID} handleClick={select}/>))
            }
            </tbody>
        </Table>
    );
}

function getPerm(p) {
    if (p === ADMIN_PERMISSION) return <code>Administrator</code>;
    if (p === MOD_PERMISSION) return <span>Moderator</span>;
    return "User";
}

function UserTableRow({user, handleClick}) {
    const {username, userID, email, permission, external} = user;
    return (<tr onClick={() => handleClick(user)} style={{cursor: "pointer"}}>
        <td>{userID} {external ? `(${external.externalID})` : ""}</td>
        <td>{username}</td>
        <td>{email}</td>
        <td>{external ? <code>{external.groupID}</code> : "Home"}</td>
        <td>{getPerm(permission)}</td>
    </tr>)
}

export default UserList;
