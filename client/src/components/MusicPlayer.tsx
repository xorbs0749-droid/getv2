import { useState, useRef, useEffect, useCallback } from "react";
import { useTimeBasedBackground } from "@/hooks/useTimeBasedBackground";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Play, Pause, SkipForward, SkipBack, Heart, Volume2, VolumeX, Settings, Shuffle } from "lucide-react";
import type { Track } from "../../../lib/schema";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  loadAudioSettings,
  saveAudioSettings,
  calculateFadeSteps,
  validateFadeDuration,
  type AudioSettings,
} from "@/hooks/audioSettings";

interface MusicPlayerProps {
  tracks: Track[];
  initialIndex: number;
  onClose: () => void;
  autoPlay?: boolean;
  categoryImage?: string;
  categoryName?: string;
}

export function MusicPlayer({
  tracks,
  initialIndex,
  onClose,
  autoPlay = false,
  categoryImage,
  categoryName,
}: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings());
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(true);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [currentShufflePosition, setCurrentShufflePosition] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crossfadeCheckRef = useRef<NodeJS.Timeout | null>(null);
  const originalVolumeRef = useRef(1);
  const timeBasedBackground = useTimeBasedBackground();

  const { user } = useAuth();
  const currentTrack = tracks[currentIndex];

  const utils = trpc.useUtils();
  const { data: isSaved } = trpc.saved.isSaved.useQuery(
    { trackId: currentTrack?.id ?? 0 },
    { enabled: !!user && !!currentTrack }
  );

  const saveMutation = trpc.saved.save.useMutation({
    onSuccess: () => {
      toast.success("저장되었습니다!");
      utils.saved.isSaved.invalidate({ trackId: currentTrack?.id ?? 0 });
      utils.saved.getMySaved.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unsaveMutation = trpc.saved.unsave.useMutation({
    onSuccess: () => {
      toast.success("저장 취소되었습니다!");
      utils.saved.isSaved.invalidate({ trackId: currentTrack?.id ?? 0 });
      utils.saved.getMySaved.invalidate();
    },
  });

  // playNext와 playPrevious 함수 (useEffect에서 사용되므로 먼저 선언)
  const playNext = useCallback(() => {
    if (isShuffleEnabled && shuffledIndices.length > 0) {
      const nextPos = (currentShufflePosition + 1) % shuffledIndices.length;
      setCurrentShufflePosition(nextPos);
      setCurrentIndex(shuffledIndices[nextPos]);
    } else {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
    }
  }, [isShuffleEnabled, shuffledIndices, currentShufflePosition, tracks.length]);

  const playPrevious = useCallback(() => {
    if (isShuffleEnabled && shuffledIndices.length > 0) {
      const prevPos = currentShufflePosition === 0 ? shuffledIndices.length - 1 : currentShufflePosition - 1;
      setCurrentShufflePosition(prevPos);
      setCurrentIndex(shuffledIndices[prevPos]);
    } else {
      setCurrentIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
    }
  }, [isShuffleEnabled, shuffledIndices, currentShufflePosition, tracks.length]);

  // 셔플 초기화
  useEffect(() => {
    if (tracks.length > 0) {
      const indices = tracks.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      const randomPos = Math.floor(Math.random() * indices.length);
      setCurrentShufflePosition(randomPos);
      setCurrentIndex(indices[randomPos]);
    }
  }, [tracks.length]);

  // 트랙 변경 시 오디오 초기화 및 페이드 인
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 이전 페이드 인터벌 정리
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    // 오디오 완전히 정지 및 초기화
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;

    // 새 트랙 로드
    audio.load();

    // 재생 중이었다면 페이드 인과 함께 재생
    if (isPlaying && !isTransitioning) {
      fadeIn();
    }
  }, [currentIndex]);

  // 오디오 이벤트 리스너
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    const handleEnded = () => {
      // 크로스페이드가 비활성화된 경우에만 여기서 다음 곡 재생
      if (!audioSettings.crossfadeEnabled) {
        playNext();
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioSettings.crossfadeEnabled, playNext]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist || categoryName || 'GetSpark',
      album: categoryName || 'GetSpark BGM',
      artwork: [{ src: categoryImage || '/logo.png', sizes: '512x512', type: 'image/png' }],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      audioRef.current?.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      audioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    if ('setPositionState' in navigator.mediaSession) {
      // position이 duration보다 크면 에러 발생하므로 유효성 검사
      const validDuration = duration && !isNaN(duration) && duration > 0 ? duration : 0;
      const validPosition = currentTime && !isNaN(currentTime) && currentTime >= 0 ? currentTime : 0;
      
      // position이 duration을 초과하지 않도록 보장
      const safePosition = validDuration > 0 ? Math.min(validPosition, validDuration) : 0;
      
      if (validDuration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: validDuration,
            playbackRate: 1,
            position: safePosition,
          });
        } catch (error) {
          console.warn('Failed to set position state:', error);
        }
      }
    }

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [currentTrack, isPlaying, categoryImage, categoryName, duration, currentTime]);

  // 크로스페이드 체크 (개선된 버전)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSettings.crossfadeEnabled || !isPlaying || isTransitioning) return;

    // 이전 체크 인터벌 정리
    if (crossfadeCheckRef.current) {
      clearInterval(crossfadeCheckRef.current);
    }

    const checkCrossfade = () => {
      const timeRemaining = duration - currentTime;
      
      // 남은 시간이 페이드 시간과 같거나 작을 때 크로스페이드 시작
      if (timeRemaining > 0 && timeRemaining <= audioSettings.fadeDuration / 1000) {
        // 크로스페이드 체크 중지
        if (crossfadeCheckRef.current) {
          clearInterval(crossfadeCheckRef.current);
          crossfadeCheckRef.current = null;
        }

        // 전환 시작
        setIsTransitioning(true);

        // 현재 오디오 페이드 아웃
        fadeOut(() => {
          // 페이드 아웃 완료 후 다음 곡으로 전환
          playNext();
          setIsTransitioning(false);
        });
      }
    };

    // 100ms마다 체크
    crossfadeCheckRef.current = setInterval(checkCrossfade, 100);

    return () => {
      if (crossfadeCheckRef.current) {
        clearInterval(crossfadeCheckRef.current);
        crossfadeCheckRef.current = null;
      }
    };
  }, [currentTime, duration, audioSettings.crossfadeEnabled, audioSettings.fadeDuration, isPlaying, isTransitioning]);

  const fadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 이전 페이드 정리
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const targetVolume = isMuted ? 0 : volume;
    const steps = calculateFadeSteps(audioSettings.fadeDuration);
    const increment = targetVolume / steps;
    let currentStep = 0;

    audio.volume = 0;
    
    // 재생 시작
    audio.play().catch((error) => {
      console.error("Play error:", error);
      setIsPlaying(false);
    });

    // 페이드 인
    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      } else {
        audio.volume = Math.min(increment * currentStep, targetVolume);
      }
    }, audioSettings.fadeDuration / steps);
  };

  const fadeOut = (callback?: () => void) => {
    const audio = audioRef.current;
    if (!audio) {
      callback?.();
      return;
    }

    // 이전 페이드 정리
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const startVolume = audio.volume;
    const steps = calculateFadeSteps(audioSettings.fadeDuration);
    const decrement = startVolume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = 0;
        audio.pause();
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        callback?.();
      } else {
        audio.volume = Math.max(startVolume - decrement * currentStep, 0);
      }
    }, audioSettings.fadeDuration / steps);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      setIsPlaying(false);
      audio.pause();
    } else {
      setIsPlaying(true);
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch((error) => console.error("Play error:", error));
    }
  };

  const toggleShuffle = () => {
    setIsShuffleEnabled(!isShuffleEnabled);
    if (!isShuffleEnabled) {
      const indices = tracks.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setCurrentShufflePosition(0);
      toast.success("무작위 재생");
    } else {
      toast.success("순차 재생");
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0] ?? 0;
      setCurrentTime(value[0] ?? 0);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] ?? 1;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
  };

  const toggleSave = () => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }
    if (isSaved) {
      unsaveMutation.mutate({ trackId: currentTrack.id });
    } else {
      saveMutation.mutate({ trackId: currentTrack.id });
    }
  };

  const handleSettingsChange = (newSettings: AudioSettings) => {
    const validated = {
      ...newSettings,
      fadeDuration: validateFadeDuration(newSettings.fadeDuration),
    };
    setAudioSettings(validated);
    saveAudioSettings(validated);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  const getStreamUrl = (url: string | null) => {
    if (!url) return "";
    const fileIdMatch = url.match(/\/d\/([^/]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    return url;
  };

  const getBackgroundStyle = () => {
    switch (timeBasedBackground.period) {
      case "morning":
        return { background: "linear-gradient(to bottom right, #7dd3fc, #e0f2fe, #ffffff)" };
      case "afternoon":
        return { background: "linear-gradient(to bottom right, #ffffff, #eff6ff, #ffffff)" };
      case "evening":
        return { background: "linear-gradient(to bottom right, #fdba74, #fed7aa, #fef3c7)" };
      case "night":
      default:
        return { background: "linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)" };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 min-h-screen w-full flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-1000"
      style={getBackgroundStyle()}
    >
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        crossOrigin="anonymous"
      />

      <div className="w-full max-w-[95vw] sm:max-w-[1200px] md:max-w-[1300px]">
        <div className="flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`${timeBasedBackground.textColor} opacity-80 hover:opacity-100 hover:bg-white/10 rounded-full w-5 h-5`}
          >
            <X className="w-3 h-3" />
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              className={`${timeBasedBackground.textColor} opacity-80 hover:opacity-100 hover:bg-white/10 rounded-full w-5 h-5 ${isShuffleEnabled ? "bg-white/20" : ""}`}
            >
              <Shuffle className="w-2.5 h-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={`${timeBasedBackground.textColor} opacity-80 hover:opacity-100 hover:bg-white/10 rounded-full w-5 h-5`}
            >
              <Settings className="w-2.5 h-2.5" />
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="mb-3 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
            <div className="flex justify-between items-center mb-1">
              <h3 className={`${timeBasedBackground.textColor} text-[10px] font-bold`}>오디오 설정</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                }}
                className={`${timeBasedBackground.textColor} opacity-80 hover:opacity-100 hover:bg-white/10 rounded-full w-4 h-4`}
              >
                <X className="w-2 h-2" />
              </Button>
            </div>

            <div className="mb-1">
              <label className={`${timeBasedBackground.textColor} text-[8px] mb-0.5 block`}>
                페이드: {audioSettings.fadeDuration / 1000}초
              </label>
              <Slider
                value={[audioSettings.fadeDuration]}
                min={500}
                max={30000}
                step={500}
                onValueChange={(value) =>
                  handleSettingsChange({
                    ...audioSettings,
                    fadeDuration: value[0] ?? 7000,
                  })
                }
                className="mb-0.5"
              />
            </div>

            <div>
              <label className={`${timeBasedBackground.textColor} text-[8px] flex items-center gap-1 cursor-pointer`}>
                <input
                  type="checkbox"
                  checked={audioSettings.crossfadeEnabled}
                  onChange={(e) =>
                    handleSettingsChange({
                      ...audioSettings,
                      crossfadeEnabled: e.target.checked,
                    })
                  }
                  className="w-2 h-2 rounded"
                />
                크로스페이드
              </label>
            </div>
          </div>
        )}

        <div className="aspect-square w-full max-w-[1000px] mx-auto mb-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-white/10">
          {categoryImage && categoryImage.trim() !== "" ? (
            <img
              src={categoryImage}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className={`${timeBasedBackground.textColor} opacity-30 text-center w-full h-full flex items-center justify-center`}>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        <div className={`text-center mb-2 ${timeBasedBackground.textColor}`}>
          <h2 className="text-lg font-bold mb-1 drop-shadow-lg truncate">{currentTrack.title}</h2>
          {currentTrack.artist && !currentTrack.artist.toLowerCase().includes('untitled') && !currentTrack.artist.match(/^\d+$/) && (
            <p className="text-sm opacity-70 truncate">{currentTrack.artist}</p>
          )}
        </div>

        <div className="mb-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="mb-0.5"
          />
          <div className={`flex justify-between text-[8px] ${timeBasedBackground.textColor} opacity-60`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={playPrevious}
            className={`${timeBasedBackground.textColor} hover:bg-white/10 w-6 h-6 rounded-full`}
          >
            <SkipBack className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className={`${timeBasedBackground.textColor} hover:bg-white/10 w-8 h-8 rounded-full bg-white/10`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={playNext}
            className={`${timeBasedBackground.textColor} hover:bg-white/10 w-6 h-6 rounded-full`}
          >
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-1 px-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={`${timeBasedBackground.textColor} hover:bg-white/10 rounded-full w-5 h-5`}
          >
            {isMuted ? (
              <VolumeX className="w-2.5 h-2.5" />
            ) : (
              <Volume2 className="w-2.5 h-2.5" />
            )}
          </Button>

          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-14"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSave}
            className={`${timeBasedBackground.textColor} hover:bg-white/10 rounded-full w-5 h-5 ${isSaved ? "text-red-400" : ""}`}
          >
            <Heart className={`w-2.5 h-2.5 ${isSaved ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
