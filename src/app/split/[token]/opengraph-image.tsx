import { ImageResponse } from "next/og";
import { getBillSplitByToken } from "@/app/app/split/actions";
import { fmtRp } from "@/lib/finance/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ringkasan Split Bill";

const AVATAR_COLORS = ["#7c6ef2", "#4a4470", "#4a4470", "#4a4470"];

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const split = await getBillSplitByToken(token);

  if (!split) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#171331",
            color: "#e9e6f5",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Uangku
        </div>
      ),
      size,
    );
  }

  const { result } = split;
  const shown = result.perParticipant.slice(0, 6);
  const overflowCount = result.perParticipant.length - shown.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px",
          background: "linear-gradient(155deg, #241f3d 0%, #12101f 60%)",
          color: "#f2f0f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 44 }}>🧾</span>
            <span style={{ fontSize: 36, fontWeight: 700 }}>Split Bill: {split.title}</span>
          </div>
          {split.merchant && <span style={{ fontSize: 22, color: "#b8afe8" }}>{split.merchant}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 40 }}>
          {shown.map((p, i) => (
            <div key={p.participantId} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: p.isCreator ? "#7c6ef2" : AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 23, color: "#f2f0f7", flexGrow: 1 }}>{p.name}</span>
              <span style={{ fontSize: 25, fontWeight: 700, color: "#ffffff" }}>{fmtRp(p.total)}</span>
            </div>
          ))}
          {overflowCount > 0 && <span style={{ fontSize: 18, color: "#8b84c4" }}>+{overflowCount} orang lainnya</span>}
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: 2,
            borderTopStyle: "solid",
            borderTopColor: "rgba(255,255,255,0.14)",
            paddingTop: 28,
          }}
        >
          <span style={{ fontSize: 20, color: "#b8afe8" }}>{result.perParticipant.length} orang · dibagi lewat Uangku</span>
          <span style={{ fontSize: 42, fontWeight: 700, color: "#ffffff" }}>{fmtRp(result.grandTotal)}</span>
        </div>
      </div>
    ),
    size,
  );
}
