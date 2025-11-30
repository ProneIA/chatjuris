import AIAssistant from './pages/AIAssistant';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Documents from './pages/Documents';
import Templates from './pages/Templates';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Jurisprudence from './pages/Jurisprudence';
import Plans from './pages/Plans';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Settings from './pages/Settings';
import Teams from './pages/Teams';
import TeamWorkspace from './pages/TeamWorkspace';
import PaymentSuccess from './pages/PaymentSuccess';
import LandingPage from './pages/LandingPage';
import QuemSomos from './pages/QuemSomos';
import Funcionalidades from './pages/Funcionalidades';
import ClientPortal from './pages/ClientPortal';
import DocumentsEnhanced from './pages/DocumentsEnhanced';
import LegalResearchAI from './pages/LegalResearchAI';
import LegalCalculator from './pages/LegalCalculator';
import DiaryMonitor from './pages/DiaryMonitor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Documents": Documents,
    "Templates": Templates,
    "Tasks": Tasks,
    "Calendar": Calendar,
    "Jurisprudence": Jurisprudence,
    "Plans": Plans,
    "Pricing": Pricing,
    "Contact": Contact,
    "Settings": Settings,
    "Teams": Teams,
    "TeamWorkspace": TeamWorkspace,
    "PaymentSuccess": PaymentSuccess,
    "LandingPage": LandingPage,
    "QuemSomos": QuemSomos,
    "Funcionalidades": Funcionalidades,
    "ClientPortal": ClientPortal,
    "DocumentsEnhanced": DocumentsEnhanced,
    "LegalResearchAI": LegalResearchAI,
    "LegalCalculator": LegalCalculator,
    "DiaryMonitor": DiaryMonitor,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};