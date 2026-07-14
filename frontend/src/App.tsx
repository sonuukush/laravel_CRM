import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import DealsKanban from './pages/DealsKanban';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/register" 
        element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        
        {/* Core Layout Routes */}
        <Route 
          path="/dashboard" 
          element={
            <Layout>
              <Dashboard />
            </Layout>
          } 
        />
        <Route 
          path="/customers" 
          element={
            <Layout>
              <Customers />
            </Layout>
          } 
        />
        <Route 
          path="/leads" 
          element={
            <Layout>
              <Leads />
            </Layout>
          } 
        />
        <Route 
          path="/deals" 
          element={
            <Layout>
              <DealsKanban />
            </Layout>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <Layout>
              <Profile />
            </Layout>
          } 
        />

        {/* Manager & Admin Only Routes */}
        <Route element={<RoleRoute allowedRoles={['Admin', 'Manager']} />}>
          <Route 
            path="/reports" 
            element={
              <Layout>
                <Reports />
              </Layout>
            } 
          />
        </Route>

        {/* Admin Only Routes */}
        <Route element={<RoleRoute allowedRoles={['Admin']} />}>
          <Route 
            path="/users" 
            element={
              <Layout>
                <Users />
              </Layout>
            } 
          />
        </Route>

      </Route>

      {/* Catch-All redirect */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  );
}

export default App;
