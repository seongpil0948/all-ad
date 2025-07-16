import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A.ll + Ad - 모든 광고를 하나로",
    short_name: "A.ll + Ad",
    description:
      "All-in-one advertising platform integrating multiple ad platforms",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#667eea",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["business", "productivity", "marketing"],
    lang: "ko-KR",
    orientation: "portrait-primary",
    scope: "/",
    id: "alladvertising",
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to dashboard",
        url: "/dashboard",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Settings",
        short_name: "Settings",
        description: "Go to settings",
        url: "/settings",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
