// Локальные типы, чтобы не упираться в строгую союзную типизацию framer-motion на Netlify
type Easing = [number, number, number, number];

export const easeInOutQuart: Easing = [0.77, 0, 0.18, 1];

export const springGentle = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
  mass: 0.8,
};

export const staggerChildren = (delay = 0.06) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: delay }
  }
});

export const fadeUpBlur = {
  hidden: { opacity: 0, y: 12, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    // приведение типа нужно из-за союзного Transition в framer-motion
    // Используем unknown вместо any для большей типобезопасности
    transition: { duration: 0.7, ease: easeInOutQuart as unknown as [number, number, number, number] }
  }
};


