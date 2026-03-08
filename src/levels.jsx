import { useState, useEffect, useRef, useCallback } from "react";

// ── tiny helpers ──────────────────────────────────────────────
const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, opacity: 0.5 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CHECK_ICON = ({ checked }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ width: 14, height: 14, opacity: checked ? 1 : 0, transition: "opacity 0.2s" }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CLOSE_ICON = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PLUS_ICON = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}>
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SPARKLE_ICON = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const API = import.meta.env.VITE_API_BASE_URL ?? "";

// ── main component ────────────────────────────────────────────
export default function Levels() {
  const [userData, setUserData]         = useState(null);
  const [loading, setLoading]           = useState(true);

  // task drawer
  const [activeChapter, setActiveChapter] = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [tasks, setTasks]                 = useState([]);
  const [tasksLoading, setTasksLoading]   = useState(false);
  const [checkedTasks, setCheckedTasks]   = useState({});
  const [completing, setCompleting]       = useState(false);
  const [completeError, setCompleteError] = useState("");

  // create panel
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [roadmapTopic, setRoadmapTopic]       = useState("");
  const [roadmapDuration, setRoadmapDuration] = useState("30");
  const [creating, setCreating]               = useState(false);
  const [createError, setCreateError]         = useState("");

  const drawerRef      = useRef(null);
  const createPanelRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────

  /** Always read the freshest copy from localStorage */
  const refreshUserData = useCallback(() => {
    try {
      const raw = localStorage.getItem("nextep_user");
      setUserData(raw ? JSON.parse(raw) : {});
    } catch {
      setUserData({});
    }
  }, []);

  /** Write mutated userData back to localStorage and into state */
  const persistUserData = useCallback((next) => {
    try { localStorage.setItem("nextep_user", JSON.stringify(next)); } catch {}
    setUserData(next);
  }, []);

  // ── initial load ─────────────────────────────────────────────
  useEffect(() => {
    refreshUserData();
    setLoading(false);
  }, [refreshUserData]);

  // ── outside-click handlers ───────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target)) closeDrawer();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [drawerOpen]);

  useEffect(() => {
    const h = (e) => {
      if (createPanelOpen && createPanelRef.current && !createPanelRef.current.contains(e.target))
        setCreatePanelOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [createPanelOpen]);

  // ── drawer open / close ──────────────────────────────────────
  async function openChapter(chapter, unitIndex) {
    if (chapter.locked) return;
    setActiveChapter({ ...chapter, unitIndex });
    setCheckedTasks({});
    setCompleteError("");
    setDrawerOpen(true);
    setTasksLoading(true);
    setTasks([]);

    try {
      // Fetch real tasks for this chapter from the server

      const res = await fetch(`${API}/main/getTasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData?.name,
          day: chapter.day,
          unitIndex,
        }),
      });
      console.log(res)
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Expected shape: { tasks: [{ id, title, description }] }
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      console.error("getTasks failed:", err);
      // Fallback: show generic tasks so UI isn't broken
      setTasks([
        { id: 1, title: `Study: ${chapter.title}`,    description: `Deep-dive into "${chapter.focus}". Read docs and take notes.` },
        { id: 2, title: "Hands-on Exercise",           description: `Practical lab — ${chapter.focus}.` },
        { id: 3, title: "Quiz & Review",               description: "Answer 5 self-assessment questions and write 3 key takeaways." },
      ]);
    } finally {
      setTasksLoading(false);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setActiveChapter(null);
      setTasks([]);
      setCheckedTasks({});
      setCompleteError("");
    }, 350);
  }

  function toggleTask(taskId) {
    setCheckedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  // ── mark complete ────────────────────────────────────────────
  async function markComplete() {
    if (completing || !activeChapter) return;
    setCompleting(true);
    setCompleteError("");
    try {
      const res = await fetch(`${API}/main/markComplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      userData?.name,
          Day:       activeChapter.day,
          unitIndex: activeChapter.unitIndex,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // The server should return the updated user object so we stay in sync.
      // If it does, persist it. If not, re-read localStorage (server may have
      // updated it on its own, depending on your architecture).
      let updated;
      try { updated = await res.json(); } catch {}

      if (updated?.name) {
        // Server returned fresh user data — persist it
        persistUserData(updated);
      } else {
        // Manually unlock the next day in local state so UI reflects change
        // without requiring a full page reload.
        setUserData((prev) => {
          if (!prev?.roadmapHistory?.[0]) return prev;
          const clone = JSON.parse(JSON.stringify(prev));
          const rm    = clone.roadmapHistory[0];

          // Mark current chapter complete & unlock the next one
          for (let u = 0; u < rm.units.length; u++) {
            const unit = rm.units[u];
            for (let i = 0; i < unit.chapters.length; i++) {
              const ch = unit.chapters[i];
              if (ch.day === activeChapter.day) {
                ch.completed = true;
                // unlock next chapter in same unit
                if (unit.chapters[i + 1]) {
                  unit.chapters[i + 1].locked = false;
                } else if (rm.units[u + 1]?.chapters?.[0]) {
                  // last chapter of unit — unlock first of next unit
                  rm.units[u + 1].chapters[0].locked = false;
                }
              }
            }
          }

          // Update progress percentage
          const allChapters = rm.units.flatMap((u) => u.chapters);
          const doneCount   = allChapters.filter((c) => c.completed).length;
          rm.progress = Math.round((doneCount / allChapters.length) * 100);

          try { localStorage.setItem("nextep_user", JSON.stringify(clone)); } catch {}
          return clone;
        });
      }

      closeDrawer();
    } catch (err) {
      console.error("markComplete failed:", err);
      setCompleteError("Failed to save progress. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  // ── create roadmap ───────────────────────────────────────────
  async function handleCreateRoadmap() {
    if (!roadmapTopic.trim()) {
      setCreateError("Please enter a topic to get started.");
      return;
    }
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`${API}/main/createRoadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: {
            field_query: roadmapTopic.trim(),
            days: roadmapDuration,
          },
          name:      userData?.name,
          RIASECval: JSON.parse(localStorage.getItem("riasec")  || "{}"),
          SAFIAVAL:  JSON.parse(localStorage.getItem("sifa")    || "{}"),
          Skills:    JSON.parse(localStorage.getItem("skills")  || "[]"),
        }),
      });
      console.log(res)
      if (!res.ok) throw new Error(`HTTP ${res.status}, ${res.data}`);

      // If the server returns the new user object, persist before reload
      try {
        const data = await res.json();
        if (data?.name) persistUserData(data);
      } catch {}

      window.location.reload();
    } catch (err) {
      console.log("createRoadmap failed:", err, res.data);
      setCreateError("Something went wrong. Please try again.");
      setCreating(false);
    }
  }

  // ── render guards ────────────────────────────────────────────
  if (loading || !userData) {
    return (
      <div style={{ minHeight: "100vh", background: "#080b14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const roadmap   = userData.roadmapHistory?.[0];
  const allTasks  = tasks;
  const doneCount = allTasks.filter((t) => checkedTasks[t.id]).length;
  const allDone   = allTasks.length > 0 && doneCount === allTasks.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lv-root {
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

        /* header */
        .lv-header { margin-bottom: 2.8rem; }
        .lv-header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
        .lv-eyebrow {
          font-size: 0.72rem; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase;
          color: #6366f1; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .lv-eyebrow::before { content:''; display:inline-block; width:18px; height:2px; background:#6366f1; border-radius:2px; }
        .lv-title {
          font-family: 'Syne', sans-serif; font-size: clamp(1.8rem,4vw,2.6rem);
          font-weight: 800; color: #f1f5f9; line-height: 1.1; letter-spacing: -0.02em;
        }
        .lv-title span { color: #6366f1; }
        .lv-subtitle { margin-top: 0.5rem; font-size: 0.9rem; color: #64748b; font-weight: 300; }

        .lv-progress-bar { margin-top:1.2rem; height:3px; background:rgba(99,102,241,0.15); border-radius:4px; max-width:220px; overflow:hidden; }
        .lv-progress-fill { height:100%; background:linear-gradient(90deg,#6366f1,#818cf8); border-radius:4px; transition:width 0.8s ease; }

        /* new roadmap btn */
        .lv-create-btn {
          flex-shrink: 0; display: flex; align-items: center; gap: 0.45rem;
          padding: 0.6rem 1.1rem; border-radius: 10px;
          border: 1px solid rgba(99,102,241,0.35); background: rgba(99,102,241,0.1);
          color: #818cf8; font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700;
          cursor: pointer; white-space: nowrap; margin-top: 0.2rem;
          transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .lv-create-btn:hover { background:rgba(99,102,241,0.2); border-color:rgba(99,102,241,0.6); color:#c7d2fe; box-shadow:0 4px 18px rgba(99,102,241,0.25); transform:translateY(-1px); }
        .lv-create-btn.active { background:rgba(99,102,241,0.22); border-color:#6366f1; color:#c7d2fe; }

        /* units */
        .lv-unit { margin-bottom: 4rem; }
        .lv-unit-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.4rem; }
        .lv-unit-badge {
          font-family:'Syne',sans-serif; font-size:0.62rem; font-weight:700; letter-spacing:0.16em;
          text-transform:uppercase; color:#6366f1; background:rgba(99,102,241,0.1);
          border:1px solid rgba(99,102,241,0.25); padding:0.25rem 0.65rem; border-radius:100px;
        }
        .lv-unit-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:#94a3b8; }
        .lv-unit-line { flex:1; height:1px; background:linear-gradient(90deg,rgba(99,102,241,0.2),transparent); }

        /* grid */
        .lv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1.1rem; }

        /* card */
        .lv-card {
          position:relative; border-radius:14px; padding:1.4rem 1.2rem 1.1rem;
          border:1px solid rgba(255,255,255,0.06); background:rgba(15,20,35,0.85);
          backdrop-filter:blur(10px); cursor:pointer;
          transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s;
          overflow:hidden; display:flex; flex-direction:column; gap:0.5rem;
        }
        .lv-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(99,102,241,0.06) 0%,transparent 60%); pointer-events:none; }
        .lv-card.open:hover,.lv-card.completed:hover { transform:translateY(-3px); }
        .lv-card.open:hover     { box-shadow:0 12px 32px rgba(99,102,241,0.22); border-color:rgba(99,102,241,0.4); }
        .lv-card.locked         { cursor:default; opacity:0.45; filter:grayscale(0.4); }
        .lv-card.completed      { border-color:rgba(16,185,129,0.35); background:rgba(16,185,129,0.06); }
        .lv-card.completed::before { background:linear-gradient(135deg,rgba(16,185,129,0.08) 0%,transparent 60%); }
        .lv-card.completed:hover   { box-shadow:0 12px 32px rgba(16,185,129,0.18); border-color:rgba(16,185,129,0.5); }

        .lv-card-day { font-size:0.62rem; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:#475569; }
        .lv-card.completed .lv-card-day { color:#10b981; }
        .lv-card-title { font-family:'Syne',sans-serif; font-size:0.88rem; font-weight:700; color:#e2e8f0; line-height:1.35; }
        .lv-card.locked .lv-card-title { color:#475569; }
        .lv-card-focus { font-size:0.74rem; color:#64748b; line-height:1.4; font-weight:300; }
        .lv-card-footer { margin-top:auto; padding-top:0.7rem; display:flex; align-items:center; justify-content:space-between; }
        .lv-card-status { font-size:0.65rem; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; display:flex; align-items:center; gap:0.35rem; }
        .lv-card-status.open      { color:#6366f1; }
        .lv-card-status.done      { color:#10b981; }
        .lv-card-status.locked    { color:#334155; }
        .lv-dot { width:5px; height:5px; border-radius:50%; }
        .lv-card-status.open   .lv-dot { background:#6366f1; box-shadow:0 0 6px #6366f1; }
        .lv-card-status.done   .lv-dot { background:#10b981; box-shadow:0 0 6px #10b981; }
        .lv-card-status.locked .lv-dot { background:#334155; }

        /* empty state */
        .lv-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:50vh; gap:1.2rem; text-align:center; }
        .lv-empty-icon { width:64px; height:64px; border-radius:20px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); display:flex; align-items:center; justify-content:center; color:#6366f1; font-size:1.6rem; }
        .lv-empty-title { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:700; color:#475569; }
        .lv-empty-sub { font-size:0.85rem; color:#334155; max-width:260px; line-height:1.5; }
        .lv-empty-cta {
          padding:0.7rem 1.4rem; border-radius:10px; background:linear-gradient(135deg,#6366f1,#818cf8);
          color:#fff; font-family:'Syne',sans-serif; font-size:0.85rem; font-weight:700; border:none;
          cursor:pointer; display:flex; align-items:center; gap:0.4rem;
          transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
          box-shadow:0 4px 18px rgba(99,102,241,0.3);
        }
        .lv-empty-cta:hover { opacity:0.9; transform:translateY(-1px); box-shadow:0 8px 24px rgba(99,102,241,0.4); }

        /* overlay */
        .lv-overlay { position:fixed; inset:0; background:rgba(8,11,20,0.7); backdrop-filter:blur(4px); z-index:40; transition:opacity 0.3s; }
        .lv-overlay.hidden { opacity:0; pointer-events:none; }

        /* shared panel base */
        .lv-panel {
          position:fixed; top:0; height:100vh; background:#0d1220;
          z-index:50; display:flex; flex-direction:column; overflow:hidden;
          transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
        }
        .lv-panel.right { right:0; width:min(440px,100vw); border-left:1px solid rgba(99,102,241,0.18); transform:translateX(100%); }
        .lv-panel.left  { left:0;  width:min(400px,100vw); border-right:1px solid rgba(99,102,241,0.18); transform:translateX(-100%); }
        .lv-panel.right.open { transform:translateX(0); }
        .lv-panel.left.open  { transform:translateX(0); }

        .lv-stripe-task   { height:3px; background:linear-gradient(90deg,#6366f1,#818cf8,#10b981); flex-shrink:0; }
        .lv-stripe-create { height:3px; background:linear-gradient(90deg,#10b981,#6366f1,#818cf8); flex-shrink:0; }

        .lv-panel-header { padding:1.5rem 1.6rem 1.2rem; border-bottom:1px solid rgba(255,255,255,0.05); flex-shrink:0; position:relative; }
        .lv-panel-tag { font-size:0.65rem; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:0.35rem; display:flex; align-items:center; gap:0.4rem; }
        .lv-panel-tag.indigo { color:#6366f1; }
        .lv-panel-tag.green  { color:#10b981; }
        .lv-panel-tag.indigo::before { content:''; display:inline-block; width:14px; height:2px; background:#6366f1; border-radius:2px; }
        .lv-panel-tag.green::before  { content:''; display:inline-block; width:14px; height:2px; background:#10b981; border-radius:2px; }
        .lv-panel-title { font-family:'Syne',sans-serif; font-size:1.25rem; font-weight:800; color:#f1f5f9; letter-spacing:-0.02em; padding-right:2rem; }
        .lv-panel-sub   { margin-top:0.4rem; font-size:0.8rem; color:#64748b; font-weight:300; line-height:1.5; }
        .lv-panel-close {
          position:absolute; top:1rem; right:1.2rem; background:rgba(255,255,255,0.05);
          border:none; color:#64748b; width:32px; height:32px; border-radius:8px;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:background 0.15s,color 0.15s;
        }
        .lv-panel-close:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }

        /* scrollable body */
        .lv-panel-body {
          flex:1; overflow-y:auto; padding:1.4rem 1.6rem;
          display:flex; flex-direction:column; gap:0.9rem;
          scrollbar-width:thin; scrollbar-color:rgba(99,102,241,0.2) transparent;
        }
        .lv-panel-body::-webkit-scrollbar { width:4px; }
        .lv-panel-body::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.25); border-radius:2px; }

        /* tasks */
        .lv-tasks-heading { font-family:'Syne',sans-serif; font-size:0.68rem; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#475569; margin-bottom:0.3rem; display:flex; align-items:center; justify-content:space-between; }
        .lv-tasks-count { background:rgba(99,102,241,0.12); color:#818cf8; font-size:0.62rem; padding:0.15rem 0.55rem; border-radius:100px; }

        .lv-task {
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
          border-radius:12px; padding:1rem 1rem 1rem 0.9rem;
          display:flex; gap:0.9rem; align-items:flex-start;
          transition:border-color 0.2s,background 0.2s; cursor:pointer;
        }
        .lv-task:hover { background:rgba(99,102,241,0.06); border-color:rgba(99,102,241,0.2); }
        .lv-task.done  { background:rgba(16,185,129,0.05); border-color:rgba(16,185,129,0.2); }

        .lv-checkbox {
          width:22px; height:22px; border-radius:6px; border:1.5px solid rgba(99,102,241,0.4);
          background:transparent; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; margin-top:1px; transition:background 0.2s,border-color 0.2s; color:#fff;
        }
        .lv-task.done .lv-checkbox { background:#10b981; border-color:#10b981; }

        .lv-task-body { flex:1; min-width:0; }
        .lv-task-title { font-family:'Syne',sans-serif; font-size:0.88rem; font-weight:700; color:#e2e8f0; margin-bottom:0.3rem; }
        .lv-task.done .lv-task-title { color:#64748b; text-decoration:line-through; text-decoration-color:rgba(100,116,139,0.5); }
        .lv-task-desc { font-size:0.78rem; color:#64748b; line-height:1.5; font-weight:300; }

        .lv-task-skeleton { height:72px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); animation:pulse 1.4s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* form fields */
        .lv-field { display:flex; flex-direction:column; gap:0.5rem; }
        .lv-label { font-family:'Syne',sans-serif; font-size:0.72rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#475569; display:flex; align-items:center; justify-content:space-between; }
        .lv-label-req { color:#6366f1; font-size:0.65rem; text-transform:none; letter-spacing:0; font-weight:400; font-family:'DM Sans',sans-serif; }
        .lv-input {
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; color:#e2e8f0; font-family:'DM Sans',sans-serif;
          font-size:0.88rem; padding:0.75rem 1rem; outline:none; width:100%;
          transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
        }
        .lv-input::placeholder { color:#334155; }
        .lv-input:focus { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.05); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

        .lv-pills { display:flex; gap:0.5rem; flex-wrap:wrap; }
        .lv-pill {
          padding:0.4rem 0.9rem; border-radius:100px; border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03); color:#64748b; font-size:0.78rem; font-weight:500;
          cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;
        }
        .lv-pill:hover  { border-color:rgba(99,102,241,0.3); color:#94a3b8; }
        .lv-pill.active { border-color:#6366f1; background:rgba(99,102,241,0.15); color:#818cf8; }

        /* error banner */
        .lv-error {
          display:flex; align-items:center; gap:0.5rem; padding:0.7rem 0.9rem;
          border-radius:8px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          color:#fca5a5; font-size:0.78rem; animation:shake 0.3s ease;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

        /* footer */
        .lv-panel-footer { padding:1.2rem 1.6rem 1.6rem; border-top:1px solid rgba(255,255,255,0.05); flex-shrink:0; }
        .lv-btn {
          width:100%; padding:0.88rem 1.2rem; border-radius:12px; border:none; color:#fff;
          font-family:'Syne',sans-serif; font-size:0.88rem; font-weight:700; letter-spacing:0.04em;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.5rem;
          transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
          animation:btnIn 0.3s ease;
        }
        .lv-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .lv-btn:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
        .lv-btn.indigo { background:linear-gradient(135deg,#6366f1,#818cf8); box-shadow:0 4px 20px rgba(99,102,241,0.35); }
        .lv-btn.indigo:hover:not(:disabled) { box-shadow:0 8px 28px rgba(99,102,241,0.45); }
        .lv-btn.green  { background:linear-gradient(135deg,#10b981,#34d399); box-shadow:0 4px 20px rgba(16,185,129,0.35); }
        .lv-btn.green:hover:not(:disabled)  { box-shadow:0 8px 28px rgba(16,185,129,0.45); }
        @keyframes btnIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .lv-hint { margin-top:0.6rem; font-size:0.72rem; color:#475569; text-align:center; font-weight:300; }

        .lv-dots { display:flex; gap:3px; align-items:center; }
        .lv-dots span { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,0.7); animation:dotBounce 1.2s infinite; }
        .lv-dots span:nth-child(2) { animation-delay:0.2s; }
        .lv-dots span:nth-child(3) { animation-delay:0.4s; }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }

        .lv-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        @media(max-width:480px) {
          .lv-grid { grid-template-columns:1fr 1fr; }
          .lv-root { padding:1.5rem 1rem 3rem; }
          .lv-create-btn span { display:none; }
        }
      `}</style>

      <div className="lv-root">
        {/* Header */}
        <header className="lv-header">
          <div className="lv-header-top">
            <div>
              <p className="lv-eyebrow">Learning Path</p>
              {roadmap ? (
                <h1 className="lv-title">
                  {roadmap.topic.split(" ").slice(0, -1).join(" ")}{" "}
                  <span>{roadmap.topic.split(" ").slice(-1)}</span>
                </h1>
              ) : (
                <h1 className="lv-title">Your <span>Roadmap</span></h1>
              )}
              <p className="lv-subtitle">
                {userData.name ? `Welcome back, ${userData.name}. ` : ""}
                {roadmap ? "Complete each day to unlock the next." : "Create a roadmap to get started."}
              </p>
            </div>
            <button
              className={`lv-create-btn ${createPanelOpen ? "active" : ""}`}
              onClick={() => { setCreatePanelOpen(true); setCreateError(""); }}
            >
              <PLUS_ICON /> <span>New Roadmap</span>
            </button>
          </div>
          {roadmap && (
            <div className="lv-progress-bar">
              <div className="lv-progress-fill" style={{ width: `${Math.max(2, roadmap.progress ?? 0)}%` }} />
            </div>
          )}
        </header>

        {/* Units or empty state */}
        {roadmap ? roadmap.units.map((unit) => (
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
                    className={`lv-card ${status}`}
                    onClick={() => openChapter(ch, unit.unit_number)}
                  >
                    <span className="lv-card-day">Day {ch.day}</span>
                    <span className="lv-card-title">{ch.title}</span>
                    <span className="lv-card-focus">{ch.focus}</span>
                    <div className="lv-card-footer">
                      <span className={`lv-card-status ${status === "completed" ? "done" : status}`}>
                        <span className="lv-dot" />
                        {status === "locked" ? "Locked" : status === "completed" ? "Done" : "Open"}
                      </span>
                      {status === "locked" && LOCK_ICON}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )) : (
          <div className="lv-empty">
            <div className="lv-empty-icon">✦</div>
            <p className="lv-empty-title">No roadmap yet</p>
            <p className="lv-empty-sub">Generate a personalised learning path to start your journey.</p>
            <button className="lv-empty-cta" onClick={() => { setCreatePanelOpen(true); setCreateError(""); }}>
              <PLUS_ICON /> Create Roadmap
            </button>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div
        className={`lv-overlay ${drawerOpen || createPanelOpen ? "" : "hidden"}`}
        onClick={() => { closeDrawer(); setCreatePanelOpen(false); }}
      />

      {/* ── Create Roadmap Panel (left) ── */}
      <aside ref={createPanelRef} className={`lv-panel left ${createPanelOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="lv-stripe-create" />
        <div className="lv-panel-header">
          <p className="lv-panel-tag green">New Roadmap</p>
          <h2 className="lv-panel-title">Build Your Path</h2>
          <p className="lv-panel-sub">Tell us what you want to learn and we'll generate a structured day-by-day roadmap.</p>
          <button className="lv-panel-close" onClick={() => setCreatePanelOpen(false)}><CLOSE_ICON /></button>
        </div>

        <div className="lv-panel-body">
          <div className="lv-field">
            <label className="lv-label">Topic <span className="lv-label-req">Required</span></label>
            <input
              className="lv-input"
              type="text"
              placeholder="e.g. Machine Learning, React, Spanish…"
              value={roadmapTopic}
              onChange={(e) => { setRoadmapTopic(e.target.value); setCreateError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !creating && handleCreateRoadmap()}
            />
          </div>
          <div className="lv-field">
            <label className="lv-label">Duration</label>
            <div className="lv-pills">
              {[["7","7 days"],["14","14 days"],["30","30 days"],["60","60 days"],["90","90 days"]].map(([v,l]) => (
                <button key={v} className={`lv-pill ${roadmapDuration === v ? "active" : ""}`} onClick={() => setRoadmapDuration(v)}>{l}</button>
              ))}
            </div>
          </div>
          {createError && (
            <div className="lv-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {createError}
            </div>
          )}
        </div>

        <div className="lv-panel-footer">
          <button className="lv-btn green" onClick={handleCreateRoadmap} disabled={creating}>
            {creating ? (<><div className="lv-dots"><span/><span/><span/></div> Generating Roadmap…</>) : (<><SPARKLE_ICON /> Generate Roadmap</>)}
          </button>
          {creating && <p className="lv-hint">This may take a few seconds…</p>}
        </div>
      </aside>

      {/* ── Task Drawer (right) ── */}
      <aside ref={drawerRef} className={`lv-panel right ${drawerOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="lv-stripe-task" />
        {activeChapter && (
          <>
            <div className="lv-panel-header">
              <p className="lv-panel-tag indigo">Day {activeChapter.day}</p>
              <h2 className="lv-panel-title">{activeChapter.title}</h2>
              <p className="lv-panel-sub">{activeChapter.focus}</p>
              <button className="lv-panel-close" onClick={closeDrawer}><CLOSE_ICON /></button>
            </div>

            <div className="lv-panel-body">
              <div className="lv-tasks-heading">
                Today's Tasks
                <span className="lv-tasks-count">{doneCount}/{allTasks.length}</span>
              </div>

              {tasksLoading ? (
                [1,2,3].map((i) => <div key={i} className="lv-task-skeleton" />)
              ) : allTasks.map((task) => {
                const done = !!checkedTasks[task.id];
                return (
                  <div key={task.id} className={`lv-task ${done ? "done" : ""}`} onClick={() => toggleTask(task.id)}>
                    <div className="lv-checkbox"><CHECK_ICON checked={done} /></div>
                    <div className="lv-task-body">
                      <p className="lv-task-title">{task.title}</p>
                      <p className="lv-task-desc">{task.description}</p>
                    </div>
                  </div>
                );
              })}

              {completeError && (
                <div className="lv-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14,flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {completeError}
                </div>
              )}
            </div>

            {allDone && (
              <div className="lv-panel-footer">
                <button className="lv-btn indigo" onClick={markComplete} disabled={completing}>
                  {completing
                    ? (<><div className="lv-spinner" /> Marking Complete…</>)
                    : (<> ✦ Mark Day {activeChapter.day} Complete</>)}
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}