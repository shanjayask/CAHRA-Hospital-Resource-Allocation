import { ReactNode, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Brain, Network, Waves, Radar, FlaskConical,
  Lightbulb, ScrollText, Activity, ChevronDown, LogOut, User as UserIcon,
  Settings, History, ShieldAlert, RotateCcw,
} from 'lucide-react';
import { NAV_ITEMS, ROLES } from '@/data/demoData';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { ScenarioActiveTag, Toast } from '@/components/ui/Primitives';

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, TrendingUp, Brain, Network, Waves, Radar, FlaskConical, Lightbulb, ScrollText,
};

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { active, scenarioLabel, resetSimulation } = useSimulation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showResetToast, setShowResetToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? 'admin';
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const currentRole = ROLES.find((r) => r.key === role)!;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetSimulation = () => {
    resetSimulation();
    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 3000);
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-navy-50 grid-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-navy-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-sm text-navy-900 leading-tight">
                AI Hospital Command Center
              </h1>
              <p className="text-[10px] text-navy-400 leading-tight">Constraint-Aware Multimodal AI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {active && (
              <button
                onClick={handleResetSimulation}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-navy-600 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors"
                title="Reset simulation to baseline"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            {active && <ScenarioActiveTag label={scenarioLabel ?? undefined} className="hidden sm:inline-flex" />}

            {/* User profile menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-navy-900 leading-tight">{user?.full_name}</p>
                  <p className="text-[10px] text-navy-400 leading-tight uppercase tracking-wider">{currentRole.label}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-navy-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-navy-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-navy-50">
                    <p className="text-sm font-semibold text-navy-900">{user?.full_name}</p>
                    <p className="text-xs text-navy-400">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="pill bg-navy-50 text-navy-600 text-[10px]">{currentRole.label}</span>
                      <span className="text-[10px] text-navy-400">{user?.department}</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-navy-600 hover:bg-navy-50 transition-colors">
                      <UserIcon className="w-4 h-4 text-navy-400" /> Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-navy-600 hover:bg-navy-50 transition-colors">
                      <Settings className="w-4 h-4 text-navy-400" /> Account Settings
                    </button>
                    <button
                      onClick={() => { navigate('/ai-audit'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-navy-600 hover:bg-navy-50 transition-colors"
                    >
                      <History className="w-4 h-4 text-navy-400" /> AI Decision History
                    </button>
                  </div>
                  <div className="border-t border-navy-50 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-16 lg:w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin border-r border-navy-100 bg-white/50 py-4">
          <nav className="space-y-1 px-2 lg:px-3">
            {visibleNav.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-navy-900 text-white'
                        : 'text-navy-500 hover:bg-navy-50 hover:text-navy-700'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0 mx-auto lg:mx-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          {children}
        </main>
      </div>

      <Toast message="Simulation reset. Hospital state restored to baseline." visible={showResetToast} />
    </div>
  );
}

export function AccessRestricted({ requiredRole }: { requiredRole: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center text-navy-300 mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="font-display font-bold text-2xl text-navy-900">Access Restricted</h1>
      <p className="text-sm text-navy-500 mt-2 max-w-md">
        Your current role does not have access to this section. This area requires{' '}
        <span className="font-semibold text-navy-700">{requiredRole}</span> privileges.
        Please contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}
