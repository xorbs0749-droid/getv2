/**
 * 오디오 설정 및 EQ 프리셋 관리
 */

export interface AudioSettings {
  fadeDuration: number; // milliseconds
  crossfadeEnabled: boolean;
}

export interface EQPreset {
  name: string;
  description: string;
  frequencies: {
    bass: number; // 60Hz
    lowMid: number; // 250Hz
    mid: number; // 1000Hz
    highMid: number; // 4000Hz
    treble: number; // 12000Hz
  };
}

// 카테고리별 EQ 프리셋 정의
export const EQ_PRESETS: Record<string, EQPreset> = {
  // 장소 카테고리
  카페: {
    name: "카페",
    description: "따뜻하고 부드러운 톤",
    frequencies: {
      bass: 2, // +2dB
      lowMid: 1,
      mid: 0,
      highMid: -1,
      treble: -2,
    },
  },
  라운지: {
    name: "라운지",
    description: "고급스럽고 세련된 톤",
    frequencies: {
      bass: 1,
      lowMid: 0,
      mid: 1,
      highMid: 0,
      treble: -1,
    },
  },
  식당: {
    name: "식당",
    description: "명확하고 균형잡힌 톤",
    frequencies: {
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0,
    },
  },
  스터디카페: {
    name: "스터디카페",
    description: "명확하고 집중력 높은 톤",
    frequencies: {
      bass: -1,
      lowMid: -1,
      mid: 1,
      highMid: 2,
      treble: 1,
    },
  },
  사무실: {
    name: "사무실",
    description: "전문적이고 명확한 톤",
    frequencies: {
      bass: -1,
      lowMid: 0,
      mid: 1,
      highMid: 1,
      treble: 0,
    },
  },
  파티: {
    name: "파티",
    description: "활기차고 생생한 톤",
    frequencies: {
      bass: 3,
      lowMid: 1,
      mid: 0,
      highMid: 1,
      treble: 2,
    },
  },

  // 상황 카테고리
  명상: {
    name: "명상",
    description: "부드럽고 평온한 톤",
    frequencies: {
      bass: 1,
      lowMid: 0,
      mid: -1,
      highMid: -2,
      treble: -3,
    },
  },
  집중: {
    name: "집중",
    description: "명확하고 집중력 높은 톤",
    frequencies: {
      bass: -2,
      lowMid: -1,
      mid: 2,
      highMid: 2,
      treble: 1,
    },
  },
  휴식: {
    name: "휴식",
    description: "편안하고 따뜻한 톤",
    frequencies: {
      bass: 1,
      lowMid: 1,
      mid: 0,
      highMid: -1,
      treble: -2,
    },
  },
  운동: {
    name: "운동",
    description: "에너지 넘치고 명확한 톤",
    frequencies: {
      bass: 2,
      lowMid: 0,
      mid: 1,
      highMid: 2,
      treble: 2,
    },
  },
  수면: {
    name: "수면",
    description: "매우 부드럽고 평온한 톤",
    frequencies: {
      bass: 0,
      lowMid: -1,
      mid: -2,
      highMid: -3,
      treble: -4,
    },
  },

  // 날씨 카테고리
  아침: {
    name: "아침",
    description: "상큼하고 밝은 톤",
    frequencies: {
      bass: 0,
      lowMid: -1,
      mid: 1,
      highMid: 2,
      treble: 2,
    },
  },
  저녁: {
    name: "저녁",
    description: "감성적이고 따뜻한 톤",
    frequencies: {
      bass: 2,
      lowMid: 1,
      mid: 0,
      highMid: -1,
      treble: -2,
    },
  },
  밤: {
    name: "밤",
    description: "신비로운 톤",
    frequencies: {
      bass: 1,
      lowMid: 0,
      mid: -1,
      highMid: -2,
      treble: -1,
    },
  },
  비: {
    name: "비",
    description: "부드럽고 자연스러운 톤",
    frequencies: {
      bass: 1,
      lowMid: 0,
      mid: -1,
      highMid: -1,
      treble: -2,
    },
  },
  자연: {
    name: "자연",
    description: "자연스럽고 생생한 톤",
    frequencies: {
      bass: 1,
      lowMid: 0,
      mid: 0,
      highMid: 1,
      treble: 1,
    },
  },
};

// 기본 오디오 설정
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  fadeDuration: 2000, // 2 seconds - 빠른 응답성을 위해 단축
  crossfadeEnabled: true,
};

/**
 * 로컬 스토리지에서 오디오 설정 불러오기
 */
export function loadAudioSettings(): AudioSettings {
  try {
    const saved = localStorage.getItem("audioSettings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load audio settings:", error);
  }
  return DEFAULT_AUDIO_SETTINGS;
}

/**
 * 로컬 스토리지에 오디오 설정 저장
 */
export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem("audioSettings", JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save audio settings:", error);
  }
}

/**
 * EQ 프리셋 적용 (Web Audio API 사용)
 */
export function applyEQPreset(
  audioContext: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  preset: EQPreset
): BiquadFilterNode[] {
  const filters: BiquadFilterNode[] = [];

  // 주파수별 필터 생성
  const frequencies = [
    { freq: 60, gain: preset.frequencies.bass },
    { freq: 250, gain: preset.frequencies.lowMid },
    { freq: 1000, gain: preset.frequencies.mid },
    { freq: 4000, gain: preset.frequencies.highMid },
    { freq: 12000, gain: preset.frequencies.treble },
  ];

  let previousNode = source;

  frequencies.forEach(({ freq, gain }) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.value = freq;
    filter.gain.value = gain;
    filter.Q.value = 1;

    previousNode.connect(filter);
    previousNode = filter;
    filters.push(filter);
  });

  previousNode.connect(destination);

  return filters;
}

/**
 * 페이드 시간 유효성 검사
 */
export function validateFadeDuration(duration: number): number {
  // 최소 500ms, 최대 30000ms (30초)
  return Math.max(500, Math.min(30000, duration));
}

/**
 * 페이드 스텝 계산
 */
export function calculateFadeSteps(fadeDuration: number): number {
  // 부드러운 진행을 위해 최소 50스텝, 최대 300스텝
  return Math.max(50, Math.min(300, Math.ceil(fadeDuration / 70)));
}
