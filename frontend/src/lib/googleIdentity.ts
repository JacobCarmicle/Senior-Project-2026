let googleScriptPromise: Promise<void> | null = null;

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
          }) => void) => void;
        };
      };
    };
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Identity script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity script."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function requestGoogleIdToken(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error("Missing Google client ID. Set VITE_GOOGLE_CLIENT_ID.");
  }

  await loadGoogleIdentityScript();

  const google = window.google;
  if (!google?.accounts?.id) {
    throw new Error("Google Identity Services is unavailable.");
  }

  return new Promise<string>((resolve, reject) => {
    let finished = false;
    const timeout = window.setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error("Google sign-in timed out. Please try again."));
      }
    }, 15000);

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);

        if (!response.credential) {
          reject(new Error("Google sign-in did not return a credential."));
          return;
        }

        resolve(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    google.accounts.id.prompt((notification) => {
      if (finished) return;

      if (notification.isNotDisplayed()) {
        finished = true;
        window.clearTimeout(timeout);
        reject(
          new Error(
            `Google sign-in could not be displayed (${notification.getNotDisplayedReason()}).`,
          ),
        );
        return;
      }

      if (notification.isSkippedMoment()) {
        finished = true;
        window.clearTimeout(timeout);
        reject(new Error(`Google sign-in was skipped (${notification.getSkippedReason()}).`));
      }
    });
  });
}
