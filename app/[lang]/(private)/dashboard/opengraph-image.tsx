import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Dashboard - A.ll + Ad";
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
          style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "20px" }}
        >
          📊 Dashboard
        </div>
        <div
          style={{ fontSize: "72px", fontWeight: "bold", marginBottom: "20px" }}
        >
          A.ll + Ad
        </div>
        <div style={{ fontSize: "28px", opacity: 0.8, textAlign: "center" }}>
          통합 광고 관리 대시보드
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
