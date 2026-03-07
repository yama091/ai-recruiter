import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: "bold",
            color: "red",
          }}
        >
          TEST
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
