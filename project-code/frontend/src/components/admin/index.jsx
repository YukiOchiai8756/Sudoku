import {Container, Tab, Tabs} from "react-bootstrap";
import {useContext} from "react";
import {UserContext} from "../UserContext";
import AdminDashboardPart from "./AdminPart";
import {EditUser} from "./EditUser";
import UserList from "./UserList";
import PuzzleList from "./PuzzleList";
import EditPuzzle from "./EditPuzzle";

export * from "./user";
export * from "./puzzle";

const ADMIN_PERMISSION = parseInt(process.env.ADMIN_PERM || 2, 10);

export const AdminHome = () => {
    const user = useContext(UserContext);

    // Local-only validation. This is not really a security measure: more to avoid confusion and people thinking they
    // have access that they don't
    if (user.permission !== ADMIN_PERMISSION) {
        return <Container>
            <h1>You do not have access to that resource.</h1>
            <p>Permission <code>Administrator</code> is required to access the admin dashboard. If you think you should
                have access, please contact an administrator.</p>
        </Container>
    }

    return <Container className="pt-2">
        <h1>Admin dashboard</h1>
        <Tabs
            defaultActiveKey="home"
            id="admin-tab"
            className="mb-3"
        >
            <Tab eventKey="home" title="Home">
                <Home/>
            </Tab>
            <Tab eventKey="user" title="Users">
                <AdminDashboardPart
                    title="User admin"
                    Modal={EditUser}
                    url="/api/user"
                    List={UserList}
                />
            </Tab>
            <Tab eventKey="puzzle" title="Puzzles">
                <AdminDashboardPart
                    title="Puzzle admin"
                    Modal={EditPuzzle}
                    url="/api/sudoku"
                    List={PuzzleList}
                />
            </Tab>
        </Tabs>
    </Container>
};
const Home = () => {
    return (
        <div>
            <p>This is the admin dashboard. You can use this dashboard, as an administrator, to manage users and
                puzzles.</p>
            <p>You can use the tabs above to choose what you'd like to manage - this home page will contain guidance and
                information.</p>
            <p>There are three levels of permission: User, Moderator and Administrator.</p>
            <p>Users can create and solve puzzles. Moderators can delete other people's comments. Admins can do
                everything: Edit & Delete puzzles and users.</p>
        </div>
    );

};