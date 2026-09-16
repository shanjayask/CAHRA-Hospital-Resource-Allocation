import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SimulationProvider } from '@/contexts/SimulationContext';
import { Layout, AccessRestricted } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { CommandCenterPage } from '@/pages/CommandCenterPage';
import { DemandPage } from '@/pages/DemandPage';
import { ExplanationPage } from '@/pages/ExplanationPage';
import { CapacityPage } from '@/pages/CapacityPage';
import { RipplePage } from '@/pages/RipplePage';
import { RadarPage } from '@/pages/RadarPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { AuditPage } from '@/pages/AuditPage';
import type { Role } from '@/types';

const ROUTE_ROLES: Record<string, Role[]> = {
  '/command-center': ['admin', 'doctor', 'staff', 'auditor'],
  '/demand-intelligence': ['admin', 'doctor', 'staff', 'auditor'],
  '/explainability': ['admin', 'doctor', 'auditor'],
  '/capacity-network': ['admin', 'doctor', 'staff'],
  '/resource-ripple': ['admin', 'doctor', 'staff'],
  '/collision-radar': ['admin', 'doctor', 'staff'],
  '/scenario-lab': ['admin', 'doctor', 'staff'],
  '/recommendations': ['admin', 'doctor', 'staff'],
  '/ai-audit': ['admin', 'auditor'],
};

function ProtectedRoute({ path, children }: { path: string; children: ReactNode }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 grid-bg flex items-center justify-center">
        <p className="text-navy-400 font-display">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = ROUTE_ROLES[path];
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <Layout>
        <AccessRestricted requiredRole={allowedRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(' / ')} />
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 grid-bg flex items-center justify-center">
        <p className="text-navy-400 font-display">Loading...</p>
      </div>
    );
  }

  return (
    <SimulationProvider>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/command-center" replace /> : <LoginPage />}
        />
        <Route path="/" element={<Navigate to="/command-center" replace />} />
        <Route path="/command-center" element={
          <ProtectedRoute path="/command-center"><CommandCenterPage /></ProtectedRoute>
        } />
        <Route path="/demand-intelligence" element={
          <ProtectedRoute path="/demand-intelligence"><DemandPage /></ProtectedRoute>
        } />
        <Route path="/explainability" element={
          <ProtectedRoute path="/explainability"><ExplanationPage /></ProtectedRoute>
        } />
        <Route path="/capacity-network" element={
          <ProtectedRoute path="/capacity-network"><CapacityPage /></ProtectedRoute>
        } />
        <Route path="/resource-ripple" element={
          <ProtectedRoute path="/resource-ripple"><RipplePage /></ProtectedRoute>
        } />
        <Route path="/collision-radar" element={
          <ProtectedRoute path="/collision-radar"><RadarPage /></ProtectedRoute>
        } />
        <Route path="/scenario-lab" element={
          <ProtectedRoute path="/scenario-lab"><ScenariosPage /></ProtectedRoute>
        } />
        <Route path="/recommendations" element={
          <ProtectedRoute path="/recommendations"><RecommendationsPage /></ProtectedRoute>
        } />
        <Route path="/ai-audit" element={
          <ProtectedRoute path="/ai-audit"><AuditPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/command-center" replace />} />
      </Routes>
    </SimulationProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
