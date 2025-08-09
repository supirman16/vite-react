import React from 'react';
import { motion } from 'framer-motion';

// Varian animasi untuk setiap kartu
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

interface AnimatedCardProps {
  children: React.ReactNode;
}

/**
 * Komponen pembungkus untuk memberikan animasi fade-in dan slide-up
 * pada elemen anak-anaknya.
 */
export default function AnimatedCard({ children }: AnimatedCardProps) {
  return (
    <motion.div variants={cardVariants}>
      {children}
    </motion.div>
  );
}
