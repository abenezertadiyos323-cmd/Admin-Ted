import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Utility component that resets scroll position to top
 * on every route transition. Ensures deep pages don't 
 * stay scrolled down when moving between inbox, inventory, etc.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate scroll on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Telegram might maintain its own viewport scroll, force body top too
    document.body.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}
