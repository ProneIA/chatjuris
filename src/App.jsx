import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LGPDAudit from './pages/LGPDAudit';
import LGPDCompliance from './pages/LGPDCompliance';
import LexIA from './pages/LexIA';
import AdminPanel from './pages/AdminPanel';
import AdminMaster from './pages/AdminMaster';
import AdminDatabase from './pages/AdminDatabase';
import AdminSubscriptions from './pages/AdminSubscriptions';
import SystemAudit from './pages/SystemAudit';
import AffiliatesDashboard from './pages/AffiliatesDashboard';
import WhatsAppBot from './pages/WhatsAppBot';
import JusTrackDashboard from './pages/JusTrackDashboard';
import JusTrackPesquisa from './pages/JusTrackPesquisa';
import JusTrackProcessos from './pages/JusTrackProcessos';
import JusTrackNovo from './pages/JusTrackNovo';
import JusTrackDetalhes from './pages/JusTrackDetalhes';
import JusTrackEditar from './pages/JusTrackEditar';
import JusTrackOAB from './pages/JusTrackOAB';
import JusTrackConfiguracoes from './pages/JusTrackConfiguracoes';
import WhatsAppConnect from './pages/WhatsAppConnect';
import AgentSettings from './pages/AgentSettings';
import WhatsAppConversations from './pages/WhatsAppConversations';
import WebhookTest from './pages/WebhookTest';
import CalculadoraJuridica from './pages/CalculadoraJuridica';
import CriarSenha from './pages/CriarSenha';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      {/* ── ROTAS RESTRITAS A ADMIN ── */}
      <Route path="/LGPDAudit" element={
        <LayoutWrapper currentPageName="LGPDAudit">
          <ProtectedAdminRoute><LGPDAudit /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/LGPDCompliance" element={
        <LayoutWrapper currentPageName="LGPDCompliance">
          <ProtectedAdminRoute><LGPDCompliance /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/AdminPanel" element={
        <LayoutWrapper currentPageName="AdminPanel">
          <ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/AdminMaster" element={
        <LayoutWrapper currentPageName="AdminMaster">
          <ProtectedAdminRoute><AdminMaster /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/AdminDatabase" element={
        <LayoutWrapper currentPageName="AdminDatabase">
          <ProtectedAdminRoute><AdminDatabase /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/AdminSubscriptions" element={
        <LayoutWrapper currentPageName="AdminSubscriptions">
          <ProtectedAdminRoute><AdminSubscriptions /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/SystemAudit" element={
        <LayoutWrapper currentPageName="SystemAudit">
          <ProtectedAdminRoute><SystemAudit /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/AffiliatesDashboard" element={
        <LayoutWrapper currentPageName="AffiliatesDashboard">
          <ProtectedAdminRoute><AffiliatesDashboard /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/WhatsAppBot" element={
        <LayoutWrapper currentPageName="WhatsAppBot">
          <ProtectedAdminRoute><WhatsAppBot /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/WhatsAppConnect" element={
        <LayoutWrapper currentPageName="WhatsAppConnect">
          <ProtectedAdminRoute><WhatsAppConnect /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/conversations" element={
        <LayoutWrapper currentPageName="WhatsAppConversations">
          <ProtectedAdminRoute><WhatsAppConversations /></ProtectedAdminRoute>
        </LayoutWrapper>
      } />
      <Route path="/LexIA" element={
        <LexIA />
      } />
      <Route path="/JusTrackDashboard" element={<ProtectedRoute><JusTrackDashboard /></ProtectedRoute>} />
      <Route path="/JusTrackOAB" element={<ProtectedRoute><JusTrackOAB /></ProtectedRoute>} />
      <Route path="/JusTrackPesquisa" element={<ProtectedRoute><JusTrackPesquisa /></ProtectedRoute>} />
      <Route path="/JusTrackProcessos" element={<ProtectedRoute><JusTrackProcessos /></ProtectedRoute>} />
      <Route path="/JusTrackNovo" element={<ProtectedRoute><JusTrackNovo /></ProtectedRoute>} />
      <Route path="/JusTrackDetalhes" element={<ProtectedRoute><JusTrackDetalhes /></ProtectedRoute>} />
      <Route path="/JusTrackEditar" element={<ProtectedRoute><JusTrackEditar /></ProtectedRoute>} />
      <Route path="/JusTrackConfiguracoes" element={<ProtectedRoute><JusTrackConfiguracoes /></ProtectedRoute>} />
      <Route path="/AgentSettings" element={<LayoutWrapper currentPageName="AgentSettings"><ProtectedAdminRoute><AgentSettings /></ProtectedAdminRoute></LayoutWrapper>} />
      <Route path="/webhook-test" element={<LayoutWrapper currentPageName="WebhookTest"><ProtectedAdminRoute><WebhookTest /></ProtectedAdminRoute></LayoutWrapper>} />
      <Route path="/CalculadoraJuridica" element={<ProtectedRoute><CalculadoraJuridica /></ProtectedRoute>} />
      <Route path="/criar-senha" element={<CriarSenha />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App