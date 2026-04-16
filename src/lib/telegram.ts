declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

export const initTelegram = () => {
  if (window.Telegram?.WebApp) {
    const webapp = window.Telegram.WebApp;
    webapp.ready();
    webapp.expand();
    // Enable swipe-to-close if available
    if (webapp.enableClosingConfirmation) {
      webapp.enableClosingConfirmation();
    }
  }
};

export const getTelegramInitData = () => {
  return window.Telegram?.WebApp?.initData || "";
};

export const getTelegramUser = () => {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  // Mock user for local development
  return {
    id: 12345678,
    first_name: "Admin",
    last_name: "Mock",
    username: "admin_mock",
    photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
  };
};

export const closeTelegram = () => {
  window.Telegram?.WebApp?.close();
};

export const showAlert = (message: string) => {
  window.Telegram?.WebApp?.showAlert(message);
};

export const showConfirm = (message: string, callback: (ok: boolean) => void) => {
  window.Telegram?.WebApp?.showConfirm(message, callback);
};

export const setHeaderColor = (color: string) => {
  window.Telegram?.WebApp?.setHeaderColor(color);
};
