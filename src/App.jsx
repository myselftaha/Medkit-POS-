import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import API_URL from './config/api';
import Loader from './components/common/Loader';
import { USER_ROLES } from './config/roles';

import SyncManager from './components/common/SyncManager';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';

const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Home = lazy(() => import('./pages/Home'));
const History = lazy(() => import('./pages/History'));
const Medicines = lazy(() => import('./pages/Medicines'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Inventory = lazy(() => import('./pages/Inventory'));
const SupplierDetails = lazy(() => import('./pages/SupplierDetails'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Users = lazy(() => import('./pages/Users'));
const Customers = lazy(() => import('./pages/Customers'));
const Vouchers = lazy(() => import('./pages/Vouchers'));
const Return = lazy(() => import('./pages/Return'));
const Report = lazy(() => import('./pages/Report'));
const Staff = lazy(() => import('./pages/Staff'));
const CashDrawer = lazy(() => import('./pages/CashDrawer'));
const OwnerSetup = lazy(() => import('./pages/OwnerSetup'));
const LoaderDemo = lazy(() => import('./pages/LoaderDemo'));
const ExpiryManagement = lazy(() => import('./pages/ExpiryManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const EmailReports = lazy(() => import('./pages/EmailReports'));

const ROLE_REDIRECTS = {
  [USER_ROLES.OWNER]: '/dashboard',
  [USER_ROLES.STORE_MANAGER]: '/dashboard',
  [USER_ROLES.ADMIN]: '/dashboard',
  [USER_ROLES.SUPER_ADMIN]: '/dashboard',
  [USER_ROLES.PHARMACIST]: '/medicines',
  [USER_ROLES.COUNTER_SALESMAN]: '/pos',
  [USER_ROLES.ACCOUNTANT]: '/reports',
  [USER_ROLES.HELPER]: '/inventory',
};

function RootRedirect() {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user?.role) {
      return <Navigate to="/login" replace />;
    }

    const redirectPath = ROLE_REDIRECTS[user.role] || '/pos';
    return <Navigate to={redirectPath} replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  const [setupStatus, setSetupStatus] = useState({ isSetupCompleted: false, loading: true });

  useEffect(() => {
    const checkSetup = async () => {
      try {
        console.log('Checking system setup status...');
        const response = await fetch(`${API_URL}/api/system/status`);
        const data = await response.json();
        console.log('Setup status received:', data);
        setSetupStatus({ isSetupCompleted: data.isSetupCompleted, loading: false });
      } catch (err) {
        console.error('Failed to check setup status', err);
        setSetupStatus({ isSetupCompleted: true, loading: false });
      }
    };
    checkSetup();
  }, []);


  const isSetup = setupStatus.isSetupCompleted;

  if (setupStatus.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader type="spinner" size="lg" />
      </div>
    );
  }

  return (
    <SettingsProvider>
      <SyncManager>
        <NotificationProvider>
          <Router>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader type="spinner" size="lg" />
              </div>
            }>
              <Routes>
                {/* Setup & Login - Mutual Exclusivity based on setup status */}
                <Route
                  path="/setup"
                  element={isSetup ? <Navigate to="/login" replace /> : <OwnerSetup onComplete={() => setSetupStatus({ isSetupCompleted: true, loading: false })} />}
                />
                <Route
                  path="/login"
                  element={!isSetup ? <Navigate to="/setup" replace /> : <LoginPage />}
                />

                {/* Protected Routes - Only accessible if setup is completed */}
                <Route element={!isSetup ? <Navigate to="/setup" replace /> : <ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<RootRedirect />} />

                    {/* Dashboard: Owner, Manager */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="dashboard" element={<Dashboard />} />
                    </Route>

                    {/* Sales/POS: Owner, Manager, Pharmacist, Counter Salesman */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="pos" element={<Home />} />
                      <Route path="customers" element={<Customers />} />
                    </Route>

                    {/* Admin/Owner Restricted Routes */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="users" element={<Users />} />
                      <Route path="loaders" element={<LoaderDemo />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="email-reports" element={<EmailReports />} />
                    </Route>

                    {/* Staff: Owner, Manager */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="staff" element={<Staff />} />
                    </Route>

                    {/* Financial/Reports: Owner, Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="reports" element={<Report />} />
                    </Route>

                    {/* Vouchers, Cash Drawer: Owner, Manager, Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="vouchers" element={<Vouchers />} />
                      <Route path="cash-drawer" element={<CashDrawer />} />
                    </Route>

                    {/* Inventory/Medicines: Owner, Manager, Pharmacist */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="medicines" element={<Medicines />} />
                      <Route path="return" element={<Return />} />
                      <Route path="expiry" element={<ExpiryManagement />} />
                    </Route>

                    {/* Inventory View: Owner, Manager, Pharmacist, Helper */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.HELPER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="inventory" element={<Inventory />} />
                    </Route>

                    {/* Distributors: Owner, Manager, Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="suppliers" element={<Suppliers />} />
                      <Route path="suppliers/:id" element={<SupplierDetails />} />
                    </Route>

                    {/* History: Owner, Manager, Pharmacist, Salesman (Limited), Accountant */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ACCOUNTANT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="history" element={<History />} />
                    </Route>

                    {/* Notifications: Accessible to all authorized roles */}
                    <Route element={<ProtectedRoute roles={[USER_ROLES.OWNER, USER_ROLES.STORE_MANAGER, USER_ROLES.PHARMACIST, USER_ROLES.COUNTER_SALESMAN, USER_ROLES.ACCOUNTANT, USER_ROLES.HELPER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]} />}>
                      <Route path="notifications" element={<Notifications />} />
                    </Route>

                  </Route>
                </Route>
                {/* Global Catch-all */}
                <Route path="*" element={<Navigate to={isSetup ? "/" : "/setup"} replace />} />
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
      </SyncManager>
    </SettingsProvider>
  );
}

export default App;
