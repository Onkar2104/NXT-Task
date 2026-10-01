import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const sourceLabels = {
  whatsapp: "WhatsApp communities",
  club: "College clubs",
  referral: "Peer referrals",
  email: "Email",
  direct: "Direct",
};

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("source") || (params.get("ref") ? "referral" : "direct"),
    referralCode: params.get("ref") || "",
  };
}

function App() {
  const query = useMemo(getQueryParams, []);
  const [view, setView] = useState("register");
  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "",
    branch: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  const submitRegistration = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: query.source,
          referral_code: query.referralCode || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    setView("dashboard");
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load dashboard.");
      setDashboard(data);
      setView("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "dashboard" && !dashboard) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const shareUrl = success
    ? `${window.location.origin}?ref=${encodeURIComponent(success.student.referral_code)}`
    : "";

  const shareOnWhatsApp = () => {
    const message = `I just registered for NxtWave's free "Build Your First AI Project in 60 Minutes" workshop. Join me: ${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">N</span>
          <div>
            <strong>NxtWave Growth Prototype</strong>
            <span>AI Workshop Registration Engine</span>
          </div>
        </div>
        <nav>
          <button
            className={view === "register" ? "nav-btn active" : "nav-btn"}
            onClick={() => setView("register")}
          >
            Register
          </button>
          <button
            className={view === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={loadDashboard}
          >
            Growth Dashboard
          </button>
        </nav>
      </header>

      {view === "register" ? (
        <main className="hero">
          <section className="hero-copy">
            <div className="eyebrow">FREE • BEGINNER FRIENDLY • 60 MINUTES</div>
            <h1>Build Your First <span>AI Project</span> in 60 Minutes.</h1>
            <p className="lead">
              A practical workshop designed for final-year engineering students.
              Stop only learning about AI. Build something with it.
            </p>

            <div className="promise-grid">
              <div>
                <b>01</b>
                <span>Learn a practical AI workflow</span>
              </div>
              <div>
                <b>02</b>
                <span>Build your first project</span>
              </div>
              <div>
                <b>03</b>
                <span>Share it with your peers</span>
              </div>
            </div>

            <div className="growth-loop">
              <div className="loop-label">GROWTH LOOP</div>
              <div className="loop">
                <span>Register</span>
                <i>→</i>
                <span>Get code</span>
                <i>→</i>
                <span>Share</span>
                <i>→</i>
                <span>More students</span>
              </div>
            </div>
          </section>

          <section className="card registration-card">
            {!success ? (
              <>
                <div className="card-heading">
                  <div>
                    <div className="tiny-label">
                      {query.referralCode ? "REFERRED REGISTRATION" : "WORKSHOP REGISTRATION"}
                    </div>
                    <h2>Reserve your spot</h2>
                  </div>
                  {query.referralCode && (
                    <span className="ref-badge">Code {query.referralCode}</span>
                  )}
                </div>

                <form onSubmit={submitRegistration}>
                  <label>
                    Full name
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </label>

                  <label>
                    Email
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label>
                    College
                    <input
                      required
                      value={form.college}
                      onChange={(e) => setForm({ ...form, college: e.target.value })}
                      placeholder="College / university"
                    />
                  </label>

                  <label>
                    Branch
                    <input
                      required
                      value={form.branch}
                      onChange={(e) => setForm({ ...form, branch: e.target.value })}
                      placeholder="CSE / IT / ECE / ..."
                    />
                  </label>

                  {error && <div className="error">{error}</div>}

                  <button className="primary-btn" type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register for free →"}
                  </button>

                  <p className="microcopy">
                    Your details are used only for the workshop registration demo.
                  </p>
                </form>
              </>
            ) : (
              <div className="success-state">
                <div className="success-icon">✓</div>
                <div className="tiny-label">REGISTRATION CONFIRMED</div>
                <h2>You're in, {success.student.name.split(" ")[0]}.</h2>
                <p>
                  Your personal referral code is
                  <strong>{success.student.referral_code}</strong>.
                </p>

                <button className="whatsapp-btn" onClick={shareOnWhatsApp}>
                  Share with friends on WhatsApp
                </button>

                <div className="referral-box">
                  <span>YOUR REFERRAL LINK</span>
                  <code>{shareUrl}</code>
                  <button
                    className="secondary-btn"
                    onClick={() => navigator.clipboard?.writeText(shareUrl)}
                  >
                    Copy link
                  </button>
                </div>

                <p className="microcopy">
                  Bring your friends. The campaign can measure the referral source
                  for every new registration.
                </p>
              </div>
            )}
          </section>
        </main>
      ) : (
        <main className="dashboard-page">
          <div className="dashboard-head">
            <div>
              <div className="eyebrow">CAMPAIGN CONTROL CENTER</div>
              <h1>500 registrations, tracked by source.</h1>
              <p>
                Live data from the FastAPI + SQLite registration engine.
              </p>
            </div>
            <button className="secondary-btn" onClick={loadDashboard}>
              Refresh data
            </button>
          </div>

          {error && <div className="error dashboard-error">{error}</div>}

          {dashboard && (
            <>
              <section className="stats-grid">
                <StatCard
                  label="Registrations"
                  value={dashboard.total_registrations}
                  suffix={`/ ${dashboard.target}`}
                />
                <StatCard
                  label="Remaining"
                  value={dashboard.remaining}
                />
                <StatCard
                  label="Conversion engine"
                  value={Object.values(dashboard.source_counts).reduce((a, b) => a + b, 0)}
                />
                <StatCard
                  label="Top referrer"
                  value={dashboard.leaderboard[0]?.referrals || 0}
                  suffix=" referrals"
                />
              </section>

              <section className="dashboard-grid">
                <div className="card source-card">
                  <div className="section-title">
                    <div>
                      <div className="tiny-label">ACQUISITION</div>
                      <h2>Where registrations came from</h2>
                    </div>
                  </div>

                  {Object.entries(dashboard.source_targets)
                    .filter(([key]) => ["whatsapp", "club", "referral"].includes(key))
                    .map(([key, target]) => {
                      const value = dashboard.source_counts[key] || 0;
                      const pct = Math.min((value / target) * 100, 100);
                      return (
                        <div className="source-row" key={key}>
                          <div className="source-meta">
                            <span>{sourceLabels[key]}</span>
                            <strong>{value} / {target}</strong>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="card leaderboard-card">
                  <div className="section-title">
                    <div>
                      <div className="tiny-label">REFERRAL LOOP</div>
                      <h2>Top student referrers</h2>
                    </div>
                  </div>

                  {dashboard.leaderboard.length === 0 ? (
                    <div className="empty">No registrations yet.</div>
                  ) : (
                    <div className="leaderboard">
                      {dashboard.leaderboard.map((student, index) => (
                        <div className="leader-row" key={student.referral_code}>
                          <span className="rank">{index + 1}</span>
                          <div>
                            <strong>{student.name}</strong>
                            <small>{student.referral_code}</small>
                          </div>
                          <b>{student.referrals}</b>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix = "" }) {
  return (
    <div className="card stat-card">
      <span>{label}</span>
      <strong>{value}<small>{suffix}</small></strong>
    </div>
  );
}

export default App;
