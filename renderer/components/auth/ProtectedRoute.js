import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthPage from './AuthPage';
import LicenseInfo from './LicenseInfo';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requireLicense = false }) => {
  const { isAuthenticated, license, loading, isCheckingAuth } = useAuth();

  // Show loading state while checking authentication
  if (loading || isCheckingAuth) {
    return <LoadingSpinner />;
  }

  // If user is not authenticated, show login/register form
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // If license is required but not available or invalid, show license info
  if (requireLicense && (!license || license.status !== 'active')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              License Required
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              A valid license is required to access this feature.
            </p>
          </div>
          <LicenseInfo />
        </div>
      </div>
    );
  }

  // If authenticated and license is valid (if required), render protected content
  return children;
};

export default ProtectedRoute; 