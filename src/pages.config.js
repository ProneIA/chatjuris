/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import AboutUs from './pages/AboutUs';
import AffiliatesDashboard from './pages/AffiliatesDashboard';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import CaseDetails from './pages/CaseDetails';
import Cases from './pages/Cases';
import Checkout from './pages/Checkout';
import ClientAccess from './pages/ClientAccess';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import ColaboracaoHub from './pages/ColaboracaoHub';
import Contact from './pages/Contact';
import ContactPublic from './pages/ContactPublic';
import Dashboard from './pages/Dashboard';
import DiarioMonitor from './pages/DiarioMonitor';
import DiaryMonitor from './pages/DiaryMonitor';
import DocumentGenerator from './pages/DocumentGenerator';
import DocumentGeneratorChat from './pages/DocumentGeneratorChat';
import DocumentManager from './pages/DocumentManager';
import Documentation from './pages/Documentation';
import Documents from './pages/Documents';
import DocumentsEnhanced from './pages/DocumentsEnhanced';
import Features from './pages/Features';
import FerramentasHub from './pages/FerramentasHub';
import FinancialDashboard from './pages/FinancialDashboard';
import Funcionalidades from './pages/Funcionalidades';
import GestaoHub from './pages/GestaoHub';
import Home from './pages/Home';
import Jurisprudence from './pages/Jurisprudence';
import LandingPage from './pages/LandingPage';
import LegalCalculator from './pages/LegalCalculator';
import LegalResearch from './pages/LegalResearch';
import LegalResearchAI from './pages/LegalResearchAI';
import Library from './pages/Library';
import MyData from './pages/MyData';
import MySubscription from './pages/MySubscription';
import OfertaEspecial from './pages/OfertaEspecial';
import PaymentSuccess from './pages/PaymentSuccess';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import QuemSomos from './pages/QuemSomos';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import TeamWorkspace from './pages/TeamWorkspace';
import Teams from './pages/Teams';
import Templates from './pages/Templates';
import TermsOfService from './pages/TermsOfService';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "AboutUs": AboutUs,
    "AffiliatesDashboard": AffiliatesDashboard,
    "Analytics": Analytics,
    "Calendar": Calendar,
    "CaseDetails": CaseDetails,
    "Cases": Cases,
    "Checkout": Checkout,
    "ClientAccess": ClientAccess,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "ColaboracaoHub": ColaboracaoHub,
    "Contact": Contact,
    "ContactPublic": ContactPublic,
    "Dashboard": Dashboard,
    "DiarioMonitor": DiarioMonitor,
    "DiaryMonitor": DiaryMonitor,
    "DocumentGenerator": DocumentGenerator,
    "DocumentGeneratorChat": DocumentGeneratorChat,
    "DocumentManager": DocumentManager,
    "Documentation": Documentation,
    "Documents": Documents,
    "DocumentsEnhanced": DocumentsEnhanced,
    "Features": Features,
    "FerramentasHub": FerramentasHub,
    "FinancialDashboard": FinancialDashboard,
    "Funcionalidades": Funcionalidades,
    "GestaoHub": GestaoHub,
    "Home": Home,
    "Jurisprudence": Jurisprudence,
    "LandingPage": LandingPage,
    "LegalCalculator": LegalCalculator,
    "LegalResearch": LegalResearch,
    "LegalResearchAI": LegalResearchAI,
    "Library": Library,
    "MyData": MyData,
    "MySubscription": MySubscription,
    "OfertaEspecial": OfertaEspecial,
    "PaymentSuccess": PaymentSuccess,
    "Pricing": Pricing,
    "PrivacyPolicy": PrivacyPolicy,
    "QuemSomos": QuemSomos,
    "Reports": Reports,
    "Settings": Settings,
    "Tasks": Tasks,
    "TeamWorkspace": TeamWorkspace,
    "Teams": Teams,
    "Templates": Templates,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};