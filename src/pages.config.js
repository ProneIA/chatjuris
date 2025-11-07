import AIAssistant from './pages/AIAssistant';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Dashboard": Dashboard,
    "Clients": Clients,
}

export const pagesConfig = {
    mainPage: "AIAssistant",
    Pages: PAGES,
    Layout: Layout,
};