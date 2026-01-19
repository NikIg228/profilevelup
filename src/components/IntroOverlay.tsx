import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * IntroOverlay — один большой компонент (mobile-first):
 * 1) Скрывает контент полностью.
 * 2) Показывает 3 "боли" (pop-in → shake → fade-out) по центру на тёмном фоне.
 * 3) В конце включает "луч" из центра и раскрывает контент кругом (clip-path).
 * 4) Тап в любой момент → skip: мгновенно раскрыть контент и убрать интро.
 *
 * Использование:
 * <IntroOverlay>
 *   <MainPageContent />
 * </IntroOverlay>
 */

const PAIN_PHRASES = [
  "Выбери нормальную профессию!",
  "На этом денег не заработаешь!",
  "Какие таланты? Главное — диплом!",
] as const;

// Тайминги (≤ 5s total)
const PHRASE_BLOCK_MS = 1350; // на одну фразу (включая pop/shake/fade + gap)
const REVEAL_MS = 900;        // световой reveal контента
const TOTAL_MS = PHRASE_BLOCK_MS * 3 + REVEAL_MS; // 4050 + 900 = 4950ms

// Внутренние анимации фразы
const POP_IN_S = 0.18;
const SHAKE_S = 0.80;
const FADE_OUT_S = 0.25;
// GAP внутри 1.35s достигается тем, что фраза exit-ится и есть пауза до next key

type Stage = "intro" | "reveal" | "done";

interface IntroOverlayProps {
  children: React.ReactNode;

  /**
   * Если true — интро показывается только один раз на устройство.
   * (можешь отключить для дебага)
   */
  oncePerDevice?: boolean;

  /**
   * Ключ localStorage для oncePerDevice
   */
  storageKey?: string;

  /**
   * Если true — игнорирует localStorage и всегда показывает интро (для разработки)
   */
  forceShow?: boolean;
}

export default function IntroOverlay({
  children,
  oncePerDevice = true,
  storageKey = "intro_seen_v1",
  forceShow = false,
}: IntroOverlayProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [shakePhase, setShakePhase] = useState(false);
  
  // Синхронизируем ref с state
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  
  // Управление shake анимацией для текущей фразы
  useEffect(() => {
    if (stage !== "intro") {
      setShakePhase(false);
      return;
    }
    setShakePhase(false);
    // После pop-in запускаем shake
    const shakeTimer = setTimeout(() => {
      if (stageRef.current === "intro") {
        setShakePhase(true);
      }
    }, POP_IN_S * 1000);
    
    return () => clearTimeout(shakeTimer);
  }, [phraseIndex, stage]);

  // revealProgress управляет clip-path раскрытия (0 → 1)
  const [revealProgress, setRevealProgress] = useState(0);

  const doneRef = useRef(false);
  const stageRef = useRef<Stage>("intro");
  const introTimersRef = useRef<number[]>([]);
  const revealTimersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearIntroTimers = useCallback(() => {
    introTimersRef.current.forEach((t) => window.clearTimeout(t));
    introTimersRef.current = [];
  }, []);

  const clearRevealTimers = useCallback(() => {
    revealTimersRef.current.forEach((t) => window.clearTimeout(t));
    revealTimersRef.current = [];
  }, []);

  const clearAll = useCallback(() => {
    clearIntroTimers();
    clearRevealTimers();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [clearIntroTimers, clearRevealTimers]);

  const hardDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearAll();
    document.body.style.overflow = "";
    setStage("done");
  }, [clearAll]);

  const runReveal = useCallback((fast = false) => {
    // Включаем reveal стадии
    setStage("reveal");
    setRevealProgress(0);

    // Если fast (skip) — раскрываем почти мгновенно
    const duration = fast ? 220 : REVEAL_MS;
    const start = performance.now();
    const from = fast ? 0.65 : 0; // при skip сразу подскочим, чтобы ощущалось мгновенно

    setRevealProgress(from);

    // RAF для плавной анимации прогресса
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (1 - from) * eased;
      setRevealProgress(value);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    // Гарантированное завершение через таймер (не зависит от RAF)
    const completionTimer = window.setTimeout(() => {
      // Ставим localStorage флаг (если oncePerDevice и не fast)
      if (oncePerDevice && !fast) {
        try {
          localStorage.setItem(storageKey, "1");
        } catch {}
      }
      hardDone();
    }, duration + 20); // +20ms запас для гарантии

    revealTimersRef.current.push(completionTimer);
  }, [hardDone, oncePerDevice, storageKey]);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    clearAll();
    if (oncePerDevice) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
    }
    runReveal(true);
  }, [clearAll, oncePerDevice, runReveal, storageKey]);

  // On mount: decide whether to show intro
  useEffect(() => {
    if (forceShow) return; // Если forceShow=true — игнорируем localStorage

    if (!oncePerDevice) return;

    try {
      const seen = localStorage.getItem(storageKey) === "1";
      if (seen) {
        // Без интро: сразу done
        setStage("done");
        doneRef.current = true;
        return;
      }
    } catch {
      // если localStorage недоступен — просто показываем интро
    }
  }, [oncePerDevice, storageKey, forceShow]);

  // Main timeline (only if we actually run intro)
  useEffect(() => {
    if (stage !== "intro") return;
    if (doneRef.current) return;

    // lock scroll while intro/reveal
    document.body.style.overflow = "hidden";

    // Сброс индекса фразы на 0 при старте
    setPhraseIndex(0);

    // Смена фраз строго по таймингу: 0 → 1 → 2 каждые 1350ms
    const timer1 = window.setTimeout(() => {
      if (!doneRef.current && stageRef.current === "intro") {
        setPhraseIndex(1);
      }
    }, PHRASE_BLOCK_MS);
    introTimersRef.current.push(timer1);

    const timer2 = window.setTimeout(() => {
      if (!doneRef.current && stageRef.current === "intro") {
        setPhraseIndex(2);
      }
    }, PHRASE_BLOCK_MS * 2);
    introTimersRef.current.push(timer2);

    // Переход к reveal после 3-й фразы
    const timer3 = window.setTimeout(() => {
      if (!doneRef.current && stageRef.current === "intro") {
        runReveal(false);
      }
    }, PHRASE_BLOCK_MS * 3);
    introTimersRef.current.push(timer3);

    // Safety hard-stop (на всякий случай)
    const timer4 = window.setTimeout(() => {
      if (!doneRef.current) {
        hardDone();
      }
    }, TOTAL_MS + 200);
    introTimersRef.current.push(timer4);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      // Очищаем только таймеры интро, НЕ трогаем reveal таймеры
      clearIntroTimers();
      document.body.style.overflow = "";
    };
  }, [stage, clearIntroTimers, hardDone, runReveal, skip]);

  // --- Reveal math for clip-path circle ---
  // 0..1 -> circle radius from 0% to 150% (чтобы гарантированно покрыть экран)
  const radius = `${Math.round(revealProgress * 150)}%`;

  const showOverlay = stage !== "done";
  const showPhrases = stage === "intro";
  const showRevealLight = stage === "reveal";

  return (
    <div className="relative min-h-[100dvh]">
      {/* 1) Контент: скрыт в интро, раскрывается в reveal через clip-path */}
      <div
        id="page-root"
        style={{
          minHeight: "100dvh",
          // В intro: полностью скрыт
          // В reveal: видим, раскрывается кругом
          // В done: полностью видим, без clip-path
          opacity: stage === "intro" ? 0 : 1,
          pointerEvents: stage === "done" ? "auto" : "none",
          // Раскрываем кругом только в reveal, после reveal - полностью видим
          clipPath: 
            stage === "reveal" 
              ? `circle(${radius} at 50% 45%)` 
              : stage === "done" 
              ? "none" 
              : "circle(0% at 50% 45%)",
          WebkitClipPath:
            stage === "reveal"
              ? `circle(${radius} at 50% 45%)`
              : stage === "done"
              ? "none"
              : "circle(0% at 50% 45%)",
          transition: stage === "done" ? "none" : "opacity 120ms linear",
          willChange: "clip-path, opacity",
        }}
      >
        {children}
      </div>

      {/* 2) Overlay: интро + reveal-light */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-[9999] grid place-items-center p-6 text-center"
            style={{
              background: "#050B1C",
              touchAction: "manipulation",
              minHeight: "100dvh",
              width: "100%",
              left: 0,
              right: 0,
              maxWidth: "100%",
              // В reveal overlay исчезает визуально, но не должен ловить клики
              pointerEvents: stage === "reveal" ? "none" : "auto",
            }}
            role="button"
            tabIndex={0}
            aria-label="Skip intro"
            onClick={skip}
            initial={{ opacity: 1 }}
            animate={{ opacity: showRevealLight ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: showRevealLight ? REVEAL_MS / 1000 : 0.0, ease: "easeOut" }}
          >
            {/* Reveal light layer (луч из центра) */}
            {showRevealLight && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Мягкий "световой купол" */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(246,248,255,0.55) 0%, rgba(246,248,255,0.28) 28%, rgba(246,248,255,0.10) 46%, rgba(5,11,28,0.0) 74%)",
                  }}
                />

                {/* Яркое ядро луча, расширяется */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 0.04, opacity: 0.0 }}
                  animate={{ scale: 2.35, opacity: 0.0 }}
                  transition={{ duration: REVEAL_MS / 1000, ease: "easeOut" }}
                  style={{
                    transformOrigin: "50% 50%",
                    willChange: "transform",
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.18) 18%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.00) 60%)",
                  }}
                />

                {/* Лёгкая "пиксельная" сетка/зерно (дешево и похоже) */}
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: 0.08,
                    backgroundImage:
                      "radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1px)",
                    backgroundSize: "6px 6px",
                    mixBlendMode: "soft-light",
                  }}
                />
              </div>
            )}

            {/* Phrase text */}
            {showPhrases && (
              <>
                <AnimatePresence mode="wait">
                  {phraseIndex < PAIN_PHRASES.length && (
                    <motion.h2
                      key={`phrase-${phraseIndex}`}
                      className="relative z-10 mx-auto px-4 font-extrabold leading-[1.45] max-w-[24ch]"
                      style={{
                        color: "#F2F4FF",
                        fontSize: "clamp(24px, 6vw, 28px)",
                        willChange: "transform, opacity",
                        wordBreak: "break-word",
                        hyphens: "auto",
                      }}
                      initial={{ opacity: 0, scale: 0.92, x: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: shakePhase ? [0, -5, 5, -4, 4, -3, 3, -2, 2, 0] : 0,
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.985,
                        transition: { duration: FADE_OUT_S, ease: "easeIn" }
                      }}
                      transition={{
                        opacity: { duration: POP_IN_S, ease: "easeOut" },
                        scale: { duration: POP_IN_S, ease: "easeOut" },
                        x: shakePhase 
                          ? { duration: SHAKE_S, ease: "easeInOut", times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
                          : { duration: 0 },
                      }}
                    >
                      {PAIN_PHRASES[phraseIndex]}
                    </motion.h2>
                  )}
                </AnimatePresence>

                <motion.p
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-[#F2F4FF]/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.25 }}
                  style={{ willChange: "opacity" }}
                >
                  Нажмите на экран чтобы пропустить
                </motion.p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
