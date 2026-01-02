import { useState, useEffect } from "react";

export interface TimeBasedBackground {
  period: "morning" | "afternoon" | "evening" | "night";
  className: string;
  gradientClass: string;
  textColor: string;
}

/**
 * 시간대별 배경을 반환하는 훅
 * 아침 (7-10시): 해가 뜨는 듯한 배경 (하늘색 → 흰색)
 * 점심 (10-16시): 밝은 흰색
 * 저녁 (16-20시): 노을 오렌지빛 (주황색 → 노을)
 * 밤 (20-7시): 어두운 흑색 (검은색 → 진한 파란색)
 */
export function useTimeBasedBackground(): TimeBasedBackground {
  const [background, setBackground] = useState<TimeBasedBackground>({
    period: "night",
    className: "bg-night",
    gradientClass: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    textColor: "text-white",
  });

  useEffect(() => {
    const updateBackground = () => {
      const now = new Date();
      const hours = now.getHours();

      let newBackground: TimeBasedBackground;

      if (hours >= 7 && hours < 10) {
        // 아침 (7-10시): 해가 뜨는 듯한 배경
        newBackground = {
          period: "morning",
          className: "bg-morning",
          gradientClass: "bg-gradient-to-br from-sky-300 via-sky-100 to-white",
          textColor: "text-slate-800",
        };
      } else if (hours >= 10 && hours < 16) {
        // 점심 (10-16시): 밝은 흰색
        newBackground = {
          period: "afternoon",
          className: "bg-afternoon",
          gradientClass: "bg-gradient-to-br from-white via-blue-50 to-white",
          textColor: "text-slate-900",
        };
      } else if (hours >= 16 && hours < 20) {
        // 저녁 (16-20시): 노을 오렌지빛
        newBackground = {
          period: "evening",
          className: "bg-evening",
          gradientClass: "bg-gradient-to-br from-orange-300 via-orange-200 to-amber-100",
          textColor: "text-slate-800",
        };
      } else {
        // 밤 (20-7시): 어두운 흑색
        newBackground = {
          period: "night",
          className: "bg-night",
          gradientClass: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          textColor: "text-white",
        };
      }

      setBackground(newBackground);
    };

    // 초기 배경 설정
    updateBackground();

    // 매분마다 배경 업데이트 (시간이 변할 때마다 확인)
    const interval = setInterval(updateBackground, 60000);

    return () => clearInterval(interval);
  }, []);

  return background;
}

/**
 * 시간대별 배경 클래스를 반환하는 함수 (훅 없이 사용 가능)
 */
export function getTimeBasedBackgroundClass(): string {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 7 && hours < 10) {
    return "bg-gradient-to-br from-sky-300 via-sky-100 to-white";
  } else if (hours >= 10 && hours < 16) {
    return "bg-gradient-to-br from-white via-blue-50 to-white";
  } else if (hours >= 16 && hours < 20) {
    return "bg-gradient-to-br from-orange-300 via-orange-200 to-amber-100";
  } else {
    return "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";
  }
}

/**
 * 시간대별 텍스트 색상을 반환하는 함수
 */
export function getTimeBasedTextColor(): string {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 7 && hours < 10) {
    return "text-slate-800";
  } else if (hours >= 10 && hours < 16) {
    return "text-slate-900";
  } else if (hours >= 16 && hours < 20) {
    return "text-slate-800";
  } else {
    return "text-white";
  }
}

/**
 * 현재 시간대를 반환하는 함수
 */
export function getCurrentTimePeriod(): "morning" | "afternoon" | "evening" | "night" {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 7 && hours < 10) {
    return "morning";
  } else if (hours >= 10 && hours < 16) {
    return "afternoon";
  } else if (hours >= 16 && hours < 20) {
    return "evening";
  } else {
    return "night";
  }
}
