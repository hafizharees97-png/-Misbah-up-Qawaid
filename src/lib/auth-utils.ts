import { GenerateContentResponse } from "@google/generative-ai";

const CLIENT_ID = (import.meta as any).env.VITE_CLIENT_ID || '';
const OAUTH_URL = window.location.origin + '/oauth-redirect.html';
const SCOPE = 'https://www.googleapis.com/auth/generative-language.peruserquota';
const AUTH_POPUP_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_URL)}&response_type=token&scope=${encodeURIComponent(SCOPE)}`;
const SIGNIN_TIMEOUT = 60000; // 60 seconds

/**
 * Opens a popup for Google OAuth and returns a promise that resolves with the
 * access token. Rejects if the user doesn't sign in within the timeout period.
 */
export const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const authWindow = window.open(AUTH_POPUP_URL, 'google-signin', 'width=600,height=700');

    if (!authWindow) {
      reject(new Error('پاپ اپ بلاک کر دیا گیا ہے۔ براہ کرم اپنے براؤزر یا ایپ کی سیٹنگز میں پاپ اپس (Popups) کی اجازت دیں۔'));
      return;
    }

    let timeoutId: number | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('message', handleAuthMessage);
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
    };

    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'oauth_success' && event.data.response.access_token) {
        cleanup();
        resolve(event.data.response.access_token);
      }
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Sign-in timed out. Please try again.'));
    }, SIGNIN_TIMEOUT);

    window.addEventListener('message', handleAuthMessage);
  });
};

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
* Calls the Gemini API using the per-user quota endpoint.
* @param accessToken The user's OAuth access token.
* @param request The model and contents for the request
* @param additionalConfig Additional configuration options to pass as part of the body of the request
* @return The JSON response from the API.
*/
export const generateContent = async (accessToken: string, request: { model: string, contents: any }, additionalConfig?: any): Promise<Omit<GenerateContentResponse, 'text' | 'data' | 'functionCalls' | 'executableCode' | 'codeExecutionResult'>> => {
  const url = `https://generativelanguage.googleapis.com/v1alpha/models/${request.model}:generateContentPerUserQuota?access_token=${accessToken}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...additionalConfig, contents: request.contents }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData);

    if (response.status === 429 || errorData.error?.status === 'RESOURCE_EXHAUSTED') {
      throw new QuotaExceededError(errorData.error?.message || 'Quota exceeded. Please upgrade.');
    }

    throw new Error(errorData.error?.message || 'Failed to get a response from the API.');
  }

  return response.json();
};
