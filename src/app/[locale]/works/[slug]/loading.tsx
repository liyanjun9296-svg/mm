export default function WorkDetailLoading() {
  return (
    <main className="section">
      <div className="container detail-wrap">
        {/* back link skeleton */}
        <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 20 }} />
        {/* title skeleton */}
        <div className="skeleton" style={{ width: "55%", height: 48, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: "30%", height: 20, marginBottom: 32 }} />
        {/* video/image area skeleton */}
        <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", marginBottom: 32 }} />
        {/* description lines */}
        {[100, 88, 72].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}%`, height: 16, marginBottom: 10 }} />
        ))}
      </div>
    </main>
  );
}
