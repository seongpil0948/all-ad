import {
  FaChartLine,
  FaRocket,
  FaShieldAlt,
  FaDatabase,
  FaGoogle,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaAmazon,
} from "react-icons/fa";
import { SiNaver, SiKakao } from "react-icons/si";

export const FEATURES = [
  {
    icon: FaChartLine,
    title: "통합 대시보드",
    description:
      "모든 광고 플랫폼의 성과를 한눈에 확인하세요. 실시간 데이터 분석과 리포트를 제공합니다.",
  },
  {
    icon: FaRocket,
    title: "자동화된 광고 최적화",
    description:
      "AI 기반 광고 최적화로 ROI를 극대화하고 광고 예산을 효율적으로 관리하세요.",
  },
  {
    icon: FaShieldAlt,
    title: "안전한 데이터 관리",
    description: "엔터프라이즈급 보안으로 광고 데이터를 안전하게 보호합니다.",
  },
  {
    icon: FaDatabase,
    title: "유연한 연동 방식",
    description: "SDK, Open API, DB to DB 등 다양한 연동 방식을 지원합니다.",
  },
] as const;

export const PLATFORMS = [
  { icon: FaGoogle, name: "Google Ads", color: "text-blue-500" },
  { icon: FaFacebook, name: "Facebook Ads", color: "text-blue-600" },
  { icon: FaInstagram, name: "Instagram Ads", color: "text-pink-500" },
  { icon: FaYoutube, name: "YouTube Ads", color: "text-red-500" },
  { icon: SiNaver, name: "Naver Ads", color: "text-green-500" },
  { icon: SiKakao, name: "Kakao Ads", color: "text-yellow-500" },
  {
    icon: FaTiktok,
    name: "TikTok Ads",
    color: "text-black dark:text-white",
  },
  { icon: FaAmazon, name: "Amazon Ads", color: "text-orange-500" },
] as const;

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
