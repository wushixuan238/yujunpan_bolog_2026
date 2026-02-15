import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Custom bezier for smooth organic feel
            className={className}
        >
            {children}
        </motion.div>
    );
};
