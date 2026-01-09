/**
 * Global Error Handler Utility
 * Provides consistent error handling and logging across the application
 */

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

/**
 * Log error to console with formatting
 */
export const logError = (context: string, error: any): void => {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR ${timestamp}] ${context}:`, {
    message: error?.message || "Unknown error",
    code: error?.code,
    status: error?.response?.status,
    data: error?.response?.data,
    stack: error?.stack,
  });
};

/**
 * Extract user-friendly error message from various error types
 */
export const getErrorMessage = (error: any): string => {
  // Network errors
  if (error?.message?.includes("Network")) {
    return "Network connection failed. Please check your internet connection.";
  }

  // Timeout errors
  if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  // API errors
  if (error?.response?.status === 400) {
    return (
      error?.response?.data?.message ||
      "Invalid request. Please check your input."
    );
  }

  if (error?.response?.status === 401) {
    return "Authentication failed. Please sign in again.";
  }

  if (error?.response?.status === 403) {
    return "Access denied. You don't have permission for this action.";
  }

  if (error?.response?.status === 404) {
    return "Resource not found. It may have been deleted or moved.";
  }

  if (error?.response?.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (error?.response?.status >= 500) {
    return "Server error. Please try again later.";
  }

  // Appwrite errors
  if (error?.type) {
    switch (error.type) {
      case "user_already_exists":
        return "An account with this email already exists.";
      case "user_invalid_credentials":
        return "Invalid email or password.";
      case "user_not_found":
        return "User account not found.";
      case "document_not_found":
        return "Requested data not found.";
      case "document_already_exists":
        return "This item already exists.";
      default:
        return error.message || "An error occurred. Please try again.";
    }
  }

  // YouTube API errors
  if (error?.response?.data?.error?.errors) {
    const youtubeError = error.response.data.error.errors[0];
    if (youtubeError.reason === "quotaExceeded") {
      return "API quota exceeded. Please try again later.";
    }
    if (youtubeError.reason === "playlistNotFound") {
      return "Playlist not found or is private.";
    }
  }

  // Generic error message
  return error?.message || "An unexpected error occurred. Please try again.";
};

/**
 * Handle async operations with consistent error handling
 */
export const handleAsync = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await operation();
    return { data };
  } catch (error: any) {
    logError(context, error);

    const appError: AppError = {
      message: getErrorMessage(error),
      code: error?.code || error?.response?.status?.toString(),
      details: error?.response?.data || error,
      timestamp: new Date(),
    };

    if (fallback !== undefined) {
      return { data: fallback, error: appError };
    }

    return { error: appError };
  }
};

/**
 * Retry async operation with exponential backoff
 */
export const retryAsync = async <T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    context?: string;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    context = "Retry Operation",
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.log(
          `[${context}] Attempt ${
            attempt + 1
          } failed. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logError(`${context} (all retries failed)`, lastError);
  throw lastError;
};

/**
 * Validate required fields
 */
export const validateRequired = (
  fields: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missing: string[] } => {
  const missing = requiredFields.filter((field) => {
    const value = fields[field];
    return value === undefined || value === null || value === "";
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
};

/**
 * Safe JSON parse with fallback
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError("JSON Parse", error);
    return fallback;
  }
};

/**
 * Check if error is network related
 */
export const isNetworkError = (error: any): boolean => {
  return (
    !error?.response &&
    (error?.message?.includes("Network") ||
      error?.message?.includes("network") ||
      error?.code === "ECONNABORTED")
  );
};

/**
 * Check if error is authentication related
 */
export const isAuthError = (error: any): boolean => {
  return (
    error?.response?.status === 401 ||
    error?.type === "user_invalid_credentials" ||
    error?.type === "user_unauthorized"
  );
};
