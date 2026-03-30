import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
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
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F0EB",
          borderRadius: 96,
        }}
      >
        <span
          style={{
            fontFamily: "Playfair Display",
            fontWeight: 550,
            fontSize: 340,
            color: "#353431",
            lineHeight: 1,
            marginTop: 20,
          }}
        >
          k
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
