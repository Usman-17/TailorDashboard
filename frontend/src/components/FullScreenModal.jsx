import { X, ChevronLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSidebar } from "../context/SidebarContext";
import { AnimatePresence, motion as Motion } from "framer-motion";

const FullScreenModal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  showClose = true,
  showBack = true,
  actions,
}) => {
  const { isExpanded, isHovered } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsMobile(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Handle hardware / browser back button on mobile
  useEffect(() => {
    if (!open) return;

    const modalId = `fsmodal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    window.history.pushState({ modalOpen: true, modalId }, "");

    let isPoppedByBack = false;

    const handlePopState = () => {
      // If history state still has our modalId, a child dropdown/element was popped, not this modal
      if (window.history.state?.modalId === modalId) {
        return;
      }
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
  }, [open]);

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-[999999] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            className="absolute top-0 right-0 bottom-0 bg-white dark:bg-[#0d0a1d] text-gray-800 dark:text-gray-100 overflow-y-auto no-scrollbar pointer-events-auto"
            style={{
              left: isMobile ? 0 : isExpanded || isHovered ? 220 : 68,
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 bg-white dark:bg-[#120e24] z-10 shrink-0 border-b border-gray-200 dark:border-purple-500/20 shadow-xs">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {showBack && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="size-8 sm:size-9 -ml-1 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-700 dark:text-gray-200 transition-all cursor-pointer shrink-0"
                      aria-label="Back"
                    >
                      <ChevronLeft size={22} />
                    </button>
                  )}

                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                      {title}
                    </h2>

                    {subtitle && (
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-purple-300/70 font-medium -mt-1 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                    >
                      <X
                        size={18}
                        className="text-gray-500 dark:text-purple-300/70"
                      />
                    </button>
                  )}
                  {actions}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/40 dark:bg-[#0d0a1d]">
                {children}
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenModal;
