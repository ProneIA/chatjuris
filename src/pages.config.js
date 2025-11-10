import AIAssistant from './pages/AIAssistant';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Cases from './pages/Cases';
import Documents from './pages/Documents';
import Templates from './pages/Templates';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Cases": Cases,
    "Documents": Documents,
    "Templates": Templates,
    "Tasks": Tasks,
    "Calendar": Calendar,
}

export const pagesConfig = {
    mainPage: "AIAssistant",
    Pages: PAGES,
    Layout: Layout,
};