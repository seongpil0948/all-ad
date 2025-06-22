import {
  FaFacebook,
  FaGoogle,
  FaComment,
  FaShoppingCart,
} from "react-icons/fa";
import { SiNaver } from "react-icons/si";

export const platformConfig = {
  facebook: {
    name: "Facebook",
    icon: FaFacebook,
    color: "primary" as const,
    bgColor: "bg-blue-500",
    supportsOAuth: true,
  },
  google: {
    name: "Google",
    icon: FaGoogle,
    color: "danger" as const,
    bgColor: "bg-red-500",
    supportsOAuth: true,
  },
  kakao: {
    name: "Kakao",
    icon: FaComment,
    color: "warning" as const,
    bgColor: "bg-yellow-400",
    supportsOAuth: true,
  },
  naver: {
    name: "Naver",
    icon: SiNaver,
    color: "success" as const,
    bgColor: "bg-green-500",
    supportsOAuth: false,
  },
  coupang: {
    name: "Coupang",
    icon: FaShoppingCart,
    color: "secondary" as const,
    bgColor: "bg-purple-500",
    supportsOAuth: false,
  },
} as const;

export type PlatformConfig = typeof platformConfig;
