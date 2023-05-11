import './css/App.css';
import Game from "./SudokuApp"
import Creator from "./SudokuCreatorApp"
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import LoginForm from './loginForm';
import RegistrationForm from './registrationForm';
import NotFound from "./components/404NotFound";
import OAuthLogin from "./oAuthLogin";
import Browser from "./browser";
import Nav from "./Nav";
import LightsOutCreator from './LightsOutAppCreator';
import LightsOut from './LightsOutApp';
import {Authenticated} from "./components/UserContext";
import {ProfilePage} from "./components/ProfilePage";
import {AdminHome} from "./components/admin";
import Quests from "./components/quests";
import {CreateQuest} from "./components/quests/create";
import Leaderboard from "./components/LeaderBoard";
import ImportComponent from "./components/ImportComponent";
import {ErrorBoundary} from "./components/ErrorBoundary";
import AlertHandler from "./components/Alert";


/*
  The app itself.

 */
const Page = ({children}) => <Authenticated>
    <Nav/>
    {children}
</Authenticated>

function App() {
    return (

        <BrowserRouter>
            <ErrorBoundary>
                <AlertHandler>
                <Routes>
                    <Route path="/" element={<Navigate to="/login"/>}/>
                    <Route path="registration" element={<RegistrationForm/>}/>
                    <Route path="login" element={<Authenticated allowLoggedOut={true}><LoginForm/></Authenticated>}/>
                    <Route path="sudoku" element={<Page><Game/></Page>}/>
                    <Route path="leaderboard" element={<Authenticated><Nav/><Leaderboard/></Authenticated>}/>
                    <Route path="import" element={<Authenticated><Nav/><ImportComponent/></Authenticated>}/>
                    <Route path="creator" element={<Page><Creator/></Page>}/>
                    <Route path="lightsout" element={<><Page><LightsOut/></Page></>}/>
                    <Route path="lightsoutcreator" element={<><Page><LightsOutCreator/></Page></>}/>
                    <Route path="oauth" element={<><Nav/><OAuthLogin/></>}/>
                    <Route path="profile" element={<Page><ProfilePage/></Page>}/>
                    <Route path="profile/:id" element={<Page><ProfilePage/></Page>}/>
                    <Route path="admin" element={<Page><AdminHome/></Page>}/>
                    <Route path="browser" element={
                        <Page>
                            <Browser/>
                        </Page>
                    }/>
                    <Route path="quests" element={
                        <Page>
                            <Quests/>
                        </Page>
                    }/>

                    <Route path="quests/create" element={
                        <Page>
                            <CreateQuest/>
                        </Page>
                    }/>
                    <Route path="*" element={
                        <>
                            <Nav/>
                            <NotFound/>
                        </>

                    }/>
                </Routes>
                </AlertHandler>
                </ErrorBoundary>
        </BrowserRouter>


    );
}

export default App;
