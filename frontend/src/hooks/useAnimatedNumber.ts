import { useEffect } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";

export function useAnimatedNumber(
  target: number,
  decimals: number = 3
): MotionValue<string> {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));

  useEffect(() => {
    motionValue.set(target);
  }, [target, motionValue]);

  return display;
}
