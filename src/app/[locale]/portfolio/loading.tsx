export default function PortfolioLoading() {
  return (
    <main className="portfolio-hub-page">
      <div className="container">
        <div style={{ paddingTop: 80 }}>
          {/* tabs skeleton */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            {[80, 64, 96, 72].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: w, height: 36 }} />
            ))}
          </div>
          {/* grid skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: "16/10" }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
