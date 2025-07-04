import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import App from "./App";
import DarthVader from "./DarthVader";
import starwarsBg from "./assets/starwars-bg.jpg";

const pageVariants = {
  initial: { opacity: 0, scale: 1.2, rotateX: 45 },
  animate: { opacity: 1, scale: 1, rotateX: 0 },
  exit: { opacity: 0, scale: 0.8, rotateX: -45 },
};

const pageTransition = { duration: 1, ease: "easeInOut" };

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              className="min-h-screen bg-black bg-cover bg-center"
              style={{ backgroundImage: `url(${starwarsBg})` }}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <App />
            </motion.div>
          }
        />
        <Route
          path="/darth-vader"
          element={
            <motion.div
              className="min-h-screen bg-black bg-cover bg-center"
              style={{ backgroundImage: `url(${starwarsBg})` }}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <DarthVader />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
