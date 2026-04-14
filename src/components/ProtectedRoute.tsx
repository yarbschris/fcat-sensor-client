import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) =>
    (isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />);
