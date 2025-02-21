'use client';

import { motion } from 'framer-motion';
import { Break, OptimizationStats, OptimizedDay } from '@/types';
import { OptimizationStatsComponent } from '@/components/features/OptimizationStatsComponent';
import { BreakDetails } from '@/components/features/BreakDetails';
import { CalendarView } from '@/components/features/CalendarView';
import { forwardRef } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Component Props Types
interface ResultsDisplayProps {
  optimizedDays: OptimizedDay[];
  breaks: Break[];
  stats: OptimizationStats;
}

export const ResultsDisplay = forwardRef<HTMLDivElement, ResultsDisplayProps>(
  ({ optimizedDays, breaks, stats }, ref) => {
    return (
      <motion.div
        ref={ref}
        className="space-y-8"
        initial="hidden"
        animate="show"
        variants={container}
      >
        {/* Summary Section */}
        <OptimizationStatsComponent stats={stats} />

        {/* Break Details */}
        <BreakDetails breaks={breaks} />

        {/* Calendar View */}
        <CalendarView optimizedDays={optimizedDays} stats={stats} />
      </motion.div>
    );
  }
);

ResultsDisplay.displayName = 'ResultsDisplay';