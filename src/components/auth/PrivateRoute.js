import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ element: Component, requiredRoles = [], ...rest }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Allow access if user is authenticated and has one of the required roles
    if (user && (requiredRoles.length === 0 || requiredRoles.includes(user.role))) {
        return <Component {...rest} />;
    }

    return <Navigate to="/" />;
};

export default PrivateRoute;
