import { getApiMessage } from '../../utils/apiMessages';

export const showApiMessage = (response, type = 'success') => {
  if (response.code) {
    const message = getApiMessage(type, response.code, response.params);
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  } else if (response.message) {
    // Fallback cho old format
    if (type === 'success') {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  }
};

// Usage example:
// showApiMessage(result, result.success ? 'success' : 'error'); 