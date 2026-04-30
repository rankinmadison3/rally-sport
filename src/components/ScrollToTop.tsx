import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const main = document.getElementById("app-main-content");
    if (main) main.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
