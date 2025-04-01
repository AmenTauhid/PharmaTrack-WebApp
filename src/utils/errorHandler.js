/**
 * Logs errors to console and could be extended to send errors to a service
 * like Sentry or Firebase Crashlytics
 */
export const logError = (error, source = 'Unknown', additionalInfo = {}) => {
  console.error(`Error in ${source}:`, error);
  
  // Add any external error reporting here
  // For example: Sentry.captureException(error, { extra: { source, ...additionalInfo } });
  
  return error;
};

/**
 * Formats Firebase error messages for user display
 */
export const formatFirebaseError = (error) => {
  if (!error || !error.code) {
    return 'An unknown error occurred';
  }
  
  const errorCode = error.code;
  
  // Auth errors
  switch (errorCode) {
    // Auth errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email format.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please use a different email.';
      
    // Firestore errors
    case 'permission-denied':
      return 'You do not have permission to access this data.';
    case 'unavailable':
      return 'The service is currently unavailable. Please try again later.';
    case 'not-found':
      return 'The requested document was not found.';
      
    // Default
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

/**
 * A wrapped fetch function that handles errors
 */
export const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    logError(error, 'fetchWithErrorHandling', { url, options });
    throw error;
  }
};