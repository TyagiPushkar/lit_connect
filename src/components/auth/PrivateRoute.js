import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ element: Component, requiredRole, requiredRoles = [], ...rest }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    const allowed = requiredRole ? [requiredRole] : requiredRoles;

    // Allow access if user is authenticated and has one of the required roles
    if (user && (allowed.length === 0 || allowed.includes(user.role))) {
        return <Component {...rest} />;
    }

    return <Navigate to="/" />;
};

export default PrivateRoute;
