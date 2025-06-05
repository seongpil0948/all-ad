import { SiteConfig } from "@/types/config";

export const PAGE_PATH = {
  landing: "/",
  login: "/login",
  dashboard: "/dashboard",
  settings: "/settings",
  profile: "/profile",
  team: "/team",
  integrated: "/integrated",
  analytics: "/analytics",
  pricing: "/pricing",
  demo: "/demo",
  support: "/support",
  contact: "/contact",
} as const;

export const siteConfig: SiteConfig = {
  name: "A.ll + Ad",
  description: "All in one advertising solution - 모든 광고를 하나로",
  navItems: [
    {
      label: "홈",
      href: "/",
    },
    {
      label: "데모",
      href: "/demo",
    },
    {
      label: "요금제",
      href: "/pricing",
    },
    {
      label: "고객 지원",
      href: "/support",
    },
  ],
  navMenuItems: [
    {
      label: "대시보드",
      href: "/dashboard",
    },
    {
      label: "캠페인 관리",
      href: "/campaigns",
    },
    {
      label: "리포트",
      href: "/reports",
    },
    {
      label: "설정",
      href: "/settings",
    },
    {
      label: "프로필",
      href: "/profile",
    },
    {
      label: "로그아웃",
      href: "/logout",
    },
  ],
  links: {
    github: "",
    twitter: "",
    docs: "/docs",
    discord: "",
    sponsor: "",
  },
};
