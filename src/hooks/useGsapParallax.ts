import { useEffect, useState } from 'react';

export function useGsapParallax(ref: React.RefObject<HTMLElement | null>, amount = 10) {
  const [gsapLoaded, setGsapLoaded] = useState(false);

  useEffect(() => {
    // Проверяем, является ли устройство мобильным
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    
    // На мобильных устройствах не загружаем GSAP
    if (isMobile) {
      return;
    }

    // Динамический импорт GSAP только на desktop
    let gsapContext: any = null;
    let isMounted = true;

    const loadGsap = async () => {
      try {
        const [gsapModule, scrollTriggerModule] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger')
        ]);

        const gsap = gsapModule.default;
        const ScrollTrigger = scrollTriggerModule.default;

        gsap.registerPlugin(ScrollTrigger);

        if (!isMounted) return;

        setGsapLoaded(true);

        const el = ref.current as HTMLElement | null;
        if (!el) return;

        gsapContext = gsap.context(() => {
          gsap.fromTo(
            el,
            { yPercent: amount },
            {
              yPercent: -amount,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        }, ref);
      } catch (error) {
        console.warn('Failed to load GSAP:', error);
      }
    };

    loadGsap();

    return () => {
      isMounted = false;
      if (gsapContext) {
        gsapContext.revert();
      }
    };
  }, [ref, amount]);

  return gsapLoaded;
}


