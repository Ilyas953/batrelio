// The home-screen icon: the "b." of the logo, white and orange on the dark brand colour.
export function AppIconArt({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1c1917",
        color: "#ffffff",
        fontSize: size * 0.62,
        fontWeight: 800,
        letterSpacing: "-0.06em",
        paddingBottom: size * 0.06,
      }}
    >
      b<span style={{ color: "#ea580c" }}>.</span>
    </div>
  );
}
