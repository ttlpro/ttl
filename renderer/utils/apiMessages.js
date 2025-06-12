import i18n from '../i18n';

export const getApiMessage = (type, key, params = {}) => {
  const t = i18n.getFixedT(null, 'api');
  return t(`${type}.${key}`, params);
};

export const getSuccessMessage = (key, params = {}) => {
  return getApiMessage('success', key, params);
};

export const getErrorMessage = (key, params = {}) => {
  return getApiMessage('error', key, params);
};

export const getValidationMessage = (key, params = {}) => {
  return getApiMessage('validation', key, params);
};

export const getConfirmationMessage = (key, params = {}) => {
  return getApiMessage('confirmation', key, params);
};

export const getStatusMessage = (key, params = {}) => {
  return getApiMessage('status', key, params);
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return getErrorMessage('serverError');
  } else if (error.request) {
    // Network error
    return getErrorMessage('networkError');
  } else {
    // Unknown error
    return getErrorMessage('unknownError');
  }
}; 