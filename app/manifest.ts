import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sivera - 모든 광고를 하나로",
    short_name: "Sivera",
    description:
      "All-in-one advertising platform integrating multiple ad platforms",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#667eea",
    icons: [
      {
        src: "/icon?<generated>",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon?<generated>",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    categories: ["business", "productivity", "marketing"],
    lang: "ko-KR",
    orientation: "portrait-primary",
    scope: "/",
    id: "sivera",
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to dashboard",
        url: "/dashboard",
        icons: [{ src: "/icon?<generated>", sizes: "32x32" }],
      },
      {
        name: "Settings",
        short_name: "Settings",
        description: "Go to settings",
        url: "/settings",
        icons: [{ src: "/icon?<generated>", sizes: "32x32" }],
      },
    ],
  };
}
