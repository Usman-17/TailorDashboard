import { useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const CustomModal = ({
  isOpen,
  onClose,
  isDarkMode: isDarkModeProp,
  className = "w-[90%] max-w-lg",
  fullScreen = false,
  children,
}) => {
  const themeContext = useTheme();
  const isDarkMode = isDarkModeProp ?? themeContext?.isDarkMode ?? false;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Handle hardware / browser back button on mobile
  useEffect(() => {
    if (!isOpen) return;

    const modalId = `modal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    window.history.pushState({ modalOpen: true, modalId }, "");

    let isPoppedByBack = false;

    const handlePopState = () => {
      isPoppedByBack = true;
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (
        !isPoppedByBack &&
        window.history.state?.modalOpen &&
        window.history.state?.modalId === modalId
      ) {
        window.history.back();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const container = document.getElementById("main-scroll-container");

    const scrollY = window.scrollY;

    if (container) container.style.overflow = "hidden";

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      if (container) container.style.overflow = "";

      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className={`fixed inset-0 z-[999999] flex items-center justify-center backdrop-blur-sm ${
            isDarkMode ? "bg-black/50" : "bg-black/20"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Motion.div
            className={`${fullScreen ? "w-full h-full rounded-none overflow-hidden" : className + " rounded-xl overflow-y-auto px-3 py-6 sm:px-6"} shadow-2xl border no-scrollbar ${
              isDarkMode
                ? "bg-[#1A162B] text-white border-white/10"
                : "bg-white text-gray-800 border-gray-200"
            }`}
            initial={{
              opacity: 0,
              scale: fullScreen ? 1 : 0.95,
              y: fullScreen ? 0 : 20,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: fullScreen ? 1 : 0.95,
              y: fullScreen ? 0 : 20,
            }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {children}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomModal;
