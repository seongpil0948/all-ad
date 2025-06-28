// Note: FEATURES and PLATFORMS constants moved to their respective components
// to avoid SSG build issues with React icon components

export const CTA_TEXTS = {
  MAIN_TITLE: "모든 광고를",
  MAIN_TITLE_HIGHLIGHT: "하나로",
  MAIN_SUBTITLE:
    "여러 광고 플랫폼을 하나의 대시보드에서 관리하세요. 실시간 분석과 자동 최적화로 광고 성과를 극대화합니다.",
  CTA_PRIMARY: "무료로 시작하기",
  CTA_SECONDARY: "데모 보기",
  CTA_SECTION_TITLE: "지금 시작하세요",
  CTA_SECTION_SUBTITLE: "14일 무료 체험으로 모든 기능을 경험해보세요",
  CTA_SECTION_BUTTON: "무료 체험 시작하기",
} as const;

export const SECTION_TITLES = {
  FEATURES: { title: "주요 기능", subtitle: "광고 관리를 더 스마트하게" },
  PLATFORMS: {
    title: "연동 가능한 플랫폼",
    subtitle: "국내외 주요 광고 플랫폼을 모두 지원합니다",
  },
  DASHBOARD: {
    title: "직관적인 대시보드",
    subtitle: "복잡한 데이터를 쉽게 이해할 수 있도록 시각화합니다",
  },
} as const;
