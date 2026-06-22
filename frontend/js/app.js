// ================================================================
//  app.js — Main React Application
// ================================================================
//
//  WHAT IS REACT?
//  React lets you build UIs as "components" — reusable pieces.
//  Each component is a function that returns HTML (called JSX).
//  When data changes, React automatically updates the UI.
//
//  KEY CONCEPTS USED HERE:
//  - useState()  : store data that can change (text input, results)
//  - useEffect() : run code when something changes (fetch news on load)
//  - fetch()     : send HTTP requests to our Flask backend
//  - JSX         : HTML written inside JavaScript
//
//  HOW FRONTEND TALKS TO BACKEND:
//  fetch("http://localhost:5000/api/analyze/text", {
//    method: "POST",
//    headers: { "Content-Type": "application/json" },
//    body: JSON.stringify({ text: "some news" })
//  })
//  .then(res => res.json())
//  .then(data => console.log(data))  // data = Claude's analysis
//
// ================================================================

const { useState, useEffect, useRef } = React;

// ── Configuration ─────────────────────────────────────────────
// Change this if your Flask backend runs on a different port
const API_BASE = "http://127.0.0.1:5001";

// ── Verdict config — colours and icons for each verdict type ──
const VERDICTS = {
  VERIFIED:   { label: "VERIFIED",         icon: "✓", color: "var(--green)",  bg: "var(--green-bg)",  border: "rgba(0,230,118,0.25)"  },
  FAKE:       { label: "FAKE NEWS",         icon: "✗", color: "var(--red)",    bg: "var(--red-bg)",    border: "rgba(255,61,90,0.25)"   },
  SUSPICIOUS: { label: "SUSPICIOUS",        icon: "!", color: "var(--amber)",  bg: "var(--amber-bg)",  border: "rgba(255,179,0,0.25)"   },
  STYLE_FAKE: { label: "STYLE-BASED FAKE",  icon: "~", color: "var(--orange)", bg: "var(--orange-bg)", border: "rgba(255,107,43,0.25)"  },
};

const ENTITY_COLORS = {
  PERSON: ["rgba(0,212,255,0.1)",  "var(--cyan)",  "rgba(0,212,255,0.3)"],
  ORG:    ["rgba(0,230,118,0.1)",  "var(--green)", "rgba(0,230,118,0.3)"],
  GPE:    ["rgba(255,179,0,0.1)",  "var(--amber)", "rgba(255,179,0,0.3)"],
  DATE:   ["rgba(168,168,255,0.1)","#a8a8ff",      "rgba(168,168,255,0.3)"],
};

const SAMPLES = [
  "Scientists discover miracle cure that doctors don't want you to know about.",
  "The Federal Reserve held interest rates steady following strong employment data.",
  "NASA confirms the moon landing was staged in a Hollywood studio, new documents reveal.",
  "World Health Organization issues updated guidelines on respiratory illness prevention.",
];


// ================================================================
//  COMPONENT: Spinner
//  A simple loading animation shown while waiting for API response
// ================================================================
function Spinner() {
  return <div className="spinner" />;
}


// ================================================================
//  COMPONENT: ProgressRing
//  SVG circular progress bar for showing confidence percentage
// ================================================================
function ProgressRing({ pct, color }) {
  const r    = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      {/* Background ring */}
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5"/>
      {/* Foreground ring (coloured) */}
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 1s ease", transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      {/* Percentage text */}
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="12" fontFamily="var(--font-mono)" fontWeight="500">
        {pct}%
      </text>
    </svg>
  );
}


// ================================================================
//  COMPONENT: ResultPanel
//  Shows the analysis result returned from the backend
// ================================================================
function ResultPanel({ result }) {
  const v = VERDICTS[result.verdict] || VERDICTS.SUSPICIOUS;

  return (
    <div className="fade-up">
      {/* ── Verdict banner ── */}
      <div
        className="verdict-card"
        style={{ background: v.bg, borderColor: v.border }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {/* Verdict label with coloured icon */}
            <div className="verdict-label" style={{ color: v.color }}>
              <div className="verdict-icon" style={{ background: v.color }}>
                {v.icon}
              </div>
              {v.label}
            </div>
            {/* Plain-English summary */}
            <p style={{ fontSize: "0.85rem", lineHeight: 1.55, marginTop: 6 }}>
              {result.summary}
            </p>
          </div>
          {/* Circular confidence meter */}
          <ProgressRing pct={result.confidence} color={v.color} />
        </div>

        {/* Confidence + Credibility bars */}
        {[["CONFIDENCE", result.confidence], ["CREDIBILITY SCORE", result.credibility_score]].map(([label, val]) => (
          <div key={label}>
            <div className="meter-label">
              <span>{label}</span><span>{val}%</span>
            </div>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${val}%`, background: v.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Named Entities ── */}
      {result.entities?.length > 0 && (
        <div className="section-card">
          <div className="section-title">Named Entities Detected</div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {result.entities.map((e, i) => {
              const [bg, col, border] = ENTITY_COLORS[e.type] || ["var(--surface-3)", "var(--text-2)", "var(--border)"];
              return (
                <span key={i} className="entity-chip" style={{ background: bg, color: col, borderColor: border }}>
                  <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{e.type}</span> {e.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Suspicious Phrases ── */}
      {result.suspicious_phrases?.length > 0 && (
        <div className="section-card">
          <div className="section-title">⚠ Suspicious Phrases</div>
          <div>
            {result.suspicious_phrases.map((p, i) => (
              <span key={i} className="phrase-chip">"{p}"</span>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Reasoning Breakdown ── */}
      {result.reasoning && (
        <div className="section-card">
          <div className="section-title">AI Reasoning Breakdown</div>
          {Object.entries(result.reasoning).map(([key, val]) => (
            <div key={key} className="reasoning-row">
              <div className="reasoning-key">{key.replace(/_/g, " ")}</div>
              <div style={{ fontSize: "0.83rem", lineHeight: 1.5 }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Fact Context (Wikipedia-style) ── */}
      {result.wiki_insights && (
        <div className="section-card" style={{ background: "rgba(0,212,255,0.04)", borderColor: "rgba(0,212,255,0.15)" }}>
          <div className="section-title" style={{ color: "var(--cyan)" }}>🌐 Fact Context</div>
          <p style={{ fontSize: "0.83rem", lineHeight: 1.55 }}>{result.wiki_insights}</p>
        </div>
      )}

      {/* ── XAI Explanation ── */}
      {result.explanation && (
        <div className="xai-callout">
          💡 {result.explanation}
        </div>
      )}
    </div>
  );
}


// ================================================================
//  COMPONENT: App (Main)
//  This is the root component — everything lives inside here.
// ================================================================
function App() {
  // ── State variables ──────────────────────────────────────────
  // useState(initialValue) returns [currentValue, setterFunction]
  // When you call the setter, React re-renders the component

  const [tab,         setTab]         = useState("text");      // active tab
  const [textInput,   setTextInput]   = useState("");          // text box value
  const [imageFile,   setImageFile]   = useState(null);        // uploaded image
  const [imagePreview,setImagePreview]= useState(null);        // preview URL
  const [loading,     setLoading]     = useState(false);       // API in progress
  const [result,      setResult]      = useState(null);        // analysis result
  const [error,       setError]       = useState("");          // error message
  const [news,        setNews]        = useState([]);          // live headlines
  const [newsLoading, setNewsLoading] = useState(false);       // news loading
  const [backendOk,   setBackendOk]   = useState(null);        // backend status

  const fileInputRef = useRef(null);  // reference to hidden file input

  // ── Check backend health on startup ──────────────────────────
  // useEffect runs once on mount (empty [] dependency)
  useEffect(() => {
    checkBackendHealth();
    fetchNews();
  }, []);

  async function checkBackendHealth() {
    try {
      const res  = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setBackendOk(data.api_key_configured);
    } catch {
      setBackendOk(false);
    }
  }

  // ── Fetch live news from backend ──────────────────────────────
  async function fetchNews() {
    setNewsLoading(true);
    try {
      // GET request — no body needed, just fetch the URL
      const res  = await fetch(`${API_BASE}/news?limit=7`);
      const data = await res.json();
      setNews(data.articles || []);
    } catch (e) {
      console.error("News fetch failed:", e);
    } finally {
      setNewsLoading(false);
    }
  }

  // ── Handle image file selection ───────────────────────────────
  function handleImageSelect(file) {
    if (!file) return;
    setImageFile(file);
    // Create a local preview URL so we can show the image
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  // ── Main analysis function ────────────────────────────────────
  // This is the core function — sends data to Flask backend
  async function analyze(overrideText = null) {
    setError("");
    setResult(null);

    const textToAnalyze = overrideText || textInput;

    // Validate inputs
    if (tab === "text" && !textToAnalyze.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    if (tab === "image" && !imageFile) {
      setError("Please upload an image.");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (tab === "image") {
        // ── Image analysis: use FormData (not JSON) ──────────────
        // FormData is used when sending files — like a HTML form upload
        const formData = new FormData();
        formData.append("image", imageFile);  // key must match backend

        response = await fetch(`${API_BASE}/analyze/image`, {
          method: "POST",
          // NOTE: Do NOT set Content-Type header for FormData
          // The browser sets it automatically with the correct boundary
          body: formData,
        });

      } else {
        // ── Text analysis: send JSON ───────────────────────────
        response = await fetch(`${API_BASE}/analyze/text`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ text: textToAnalyze }),
        });
      }

      // Parse the JSON response from Flask
      const data = await response.json();

      // Check for API-level errors
      if (!response.ok || data.error) {
        setError(data.error || `Server error: ${response.status}`);
        return;
      }

      // Update state with result — React will re-render automatically
      setResult(data);

    } catch (e) {
      // Network error — backend probably not running
      setError(
        "Cannot connect to backend. Make sure Flask is running: python app.py"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Click a news headline → analyze it ───────────────────────
  function analyzeHeadline(headline) {
    setTab("text");
    setTextInput(headline);
    analyze(headline);
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="wrapper">

        {/* ════ HEADER ════ */}
        <header className="header fade-up">
          <div className="logo-row">
            <div className="logo-icon">🛡</div>
            <div>
              <div className="logo-title">Fake News Detection</div>
              <div className="logo-sub">Multimodal AI Powered System</div>
            </div>
          </div>

          {/* Backend connection status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {backendOk === null && (
              <span className="status-badge">Connecting…</span>
            )}
            {backendOk === true && (
              <span className="status-badge connected">● Backend Connected</span>
            )}
            {backendOk === false && (
              <span className="status-badge error">
                ✗ Backend offline — run: python app.py
              </span>
            )}
          </div>
        </header>

        {/* ════ MAIN GRID ════ */}
        <div className="main-grid">

          {/* ── Left Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Input Panel */}
            <div className="panel fade-up-1">
              <div className="panel-title">
                <div className="dot" /> Input Analysis
              </div>

              {/* Tab buttons */}
              <div className="tab-row">
                {[["text", "📝 Text"], ["image", "🖼 Image"], ["url", "🔗 URL"]].map(([t, label]) => (
                  <button
                    key={t}
                    className={`tab-btn ${tab === t ? "active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Text input tab */}
              {tab === "text" && (
                <div>
                  <textarea
                    className="text-input"
                    placeholder="Paste a news headline or article to analyze for misinformation..."
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                  />
                  {/* Sample text buttons */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                      Try:
                    </span>
                    {SAMPLES.map((s, i) => (
                      <button key={i} className="sample-btn" onClick={() => setTextInput(s)}>
                        {s.slice(0, 42)}…
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image upload tab */}
              {tab === "image" && (
                <div>
                  <div
                    className={`upload-zone ${imageFile ? "" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("dragging"); }}
                    onDragLeave={e => e.currentTarget.classList.remove("dragging")}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("dragging");
                      handleImageSelect(e.dataTransfer.files[0]);
                    }}
                  >
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} alt="preview"
                          style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }}/>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                          {imageFile.name}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🖼</div>
                        <p style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
                          Drop image here or click to upload
                        </p>
                        <p style={{ color: "var(--text-3)", fontSize: "0.72rem", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                          JPG · PNG · WEBP supported
                        </p>
                      </div>
                    )}
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => handleImageSelect(e.target.files[0])}
                    />
                  </div>
                </div>
              )}

              {/* URL tab */}
              {tab === "url" && (
                <div>
                  <input
                    type="url"
                    className="text-input"
                    style={{ minHeight: "auto", padding: "11px 14px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                    placeholder="https://example.com/news-article"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                  />
                  <p style={{ fontSize: "0.72rem", color: "var(--text-2)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                    Paste article URL — Claude will analyze the headline &amp; visible content
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && <div className="error-box">⚠ {error}</div>}

              {/* Analyze button */}
              <button
                className="analyze-btn"
                onClick={() => analyze()}
                disabled={loading}
              >
                {loading ? <><Spinner /> Analyzing…</> : <><span>⚡</span> Run Analysis</>}
              </button>
            </div>

            {/* Results Panel */}
            {(loading || result) && (
              <div className="panel fade-up" style={{ position: "relative", overflow: "hidden" }}>
                {loading && <div className="scan-line" />}
                <div className="panel-title"><div className="dot" /> Analysis Results</div>

                {loading && (
                  <div style={{ padding: "28px 0", textAlign: "center" }}>
                    <p style={{ color: "var(--text-2)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", animation: "pulse 1.5s ease-in-out infinite" }}>
                      Sending to Flask → Claude API → Analyzing → Building verdict…
                    </p>
                  </div>
                )}

                {result && <ResultPanel result={result} />}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stats */}
            <div className="stats-grid fade-up-1">
              {[["Model", "Claude"], ["Mode", "Multimodal"], ["Verdicts", "4-class"], ["Source", "Flask API"]].map(([l, v]) => (
                <div key={l} className="stat-card">
                  <div className="stat-label">{l}</div>
                  <div className="stat-value" style={{ fontSize: "0.9rem" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Live News */}
            <div className="panel fade-up-2">
              <div className="panel-title" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="dot dot-pulse" /> Live Headlines
                </div>
                <button
                  onClick={fetchNews}
                  style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 9px", color: "var(--text-2)", fontSize: "0.65rem", cursor: "pointer", fontFamily: "var(--font-mono)" }}
                >
                  ↻ Refresh
                </button>
              </div>

              {newsLoading ? (
                <p style={{ color: "var(--text-3)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                  Fetching headlines…
                </p>
              ) : news.length === 0 ? (
                <p style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>No headlines loaded.</p>
              ) : (
                news.map((item, i) => (
                  <div key={i} className="news-item" onClick={() => analyzeHeadline(item.title)}>
                    <div className="news-title">{item.title}</div>
                    <div className="news-meta">
                      <span className="news-source">{item.source}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Verdict Guide */}
            <div className="panel fade-up-2">
              <div className="panel-title"><div className="dot" /> Verdict Guide</div>
              {Object.entries(VERDICTS).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div
                    style={{ width: 18, height: 18, borderRadius: "50%", background: v.color, color: "#000",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, fontSize: 10, flexShrink: 0 }}
                  >
                    {v.icon}
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: v.color, fontFamily: "var(--font-head)", letterSpacing: "0.04em" }}>
                    {v.label}
                  </span>
                </div>
              ))}
            </div>

            {/* API Architecture note */}
            <div className="panel fade-up-2" style={{ padding: "14px 16px" }}>
              <div className="panel-title"><div className="dot" /> Architecture</div>
              {[
                ["Frontend", "HTML + React (port 5500)"],
                ["Backend",  "Flask Python (port 5001)"],
                ["AI Model", "Claude via Anthropic SDK"],
                ["Text API", "POST /api/analyze/text"],
                ["Image API","POST /api/analyze/image"],
                ["News API", "GET  /api/news"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.72rem" }}>
                  <span style={{ color: "var(--text-2)" }}>{k}</span>
                  <span style={{ color: "var(--cyan)", fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>{v}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>Fake News Detection © 2025 — Flask + React + Groq AI</span>
          <span>Text · Image · NER · Fact-Check · XAI</span>
        </div>

      </div>
    </div>
  );
}

// ── Mount React app to the DOM ────────────────────────────────
// This tells React to render our App component inside <div id="root">
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
