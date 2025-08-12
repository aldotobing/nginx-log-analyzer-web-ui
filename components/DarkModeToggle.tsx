import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DarkModeToggleProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function DarkModeToggle({
  isDarkMode,
  toggleDarkMode,
}: DarkModeToggleProps) {
  return (
    <motion.button
      onClick={toggleDarkMode}
      className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 overflow-hidden"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDarkMode ? "sun" : "moon"}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-5 h-5 flex items-center justify-center"
        >
          {isDarkMode ? (
            <Sun size={20} className="text-yellow-300" />
          ) : (
            <Moon size={20} className="text-gray-700" />
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Background overlay for smooth transition */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 dark:from-blue-600 dark:to-purple-700 opacity-0 dark:opacity-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isDarkMode ? 0.1 : 0,
          transition: { duration: 0.6, ease: "easeInOut" }
        }}
      />
    </motion.button>
  );
}
