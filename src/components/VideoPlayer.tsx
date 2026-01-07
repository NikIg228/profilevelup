import { useRef, useState, useEffect, useCallback } from 'react';
import { useVideoController, VideoItem } from '../hooks/useVideoController';
import PlayerControls from './PlayerControls';
import PlayerProgressBar from './PlayerProgressBar';
import VideoNavigation from './VideoNavigation';
import SwipeLayer from './SwipeLayer';

type VideoPlayerProps = {
  videos: VideoItem[];
  startIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export default function VideoPlayer({ videos, startIndex, onClose, onIndexChange }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseMoveRef = useRef<number>(Date.now());

  const currentVideo = videos[currentIndex];

  const {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    volume,
    isMuted,
    play,
    pause,
    togglePlayPause,
    setVolumeValue,
    toggleMute,
    seek,
  } = useVideoController({
    videoRef,
    onVideoEnd: () => {
      // При окончании видео переходим к следующему
      handleNext();
    },
  });

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Загружаем видео при смене индекса
  useEffect(() => {
    if (videoRef.current && currentVideo) {
      videoRef.current.load();
      setShowControls(true);
      resetHideControlsTimer();
    }
  }, [currentIndex, currentVideo]);

  // Управление показом контролов
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  useEffect(() => {
    const container = document.querySelector('.video-player-container');
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [handleMouseMove]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % videos.length;
    setCurrentIndex(nextIndex);
    onIndexChange?.(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    setCurrentIndex(prevIndex);
    onIndexChange?.(prevIndex);
  };

  const handleSwipeUp = () => {
    handleNext();
  };

  const handleSwipeDown = () => {
    handlePrev();
  };

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, togglePlayPause, onClose]);

  // Блокируем скролл страницы
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.overflowY = 'hidden';
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, []);

  if (!currentVideo) return null;

  return (
    <div className="video-player-container fixed inset-0 z-50 bg-black/70 backdrop-blur-lg via-black/90 flex items-center justify-center">
      <SwipeLayer onSwipeUp={handleSwipeUp} onSwipeDown={handleSwipeDown}>
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Видео контейнер */}
          <div
            className="relative inline-flex items-center justify-center"
            onClick={togglePlayPause}
            onMouseEnter={() => setIsVideoHovered(true)}
            onMouseLeave={() => setIsVideoHovered(false)}
          >
            <video
              ref={videoRef}
              src={currentVideo.src}
              className="max-h-[90vh] w-auto h-auto object-contain rounded-xl"
              style={{ maxWidth: '90vw' }}
              playsInline
              muted={isMuted}
            />

            {/* Индикатор загрузки */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Прогресс-бар */}
            {!isLoading && (
              <PlayerProgressBar
                currentTime={currentTime}
                duration={duration}
                onSeek={seek}
              />
            )}
          </div>

          {/* Контролы */}
          <PlayerControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            onPlayPause={togglePlayPause}
            onToggleMute={toggleMute}
            onVolumeChange={setVolumeValue}
            onClose={onClose}
            showControls={showControls}
            isVideoHovered={isVideoHovered}
          />

          {/* Навигация */}
          <VideoNavigation
            onPrev={handlePrev}
            onNext={handleNext}
            showControls={showControls}
            isMobile={isMobile}
          />
        </div>
      </SwipeLayer>
    </div>
  );
}

