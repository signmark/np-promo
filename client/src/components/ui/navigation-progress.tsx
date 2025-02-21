import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

interface NavigationProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function NavigationProgress({ currentStep, totalSteps }: NavigationProgressProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      width: `${((currentStep + 1) / totalSteps) * 100}%`,
      transition: { duration: 0.5, ease: "easeOut" },
    });
  }, [currentStep, totalSteps, controls]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-secondary">
        <motion.div
          className="h-full bg-primary origin-left"
          initial={{ width: "0%" }}
          animate={controls}
        />
      </div>
    </div>
  );
}