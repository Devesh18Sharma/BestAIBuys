const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initGA() {
  if (initialized || !GA_ID || GA_ID === "G-XXXXXXXXXX" || import.meta.env.DEV) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

  initialized = true;
}

function gtag(...args: unknown[]) {
  if (!initialized) return;
  window.gtag(...args);
}

export function trackScreenView(screenName: string) {
  gtag("event", "screen_view", { screen_name: screenName });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  gtag("event", eventName, params);
}
