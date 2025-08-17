import { ImageResponse } from "next/og";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export const runtime = "edge";

export const alt = "A.ll + Ad";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
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
          📊 {dict.nav.dashboard}
        </div>
        <div
          style={{ fontSize: "72px", fontWeight: "bold", marginBottom: "20px" }}
        >
          {dict.brand.name}
        </div>
        <div style={{ fontSize: "28px", opacity: 0.8, textAlign: "center" }}>
          {dict.home.features.dashboard.description}
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
