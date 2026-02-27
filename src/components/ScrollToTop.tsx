import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Always reset window scroll
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    // Reset common inner scroll containers if the app uses them
    const containers = [
      document.querySelector("[data-scroll-container='true']"),
      document.querySelector(".scroll-container"),
      document.querySelector(".page-scroll"),
      document.querySelector("main"),
      document.querySelector("#root"),
    ].filter(Boolean) as HTMLElement[];

    for (const el of containers) {
      try {
        el.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
        el.scrollTop = 0;
      } catch {}
    }
  }, [pathname, search]);

  return null;
}
