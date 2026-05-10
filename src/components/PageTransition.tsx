"use client";

import React from 'react';
import { motion } from 'framer-motion';

const PageTransition: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
