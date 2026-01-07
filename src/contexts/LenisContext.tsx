import { createContext, useContext, ReactNode } from 'react';
import type Lenis from '@studio-freight/lenis';

type LenisContextType = {
  lenis: Lenis | null;
};

export const LenisContext = createContext<LenisContextType>({ lenis: null });

export function useLenis() {
  const context = useContext(LenisContext);
  return context.lenis;
}

