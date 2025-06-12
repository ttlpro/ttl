import { getSuccessMessage, getErrorMessage } from './apiMessages';

export const handleApiResponse = (response, params = {}) => {
  if (!response) {
    return { type: 'error', message: getErrorMessage('unknownError') };
  }

  if (response.success) {
    if (response.successCode) {
      return { 
        type: 'success', 
        message: getSuccessMessage(response.successCode, params) 
      };
    }
    return { type: 'success', message: getSuccessMessage('operationSuccess') };
  } else {
    if (response.errorCode) {
      return { 
        type: 'error', 
        message: getErrorMessage(response.errorCode, params) 
      };
    }
    return { type: 'error', message: getErrorMessage('unknownError') };
  }
};

export const showResponseMessage = (response, params = {}) => {
  const result = handleApiResponse(response, params);
  // Show notification here
  return result;
}; 