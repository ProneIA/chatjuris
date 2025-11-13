import AIAssistant from './pages/AIAssistant';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Cases from './pages/Cases';
import Documents from './pages/Documents';
import Templates from './pages/Templates';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Jurisprudence from './pages/Jurisprudence';
import Plans from './pages/Plans';
import Pricing from './pages/Pricing';
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
    "Jurisprudence": Jurisprudence,
    "Plans": Plans,
    "Pricing": Pricing,
}

export const pagesConfig = {
    mainPage: "AIAssistant",
    Pages: PAGES,
    Layout: Layout,
};