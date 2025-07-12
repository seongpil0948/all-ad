import {
  FaFacebook,
  FaGoogle,
  FaComment,
  FaShoppingCart,
  FaAmazon,
} from "react-icons/fa";
import { SiNaver } from "react-icons/si";
import { IconType } from "react-icons";

import { PlatformType } from "@/types";

interface PlatformConfig {
  name: string;
  icon: IconType;
  color: "primary" | "danger" | "warning" | "success" | "secondary";
  bgColor: string;
  supportsOAuth: boolean;
}

export const platformConfig: Record<PlatformType, PlatformConfig> = {
  facebook: {
    name: "Facebook",
    icon: FaFacebook,
    color: "primary",
    bgColor: "bg-blue-500",
    supportsOAuth: true,
  },
  google: {
    name: "Google",
    icon: FaGoogle,
    color: "danger",
    bgColor: "bg-red-500",
    supportsOAuth: true,
  },
  kakao: {
    name: "Kakao",
    icon: FaComment,
    color: "warning",
    bgColor: "bg-yellow-400",
    supportsOAuth: true,
  },
  naver: {
    name: "Naver",
    icon: SiNaver,
    color: "success",
    bgColor: "bg-green-500",
    supportsOAuth: false,
  },
  coupang: {
    name: "Coupang",
    icon: FaShoppingCart,
    color: "secondary",
    bgColor: "bg-purple-500",
    supportsOAuth: false,
  },
  amazon: {
    name: "Amazon",
    icon: FaAmazon,
    color: "warning",
    bgColor: "bg-orange-500",
    supportsOAuth: true,
  },
};

export const getPlatformConfig = (platform: PlatformType): PlatformConfig => {
  return platformConfig[platform];
};

export const getPlatformIcon = (platform: PlatformType): IconType => {
  return platformConfig[platform].icon;
};

export const getPlatformColor = (
  platform: PlatformType,
): PlatformConfig["color"] => {
  return platformConfig[platform].color;
};
