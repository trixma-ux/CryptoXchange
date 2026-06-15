import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import NotFound from "@/pages/not-found";
import { useAuthStore } from "@/lib/store";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

import DashboardHome from "@/pages/dashboard/DashboardHome";
import WalletsPage from "@/pages/dashboard/WalletsPage";
import BuySellPage from "@/pages/dashboard/BuySellPage";
import SwapPage from "@/pages/dashboard/SwapPage";
import DepositPage from "@/pages/dashboard/DepositPage";
import WithdrawPage from "@/pages/dashboard/WithdrawPage";
import TransactionsPage from "@/pages/dashboard/TransactionsPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import SupportPage from "@/pages/dashboard/SupportPage";
import KycPage from "@/pages/dashboard/KycPage";

import AdminDashboardPage from "@/pages/admin/AdminDashboard";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminKycPage from "@/pages/admin/AdminKycPage";
import AdminTransactionsPage from "@/pages/admin/AdminTransactionsPage";
import AdminFeesPage from "@/pages/admin/AdminFeesPage";
import AdminCaissePage from "@/pages/admin/AdminCaissePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Redirect to="/auth/login" />;
  if (adminOnly && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardHome} />}
      </Route>
      <Route path="/dashboard/wallets">
        {() => <ProtectedRoute component={WalletsPage} />}
      </Route>
      <Route path="/dashboard/buy-sell">
        {() => <ProtectedRoute component={BuySellPage} />}
      </Route>
      <Route path="/dashboard/swap">
        {() => <ProtectedRoute component={SwapPage} />}
      </Route>
      <Route path="/dashboard/deposit">
        {() => <ProtectedRoute component={DepositPage} />}
      </Route>
      <Route path="/dashboard/withdraw">
        {() => <ProtectedRoute component={WithdrawPage} />}
      </Route>
      <Route path="/dashboard/transactions">
        {() => <ProtectedRoute component={TransactionsPage} />}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/dashboard/support">
        {() => <ProtectedRoute component={SupportPage} />}
      </Route>
      <Route path="/dashboard/kyc">
        {() => <ProtectedRoute component={KycPage} />}
      </Route>

      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboardPage} adminOnly />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsersPage} adminOnly />}
      </Route>
      <Route path="/admin/kyc">
        {() => <ProtectedRoute component={AdminKycPage} adminOnly />}
      </Route>
      <Route path="/admin/transactions">
        {() => <ProtectedRoute component={AdminTransactionsPage} adminOnly />}
      </Route>
      <Route path="/admin/fees">
        {() => <ProtectedRoute component={AdminFeesPage} adminOnly />}
      </Route>
      <Route path="/admin/caisse">
        {() => <ProtectedRoute component={AdminCaissePage} adminOnly />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
