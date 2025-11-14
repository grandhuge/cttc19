
import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { FullPageLoader } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const PublicOnlyRoute: React.FC<ProtectedRouteProps> = () => {
  const { currentUser, userProfile, isLoading } = useAuthContext();

  if (isLoading) return <FullPageLoader />;
  
  if (currentUser) {
    const redirectPath = (userProfile?.role === 'admin' || userProfile?.role === 'sub-admin') ? '/admin' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export const UserRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { userProfile, isLoading } = useAuthContext();
  
  if (isLoading) return <FullPageLoader />;

  if (!userProfile || userProfile.role !== 'user') {
    return <Navigate to="/login" replace />;
  }
  
  return children ? <>{children}</> : <Outlet />;
};

export const AdminRoute: React.FC<ProtectedRouteProps> = () => {
  const { userProfile, isLoading } = useAuthContext();

  if (isLoading) return <FullPageLoader />;

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'sub-admin')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};