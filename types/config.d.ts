// 설정 관련 타입 정의

export interface SiteConfig {
  name: string;
  description: string;
  navItems: Array<{
    label: string;
    href: string;
  }>;
  navMenuItems: Array<{
    label: string;
    href: string;
  }>;
  links: {
    github: string;
    twitter: string;
    docs: string;
    discord: string;
    sponsor: string;
  };
}
