import { ImageResponse } from "next/og";

export const alt = "kodwai — AI Interview Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const playfair = await fetch(
    new URL("https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf")
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F0EB",
          gap: 24,
        }}
      >
        <span
          style={{
            fontFamily: "Playfair Display",
            fontWeight: 550,
            fontSize: 72,
            color: "#353431",
            letterSpacing: 1,
          }}
        >
          kodwai
        </span>
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: 28,
            color: "#8a8680",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          AI Interview Platform
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Playfair Display",
          data: playfair,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
