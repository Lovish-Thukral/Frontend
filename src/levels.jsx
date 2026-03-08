import { useState, useEffect, useRef } from "react";

// ── tiny helpers ──────────────────────────────────────────────
const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className="w-5 h-5 opacity-50">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CHECK_ICON = (checked) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    className={`w-4 h-4 transition-all duration-300 ${checked ? "opacity-100" : "opacity-0"}`}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── sample tasks generator (replace with real API data) ───────
function generateTasks(chapter) {
  return [
    {
      id: 1,
      title: `Study: ${chapter.title}`,
      description: `Deep-dive into "${chapter.focus}". Read documentation, watch a 20-min explainer, and take notes on key concepts.`,
    },
    {
      id: 2,
      title: "Hands-on Exercise",
      description: `Practical lab — ${chapter.focus}. Spin up a sandbox environment and implement what you've read.`,
    },
    {
      id: 3,
      title: "Quiz & Review",
      description: "Answer 5 self-assessment questions to solidify today's concepts. Write 3 key takeaways in your notes.",
    },
  ];
}

// ── main component ────────────────────────────────────────────
export default function Levels() {
  const [userData, setUserData] = useState(null);
  const [checkedTasks, setCheckedTasks] = useState({});   // { "day-taskId": bool }
  const [activeChapter, setActiveChapter] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nextep_user");
      if (raw) setUserData(JSON.parse(raw));
      else setUserData({});
    } catch {
      setUserData({});
    }
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        closeDrawer();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  function openChapter(chapter) {
    if (chapter.locked) return;
    setActiveChapter({ ...chapter, tasks: generateTasks(chapter) });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setActiveChapter(null), 350);
  }

  async function toggleTask(taskId) {
    const key = `${activeChapter.day}-${taskId}`;
    const next = !checkedTasks[key];
    setCheckedTasks((prev) => ({ ...prev, [key]: next }));

    // TODO: call real API
    // await fetch("/api/tasks/complete", {
    //   method: "POST",
    //   body: JSON.stringify({ day: activeChapter.day, taskId, completed: next }),
    // });
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  const roadmap = userData.roadmapHistory?.[0];
  if (!roadmap) return (
    <div style={{ minHeight: "100vh", background: "#080b14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "sans-serif", color: "#475569", fontSize: "0.95rem" }}>No roadmap found.</p>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .levels-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080b14;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 60%);
          color: #e2e8f0;
          padding: 2.5rem 2rem 4rem;
          overflow-x: hidden;
        }

        /* ── header ── */
        .lv-header { margin-bottom: 2.8rem; }
        .lv-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 0.4rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .lv-eyebrow::before {
          content: '';
          display: inline-block; width: 18px; height: 2px;
          background: #6366f1; border-radius: 2px;
        }
        .lv-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .lv-title span { color: #6366f1; }
        .lv-subtitle {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 300;
        }

        /* ── progress strip ── */
        .lv-progress-bar {
          margin-top: 1.2rem;
          height: 3px;
          background: rgba(99,102,241,0.15);
          border-radius: 4px;
          max-width: 220px;
          overflow: hidden;
        }
        .lv-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 4px;
          transition: width 0.8s ease;
        }

        /* ── unit section ── */
        .lv-unit { margin-bottom: 3rem; }
        .lv-unit-header {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 1.4rem;
        }
        .lv-unit-badge {
          font-family: 'Syne', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6366f1;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          padding: 0.25rem 0.65rem;
          border-radius: 100px;
        }
        .lv-unit-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: -0.01em;
        }
        .lv-unit-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(99,102,241,0.2), transparent);
        }

        /* ── chapter grid ── */
        .lv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.9rem;
        }

        /* ── chapter card ── */
        .lv-card {
          position: relative;
          border-radius: 14px;
          padding: 1.2rem 1.1rem 1rem;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,20,35,0.85);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          overflow: hidden;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .lv-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .lv-card.unlocked:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(99,102,241,0.22);
          border-color: rgba(99,102,241,0.4);
        }
        .lv-card.locked {
          cursor: default;
          opacity: 0.45;
          filter: grayscale(0.4);
        }
        .lv-card.completed {
          border-color: rgba(16,185,129,0.35);
          background: rgba(16,185,129,0.06);
        }
        .lv-card.completed::before {
          background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 60%);
        }
        .lv-card.completed:hover {
          box-shadow: 0 12px 32px rgba(16,185,129,0.18);
          border-color: rgba(16,185,129,0.5);
        }

        .lv-card-day {
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #475569;
        }
        .lv-card.completed .lv-card-day { color: #10b981; }

        .lv-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }
        .lv-card.locked .lv-card-title { color: #475569; }

        .lv-card-focus {
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.4;
          font-weight: 300;
        }

        .lv-card-footer {
          margin-top: auto;
          padding-top: 0.7rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lv-card-status {
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex; align-items: center; gap: 0.35rem;
        }
        .lv-card-status.open { color: #6366f1; }
        .lv-card-status.done { color: #10b981; }
        .lv-card-status.locked { color: #334155; }
        .lv-status-dot {
          width: 5px; height: 5px; border-radius: 50%;
        }
        .open .lv-status-dot { background: #6366f1; box-shadow: 0 0 6px #6366f1; }
        .done .lv-status-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
        .locked .lv-status-dot { background: #334155; }

        /* ── overlay ── */
        .lv-overlay {
          position: fixed; inset: 0;
          background: rgba(8,11,20,0.7);
          backdrop-filter: blur(4px);
          z-index: 40;
          transition: opacity 0.3s ease;
        }
        .lv-overlay.hidden { opacity: 0; pointer-events: none; }

        /* ── drawer ── */
        .lv-drawer {
          position: fixed;
          top: 0; right: 0;
          width: min(440px, 100vw);
          height: 100vh;
          background: #0d1220;
          border-left: 1px solid rgba(99,102,241,0.18);
          z-index: 50;
          display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
          overflow: hidden;
        }
        .lv-drawer.open { transform: translateX(0); }

        /* accent top stripe */
        .lv-drawer-stripe {
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #818cf8, #10b981);
          flex-shrink: 0;
        }

        .lv-drawer-header {
          padding: 1.5rem 1.6rem 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .lv-drawer-close {
          position: absolute;
          top: 1rem; right: 1.2rem;
          background: rgba(255,255,255,0.05);
          border: none;
          color: #64748b;
          width: 32px; height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .lv-drawer-close:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

        .lv-drawer-day {
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 0.35rem;
        }
        .lv-drawer-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          padding-right: 2rem;
        }
        .lv-drawer-focus {
          margin-top: 0.4rem;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 300;
        }

        /* ── tasks list ── */
        .lv-tasks {
          flex: 1; overflow-y: auto;
          padding: 1.4rem 1.6rem;
          display: flex; flex-direction: column; gap: 0.9rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.2) transparent;
        }
        .lv-tasks::-webkit-scrollbar { width: 4px; }
        .lv-tasks::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.25); border-radius: 2px;
        }

        .lv-task {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem 1rem 1rem 0.9rem;
          display: flex; gap: 0.9rem; align-items: flex-start;
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .lv-task:hover {
          background: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.2);
        }
        .lv-task.done {
          background: rgba(16,185,129,0.05);
          border-color: rgba(16,185,129,0.2);
        }

        .lv-checkbox {
          width: 22px; height: 22px;
          border-radius: 6px;
          border: 1.5px solid rgba(99,102,241,0.4);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          transition: background 0.2s, border-color 0.2s;
          color: #fff;
        }
        .lv-task.done .lv-checkbox {
          background: #10b981;
          border-color: #10b981;
        }

        .lv-task-body { flex: 1; min-width: 0; }
        .lv-task-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 0.3rem;
          letter-spacing: -0.01em;
        }
        .lv-task.done .lv-task-title {
          color: #64748b;
          text-decoration: line-through;
          text-decoration-color: rgba(100,116,139,0.5);
        }
        .lv-task-desc {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.5;
          font-weight: 300;
        }

        /* tasks header */
        .lv-tasks-heading {
          font-family: 'Syne', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 0.3rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lv-tasks-count {
          background: rgba(99,102,241,0.12);
          color: #818cf8;
          font-size: 0.62rem;
          padding: 0.15rem 0.55rem;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0;
        }

        /* ── responsive ── */
        @media (max-width: 480px) {
          .lv-grid { grid-template-columns: 1fr 1fr; }
          .levels-root { padding: 1.5rem 1rem 3rem; }
        }
      `}</style>

      <div className="levels-root">
        {/* ── Header ── */}
        <header className="lv-header">
          <p className="lv-eyebrow">Learning Path</p>
          <h1 className="lv-title">
            {roadmap.topic.split(" ").slice(0, -1).join(" ")}{" "}
            <span>{roadmap.topic.split(" ").slice(-1)}</span>
          </h1>
          <p className="lv-subtitle">
            {userData.name ? `Welcome back, ${userData.name}. ` : ""}
            Complete each day to unlock the next.
          </p>
          <div className="lv-progress-bar">
            <div
              className="lv-progress-fill"
              style={{ width: `${Math.max(2, roadmap.progress)}%` }}
            />
          </div>
        </header>

        {/* ── Units ── */}
        {roadmap.units.map((unit) => (
          <section key={unit.unit_number} className="lv-unit">
            <div className="lv-unit-header">
              <span className="lv-unit-badge">Unit {unit.unit_number}</span>
              <span className="lv-unit-title">{unit.unit_title}</span>
              <div className="lv-unit-line" />
            </div>

            <div className="lv-grid">
              {unit.chapters.map((ch) => {
                const status = ch.locked ? "locked" : ch.completed ? "completed" : "open";
                return (
                  <div
                    key={ch.day}
                    className={`lv-card ${status === "locked" ? "locked" : ""} ${status === "completed" ? "completed" : "unlocked"}`}
                    onClick={() => openChapter(ch)}
                  >
                    <span className="lv-card-day">Day {ch.day}</span>
                    <span className="lv-card-title">{ch.title}</span>
                    <span className="lv-card-focus">{ch.focus}</span>
                    <div className="lv-card-footer">
                      {status === "locked" && (
                        <span className={`lv-card-status locked`}>
                          <span className="lv-status-dot" /> Locked
                        </span>
                      )}
                      {status === "open" && (
                        <span className={`lv-card-status open`}>
                          <span className="lv-status-dot" /> Open
                        </span>
                      )}
                      {status === "completed" && (
                        <span className={`lv-card-status done`}>
                          <span className="lv-status-dot" /> Done
                        </span>
                      )}
                      {status === "locked" && LOCK_ICON}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ── Overlay ── */}
      <div
        className={`lv-overlay ${drawerOpen ? "" : "hidden"}`}
        onClick={closeDrawer}
      />

      {/* ── Task Drawer ── */}
      <aside
        ref={drawerRef}
        className={`lv-drawer ${drawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="lv-drawer-stripe" />

        {activeChapter && (
          <>
            <div className="lv-drawer-header" style={{ position: "relative" }}>
              <p className="lv-drawer-day">Day {activeChapter.day}</p>
              <h2 className="lv-drawer-title">{activeChapter.title}</h2>
              <p className="lv-drawer-focus">{activeChapter.focus}</p>
              <button className="lv-drawer-close" onClick={closeDrawer} aria-label="Close">
                {CLOSE_ICON}
              </button>
            </div>

            <div className="lv-tasks">
              <div className="lv-tasks-heading">
                Today's Tasks
                <span className="lv-tasks-count">
                  {activeChapter.tasks.filter((t) => checkedTasks[`${activeChapter.day}-${t.id}`]).length}
                  /{activeChapter.tasks.length}
                </span>
              </div>

              {activeChapter.tasks.map((task) => {
                const key = `${activeChapter.day}-${task.id}`;
                const done = !!checkedTasks[key];
                return (
                  <div
                    key={task.id}
                    className={`lv-task ${done ? "done" : ""}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className="lv-checkbox">{CHECK_ICON(done)}</div>
                    <div className="lv-task-body">
                      <p className="lv-task-title">{task.title}</p>
                      <p className="lv-task-desc">{task.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>
    </>
  );
}