
import React, { useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AdminRoute, PublicOnlyRoute, UserRoute } from './components/routing/ProtectedRoutes';

import Header from './components/common/Header';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/user/DashboardPage';
import ProfilePage from './pages/user/ProfilePage';
import CoursePage from './pages/user/CoursePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CourseEditorPage from './pages/admin/CourseEditorPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import NotFoundPage from './pages/shared/NotFoundPage';

// --- Notification System ---
interface NotificationState {
  message: string;
  type: 'success' | 'error';
}

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const Notification: React.FC<{ notification: NotificationState | null, onClose: () => void }> = ({ notification, onClose }) => {
  if (!notification) return null;

  const baseClasses = "fixed top-20 right-5 z-50 px-6 py-4 rounded-lg shadow-lg text-white transition-opacity duration-300";
  const typeClasses = notification.type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <span>{notification.message}</span>
      <button onClick={onClose} className="ml-4 font-bold">X</button>
    </div>
  );
};

const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  }, []);

  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </NotificationContext.Provider>
  );
};
// --- End Notification System ---

const AppLayout = () => (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Header />
        <main className="flex-grow">
            <Outlet />
        </main>
        <footer className="py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            © developed by Tle Narongphisit | CTTC Suratthani @ CPD.go.th
        </footer>
    </div>
);

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <HashRouter>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<AppLayout />}>
                 {/* User Routes */}
                <Route path="/" element={
                  <UserRoute>
                    <DashboardPage />
                  </UserRoute>
                } />
                 <Route path="/course/:courseId" element={
                  <UserRoute>
                    <CoursePage />
                  </UserRoute>
                } />
                <Route path="/profile" element={
                  <UserRoute>
                    <ProfilePage />
                  </UserRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route index element={<AdminDashboardPage />} />
                   <Route path="course/:courseId" element={<CourseEditorPage />} />
                   <Route path="users" element={<UserManagementPage />} />
                </Route>

                 <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;