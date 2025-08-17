import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const runtime = "edge";

export const alt = `${siteConfig.name} - ${siteConfig.description}`;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{ fontSize: "72px", fontWeight: "bold", marginBottom: "20px" }}
        >
          {siteConfig.name}
        </div>
        <div style={{ fontSize: "36px", opacity: 0.8, textAlign: "center" }}>
          {siteConfig.description}
        </div>
        <div style={{ fontSize: "28px", opacity: 0.6, marginTop: "40px" }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
