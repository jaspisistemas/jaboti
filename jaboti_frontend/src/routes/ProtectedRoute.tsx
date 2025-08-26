import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState } from '../redux/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const selectedCompany = useSelector((state: RootState) => state.auth.user?.selectedCompany);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (selectedCompany == null) return <Navigate to="/selecionar-empresa" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
