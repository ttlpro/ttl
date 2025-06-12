import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime as utilFormatDateTime } from '../../utils/i18nUtils';

const UserProfile = () => {
  const { t } = useTranslation();
  const { user, license, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [usage, setUsage] = useState({ accounts: 0, rooms: 0 });
  const dropdownRef = useRef(null);

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

    if (license && isOpen) {
      fetchUsage();
    }
  }, [license, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'expired':
        return 'text-red-600';
      case 'suspended':
        return 'text-orange-600';
      case 'trial':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTimeRemaining = () => {
    if (!license?.expiresAt) return null;
    const expiryDate = new Date(license.expiresAt);
    const now = new Date();
    const diffTime = expiryDate - now;
    
    if (diffTime <= 0) return { expired: true };
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { 
      days: diffDays, 
      hours: diffHours,
      expired: false 
    };
  };

  const timeRemaining = getTimeRemaining();

  // Use utility function for consistent date formatting
  const formatDateTime = utilFormatDateTime;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.name || user?.username}
          </div>
          {license && (
            <div className={`text-xs ${getStatusColor(license.status)}`}>
              {t(`license.status.${license.status}`)}
              {timeRemaining && !timeRemaining.expired && timeRemaining.days <= 30 && (
                <span className="ml-1">
                  ({timeRemaining.days}d {timeRemaining.hours}h)
                </span>
              )}
            </div>
          )}
        </div>
        <svg
          className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || user?.username}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </div>
                  {user?.loginTime && (
                    <div className="text-xs text-gray-400">
                      {t('auth.user.loginTime', { 
                        time: formatDateTime(user.loginTime)
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* License Info Section */}
            {license && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {t('license.title')}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {t('license.info.status')}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(license.status)}`}>
                      {t(`license.status.${license.status}`)}
                    </span>
                  </div>
                  
                  {license.name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {t('license.info.name')}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {license.name}
                      </span>
                    </div>
                  )}

                  {license.expiresAt && (
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {t('license.info.expiresAt')}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDateTime(license.expiresAt)}
                        </span>
                      </div>
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
                    </div>
                  )}

                  {/* Accounts Usage Progress */}
                  {license.accounts !== undefined && license.accounts > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {t('license.accountsUsed')}
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {usage.accounts}/{license.accounts}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            usage.accounts >= license.accounts
                              ? 'bg-red-600'
                              : usage.accounts / license.accounts > 0.8
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              (usage.accounts / license.accounts) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rooms Usage Progress */}
                  {license.rooms !== undefined && license.rooms > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {t('license.roomsUsed')}
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white">
                          {usage.rooms}/{license.rooms}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            usage.rooms >= license.rooms
                              ? 'bg-red-600'
                              : usage.rooms / license.rooms > 0.8
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              (usage.rooms / license.rooms) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('auth.logout.loading')}
                  </div>
                ) : (
                  t('auth.logout.title')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 