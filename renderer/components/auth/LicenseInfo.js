import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime as utilFormatDateTime } from '../../utils/i18nUtils';

const LicenseInfo = () => {
  const { t } = useTranslation();
  const { license, refreshLicense, isLoading } = useAuth();
  const [usage, setUsage] = useState({ accounts: 0, rooms: 0 });

  // Get current usage statistics
  useEffect(() => {
    const fetchUsage = async () => {
            try {
        // Get current account count
        const accountsResult = await window.tiktokAPI.getAccounts();
        const accountCount = Array.isArray(accountsResult) ? accountsResult.length : 0;

        // Get current active rooms count  
        const roomsResult = await window.tiktokAPI.getRooms();
        const allRooms = roomsResult?.success ? roomsResult.rooms || [] : [];
        const activeRooms = allRooms.filter(room => 
          room.status === 'running' || room.isLive
        );

        setUsage({
          accounts: accountCount,
          rooms: activeRooms.length
        });
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setUsage({ accounts: 0, rooms: 0 });
      }
    };

    if (license) {
      fetchUsage();
    }
  }, [license]);

  if (!license) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('license.messages.noLicense')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900';
      case 'expired':
        return 'text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900';
      case 'suspended':
        return 'text-orange-800 bg-orange-100 dark:text-orange-200 dark:bg-orange-900';
      case 'trial':
        return 'text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900';
      default:
        return 'text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-900';
    }
  };

  // Use utility function for consistent date formatting
  const formatDateTime = utilFormatDateTime;

  const getTimeRemaining = () => {
    if (!license.expiresAt) return null;
    const expiryDate = new Date(license.expiresAt);
    const now = new Date();
    const diffTime = expiryDate - now;
    
    if (diffTime <= 0) return { expired: true };
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      days: diffDays, 
      hours: diffHours, 
      minutes: diffMinutes,
      expired: false 
    };
  };

  const timeRemaining = getTimeRemaining();

  const getUsageColor = (current, limit) => {
    if (limit === 0) return 'text-gray-500';
    const percentage = current / limit;
    if (percentage >= 0.9) return 'text-red-600';
    if (percentage >= 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (current, limit) => {
    if (limit === 0) return 'bg-gray-400';
    const percentage = current / limit;
    if (percentage >= 0.9) return 'bg-red-500';
    if (percentage >= 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* License Information Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('license.info.title')}
          </h3>
          <button
            onClick={refreshLicense}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 disabled:opacity-50"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700 dark:text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {t('license.actions.refresh')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('license.info.name')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {license.name || license.type || 'N/A'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('license.info.status')}
            </dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                {t(`license.status.${license.status}`)}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('license.expiresAt')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDateTime(license.expiresAt)}
              {timeRemaining && !timeRemaining.expired && (
                <div className={`mt-1 text-xs ${timeRemaining.days <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                  {timeRemaining.days > 0 && t('license.daysRemaining', { days: timeRemaining.days })}
                  {timeRemaining.hours > 0 && ` ${t('license.hoursRemaining', { hours: timeRemaining.hours })}`}
                </div>
              )}
              {timeRemaining && timeRemaining.expired && (
                <div className="mt-1 text-xs text-red-600">
                  {t('license.expired')}
                </div>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('license.info.type')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {license.type || 'N/A'}
            </dd>
          </div>
        </div>

        {license.description && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('license.info.description')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {license.description}
            </dd>
          </div>
        )}
      </div>

      {/* Usage Limits Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('license.limits')}
        </h3>

        <div className="space-y-6">
          {/* Accounts Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('license.accountsUsed')}
              </span>
              <span className={`text-sm font-medium ${getUsageColor(usage.accounts, license.accounts || 0)}`}>
                {usage.accounts}/{license.accounts || 0}
              </span>
            </div>
            {(license.accounts || 0) > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(usage.accounts, license.accounts)}`}
                  style={{
                    width: `${Math.min((usage.accounts / (license.accounts || 1)) * 100, 100)}%`
                  }}
                />
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              {t('license.messages.accountLimit', { current: usage.accounts, max: license.accounts || 0 })}
            </div>
          </div>

          {/* Rooms Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('license.roomsUsed')}
              </span>
              <span className={`text-sm font-medium ${getUsageColor(usage.rooms, license.rooms || 0)}`}>
                {usage.rooms}/{license.rooms || 0}
              </span>
            </div>
            {(license.rooms || 0) > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(usage.rooms, license.rooms)}`}
                  style={{
                    width: `${Math.min((usage.rooms / (license.rooms || 1)) * 100, 100)}%`
                  }}
                />
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              {t('license.messages.roomLimit', { current: usage.rooms, max: license.rooms || 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Messages */}
      {license.status === 'expired' && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                {t('license.messages.expired')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Warning */}
      {((usage.accounts / (license.accounts || 1)) >= 0.9 || (usage.rooms / (license.rooms || 1)) >= 0.9) && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t('license.warnings.accountFeaturesDisabled')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseInfo; 