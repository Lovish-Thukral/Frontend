import { useState, useEffect, useRef, useCallback } from "react";

// ─── Icons ─────────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 16, height: 16 }}>
    <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = ({ checked }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 11, height: 11, opacity: checked ? 1 : 0, transition: "opacity 0.15s" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" style={{ width: 15, height: 15 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" style={{ width: 13, height: 13 }}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

// ─── Constants ──────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_BASE_URL ?? "";
const DURATION_OPTIONS = [[7,"7 days"],[14,"14 days"],[30,"30 days"],[60,"60 days"],[90,"90 days"]];

// Per-unit accent palette — cycles for variety
const UNIT_COLORS = [
  { glow: "rgba(99,102,241,0.35)",  border: "rgba(99,102,241,0.5)",  dot: "#6366f1" },
  { glow: "rgba(236,72,153,0.3)",   border: "rgba(236,72,153,0.45)", dot: "#ec4899" },
  { glow: "rgba(245,158,11,0.3)",   border: "rgba(245,158,11,0.45)", dot: "#f59e0b" },
  { glow: "rgba(20,184,166,0.3)",   border: "rgba(20,184,166,0.45)", dot: "#14b8a6" },
  { glow: "rgba(139,92,246,0.3)",   border: "rgba(139,92,246,0.45)", dot: "#8b5cf6" },
];

// ─── localStorage helpers ────────────────────────────────────────────────────

function readLocalUser() {
  try {
    const raw = localStorage.getItem("nextep_user");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeLocalUser(data) {
  try { localStorage.setItem("nextep_user", JSON.stringify(data)); } catch {}
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Levels() {
  const [userData, setUserData]   = useState(null);
  const [loading, setLoading]     = useState(true);

  // Task drawer
  const [activeChapter, setActiveChapter] = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [tasks, setTasks]                 = useState([]);
  const [tasksLoading, setTasksLoading]   = useState(false);
  const [checkedTasks, setCheckedTasks]   = useState({});
  const [completing, setCompleting]       = useState(false);
  const [completeError, setCompleteError] = useState("");

  // Create panel
  const [createOpen, setCreateOpen]           = useState(false);
  const [roadmapTopic, setRoadmapTopic]       = useState("");
  const [roadmapDuration, setRoadmapDuration] = useState(30);
  const [creating, setCreating]               = useState(false);
  const [createError, setCreateError]         = useState("");

  const drawerRef = useRef(null);
  const createRef = useRef(null);

  // ── Persist helper — deep-clone so React always sees new refs ──────────────

  const persistUserData = useCallback((next) => {
    writeLocalUser(next);
    setUserData(JSON.parse(JSON.stringify(next)));
  }, []);

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    setUserData(readLocalUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target)) closeDrawer();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [drawerOpen]);

  useEffect(() => {
    const h = (e) => {
      if (createOpen && createRef.current && !createRef.current.contains(e.target)) setCreateOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [createOpen]);

  // ── Open chapter — always verifies lock from LIVE state ────────────────────

  async function openChapter(chapter, unitNumber) {
    // Never trust the render-time snapshot; re-read from live userData
    const liveRm   = userData?.roadmapHistory?.[0];
    const liveUnit = liveRm?.units.find((u) => u.unit_number === unitNumber);
    const liveCh   = liveUnit?.chapters.find((c) => c.day === chapter.day);
    if (!liveCh || liveCh.locked) return; // 🔒 hard gate

    setActiveChapter({ ...liveCh, unitNumber });
    setCheckedTasks({});
    setCompleteError("");
    setDrawerOpen(true);
    setTasksLoading(true);
    setTasks([]);

    try {
      const res = await fetch(`${API}/main/getTasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData?.name, day: chapter.day, unitIndex: unitNumber }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch {
      // Graceful fallback
      setTasks([
        { id: 1, title: `Study: ${chapter.title}`,  description: `Deep-dive into "${chapter.focus}". Read docs and take notes.` },
        { id: 2, title: "Hands-on Exercise",          description: `Practical lab — ${chapter.focus}.` },
        { id: 3, title: "Quiz & Review",              description: "Answer 5 self-assessment questions and write 3 key takeaways." },
      ]);
    } finally {
      setTasksLoading(false);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setActiveChapter(null); setTasks([]); setCheckedTasks({}); setCompleteError("");
    }, 350);
  }

  function toggleTask(id) {
    setCheckedTasks((p) => ({ ...p, [id]: !p[id] }));
  }

  // ── Mark complete ────────────────────────────────────────────────────────────

  async function markComplete() {
    if (completing || !activeChapter) return;
    setCompleting(true);
    setCompleteError("");
    try {
      const res = await fetch(`${API}/main/markComplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userData?.name, Day: activeChapter.day, unitIndex: activeChapter.unitNumber }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let updated;
      try { updated = await res.json(); } catch {}

      if (updated?.name) {
        persistUserData(updated);
      } else {
        // Optimistic local update — deep-clone throughout
        const clone = JSON.parse(JSON.stringify(userData));
        const rm    = clone.roadmapHistory[0];

        for (let u = 0; u < rm.units.length; u++) {
          const unit = rm.units[u];
          for (let i = 0; i < unit.chapters.length; i++) {
            if (unit.chapters[i].day === activeChapter.day) {
              unit.chapters[i].completed = true;
              if (unit.chapters[i + 1])              unit.chapters[i + 1].locked = false;
              else if (rm.units[u + 1]?.chapters[0]) rm.units[u + 1].chapters[0].locked = false;
            }
          }
        }

        const all   = rm.units.flatMap((u) => u.chapters);
        rm.progress = Math.round(all.filter((c) => c.completed).length / all.length * 100);
        persistUserData(clone);
      }

      closeDrawer();
    } catch {
      setCompleteError("Failed to save progress. Try again!");
    } finally {
      setCompleting(false);
    }
  }

  // ── Create roadmap ───────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!roadmapTopic.trim()) { setCreateError("Type a topic first!"); return; }
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`${API}/main/createRoadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: { field_query: roadmapTopic.trim(), days: parseInt(roadmapDuration, 10) },
          name:      userData?.name,
          RIASECval: JSON.parse(localStorage.getItem("riasec") || "{}"),
          SAFIAVAL:  JSON.parse(localStorage.getItem("sifa")   || "{}"),
          Skills:    JSON.parse(localStorage.getItem("skills") || "[]"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.roadmap) {
        // Deep-clone merge — triggers full re-render with new roadmap data
        persistUserData({ ...(userData ?? {}), roadmapHistory: [data.roadmap] });
      }

      setRoadmapTopic("");
      setRoadmapDuration(30);
      setCreateOpen(false);
    } catch {
      setCreateError("Oops! Something went wrong. Try again.");
    } finally {
      setCreating(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const roadmap   = userData?.roadmapHistory?.[0] ?? null;
  const doneCount = tasks.filter((t) => checkedTasks[t.id]).length;
  const allDone   = tasks.length > 0 && doneCount === tasks.length;

  // ── Loading screen ───────────────────────────────────────────────────────────

  if (loading || !userData) return (
    <div style={{ minHeight:"100vh", background:"#07090f", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ display:"flex", gap:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:10, height:10, borderRadius:"50%", background:"#6366f1",
            animation:`bop 0.9s ${i*0.18}s ease-in-out infinite`,
          }}/>
        ))}
      </div>
      <style>{`@keyframes bop{0%,100%{transform:translateY(0)}45%{transform:translateY(-10px)}}`}</style>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@300;400;600&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        :root {
          --bg:       #07090f;
          --surface:  #0e1018;
          --surface2: #12151e;
          --indigo:   #6366f1;
          --indigo-l: #818cf8;
          --green:    #10b981;
          --green-l:  #34d399;
          --text1:    #f1f5f9;
          --text2:    #94a3b8;
          --text3:    #64748b;
          --text4:    #3d4d61;
          --border:   rgba(255,255,255,0.07);
          --r:        18px;
        }

        /* ── page ── */
        .lv {
          font-family: 'Nunito Sans', sans-serif;
          min-height: 100vh;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse 100% 55% at 50% -8%,  rgba(99,102,241,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 92% 92%,   rgba(16,185,129,0.07) 0%, transparent 58%),
            radial-gradient(ellipse 35% 28% at 4% 58%,    rgba(236,72,153,0.05) 0%, transparent 55%);
          color: var(--text2);
          padding: 2.5rem 2rem 6rem;
          overflow-x: hidden;
        }

        /* ── header ── */
        .lv-header { margin-bottom: 2.8rem; }
        .lv-hrow   { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }

        .lv-eyebrow {
          display: inline-flex; align-items: center; gap: 0.45rem;
          font-family: 'Nunito', sans-serif;
          font-size: 0.68rem; font-weight: 900; letter-spacing: 0.22em;
          text-transform: uppercase; color: var(--indigo); margin-bottom: 0.5rem;
        }
        .lv-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--indigo); box-shadow: 0 0 7px var(--indigo);
          animation: pdot 2.2s ease infinite;
        }
        @keyframes pdot { 0%,100%{opacity:1;transform:scale(1)} 55%{opacity:0.4;transform:scale(0.65)} }

        .lv-title {
          font-family: 'Nunito', sans-serif;
          font-size: clamp(1.9rem, 4.5vw, 2.75rem);
          font-weight: 900; color: var(--text1);
          line-height: 1.06; letter-spacing: -0.022em;
        }
        .lv-title em { font-style:normal; color:var(--indigo); }

        .lv-subtitle {
          margin-top: 0.52rem; font-size: 0.9rem;
          color: var(--text3); font-weight: 400; line-height: 1.5;
        }

        /* progress bar */
        .lv-prog {
          margin-top: 1.25rem; display: flex; align-items: center; gap: 0.8rem;
        }
        .lv-prog-track {
          height: 7px; width: 185px; border-radius: 100px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.1); overflow: hidden;
        }
        .lv-prog-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--indigo), var(--indigo-l), #a78bfa);
          border-radius: 100px;
          transition: width 1s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 0 9px rgba(99,102,241,0.5);
        }
        .lv-prog-pct {
          font-family: 'Nunito', sans-serif;
          font-size: 0.72rem; font-weight: 900; color: var(--indigo-l);
        }

        /* new roadmap button */
        .lv-new-btn {
          flex-shrink: 0; display: flex; align-items: center; gap: 0.45rem;
          padding: 0.58rem 1.1rem; border-radius: 12px; margin-top: 0.2rem;
          border: 2px solid rgba(99,102,241,0.28);
          background: rgba(99,102,241,0.07);
          color: var(--indigo-l);
          font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 900;
          cursor: pointer; white-space: nowrap;
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lv-new-btn:hover {
          background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.58);
          color: #c7d2fe; transform: translateY(-2px) scale(1.03);
          box-shadow: 0 6px 22px rgba(99,102,241,0.24);
        }
        .lv-new-btn.on { background:rgba(99,102,241,0.18); border-color:var(--indigo); color:#c7d2fe; }

        /* ── unit section ── */
        .lv-unit { margin-bottom: 3.5rem; }
        .lv-unit-head { display:flex; align-items:center; gap:0.9rem; margin-bottom:1.2rem; }
        .lv-unit-pill {
          font-family: 'Nunito', sans-serif;
          font-size: 0.63rem; font-weight: 900; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--indigo-l);
          background: rgba(99,102,241,0.08);
          border: 2px solid rgba(99,102,241,0.25);
          padding: 0.2rem 0.7rem; border-radius: 100px;
        }
        .lv-unit-name {
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem; font-weight: 700; color: var(--text3);
        }
        .lv-unit-rule {
          flex: 1; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, rgba(99,102,241,0.14), transparent);
        }

        /* ── chapter grid ── */
        .lv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
          gap: 1rem;
        }

        /* ── chapter card ── */
        .lv-card {
          position: relative; border-radius: var(--r);
          padding: 1.25rem 1.1rem 1rem;
          border: 2px solid var(--border);
          background: var(--surface2);
          cursor: pointer; overflow: hidden;
          display: flex; flex-direction: column; gap: 0.44rem;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.22s ease, border-color 0.22s ease;
        }
        /* top-edge shimmer */
        .lv-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          pointer-events: none;
        }
        .lv-card.open:hover   { transform: translateY(-4px) rotate(-0.4deg); }
        .lv-card.locked       { cursor:default; opacity:0.36; filter:grayscale(0.65) brightness(0.65); }
        .lv-card.completed    { border-color:rgba(16,185,129,0.32); background:rgba(16,185,129,0.055); }
        .lv-card.completed:hover {
          transform: translateY(-4px) rotate(0.4deg);
          box-shadow: 0 14px 32px rgba(16,185,129,0.18);
          border-color: rgba(16,185,129,0.52);
        }

        .lv-card-top { display:flex; align-items:center; justify-content:space-between; }
        .lv-card-day {
          font-family: 'Nunito', sans-serif;
          font-size: 0.59rem; font-weight: 900; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--text4);
          background: rgba(255,255,255,0.04);
          padding: 0.14rem 0.5rem; border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.055);
        }
        .lv-card.completed .lv-card-day {
          color: var(--green); background: rgba(16,185,129,0.07);
          border-color: rgba(16,185,129,0.18);
        }

        .lv-card-title {
          font-family: 'Nunito', sans-serif;
          font-size: 0.9rem; font-weight: 900; color: var(--text1); line-height: 1.28;
        }
        .lv-card.locked .lv-card-title { color: var(--text4); }

        .lv-card-focus { font-size: 0.72rem; color: var(--text3); line-height: 1.45; font-weight: 400; }

        .lv-card-foot { margin-top:auto; padding-top:0.6rem; display:flex; align-items:center; justify-content:space-between; }

        .lv-badge {
          display: flex; align-items: center; gap: 0.3rem;
          font-family: 'Nunito', sans-serif;
          font-size: 0.61rem; font-weight: 900; letter-spacing: 0.07em; text-transform: uppercase;
          padding: 0.17rem 0.58rem; border-radius: 8px;
        }
        .lv-badge.open   { color:var(--indigo); background:rgba(99,102,241,0.09); border:1.5px solid rgba(99,102,241,0.2); }
        .lv-badge.done   { color:var(--green);  background:rgba(16,185,129,0.07); border:1.5px solid rgba(16,185,129,0.18); }
        .lv-badge.locked { color:var(--text4);  background:rgba(255,255,255,0.03); border:1.5px solid rgba(255,255,255,0.055); }
        .lv-bdot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .lv-badge.open   .lv-bdot { background:var(--indigo); box-shadow:0 0 5px var(--indigo); }
        .lv-badge.done   .lv-bdot { background:var(--green);  box-shadow:0 0 5px var(--green); }
        .lv-badge.locked .lv-bdot { background:var(--text4); }

        /* ── empty state ── */
        .lv-empty {
          display:flex; flex-direction:column; align-items:center;
          justify-content:center; min-height:55vh; gap:1.1rem; text-align:center;
        }
        .lv-empty-icon {
          width:72px; height:72px; border-radius:22px;
          background:rgba(99,102,241,0.07); border:2px dashed rgba(99,102,241,0.22);
          display:flex; align-items:center; justify-content:center; font-size:1.9rem;
          animation:float 3.2s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        .lv-empty-title { font-family:'Nunito',sans-serif; font-size:1.15rem; font-weight:900; color:var(--text3); }
        .lv-empty-sub   { font-size:0.85rem; color:var(--text4); max-width:230px; line-height:1.6; }
        .lv-empty-cta {
          padding:0.7rem 1.5rem; border-radius:14px;
          background:linear-gradient(135deg,var(--indigo),var(--indigo-l));
          color:#fff; font-family:'Nunito',sans-serif;
          font-size:0.88rem; font-weight:900; border:none; cursor:pointer;
          display:flex; align-items:center; gap:0.45rem;
          box-shadow:0 4px 20px rgba(99,102,241,0.33);
          transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lv-empty-cta:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 8px 28px rgba(99,102,241,0.45); }

        /* ── overlay ── */
        .lv-overlay { position:fixed; inset:0; background:rgba(7,9,15,0.72); backdrop-filter:blur(5px); z-index:40; transition:opacity 0.28s; }
        .lv-overlay.off { opacity:0; pointer-events:none; }

        /* ── side panels ── */
        .lv-panel {
          position:fixed; top:0; height:100vh; background:var(--surface);
          z-index:50; display:flex; flex-direction:column; overflow:hidden;
          transition:transform 0.38s cubic-bezier(0.32,0.72,0,1);
        }
        .lv-panel.right { right:0; width:min(440px,100vw); border-left:2px solid rgba(99,102,241,0.1); transform:translateX(102%); }
        .lv-panel.left  { left:0;  width:min(400px,100vw); border-right:2px solid rgba(99,102,241,0.1); transform:translateX(-102%); }
        .lv-panel.right.open, .lv-panel.left.open { transform:translateX(0); }

        .lv-stripe      { height:4px; flex-shrink:0; }
        .lv-stripe.i    { background:linear-gradient(90deg,var(--indigo),#a78bfa,var(--green)); }
        .lv-stripe.g    { background:linear-gradient(90deg,var(--green),var(--indigo),#a78bfa); }

        .lv-phead { padding:1.5rem 1.6rem 1.2rem; border-bottom:1px solid rgba(255,255,255,0.05); flex-shrink:0; position:relative; }
        .lv-ptag  {
          font-family:'Nunito',sans-serif; font-size:0.62rem; font-weight:900;
          letter-spacing:0.2em; text-transform:uppercase; margin-bottom:0.4rem;
          display:flex; align-items:center; gap:0.4rem;
        }
        .lv-ptag.i  { color:var(--indigo); }
        .lv-ptag.g  { color:var(--green); }
        .lv-ptag span { width:16px; height:2.5px; border-radius:2px; display:inline-block; }
        .lv-ptag.i span { background:var(--indigo); }
        .lv-ptag.g span { background:var(--green); }

        .lv-ptitle { font-family:'Nunito',sans-serif; font-size:1.28rem; font-weight:900; color:var(--text1); letter-spacing:-0.02em; padding-right:2.5rem; line-height:1.2; }
        .lv-psub   { margin-top:0.4rem; font-size:0.8rem; color:var(--text3); font-weight:400; line-height:1.55; }

        .lv-close-btn {
          position:absolute; top:1.1rem; right:1.3rem;
          width:32px; height:32px; border-radius:10px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07);
          color:var(--text3); cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:background 0.15s, color 0.15s, transform 0.2s;
        }
        .lv-close-btn:hover { background:rgba(255,255,255,0.1); color:var(--text1); transform:rotate(90deg); }

        /* panel body */
        .lv-pbody {
          flex:1; overflow-y:auto; padding:1.4rem 1.6rem;
          display:flex; flex-direction:column; gap:0.85rem;
          scrollbar-width:thin; scrollbar-color:rgba(99,102,241,0.14) transparent;
        }
        .lv-pbody::-webkit-scrollbar { width:3px; }
        .lv-pbody::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.18); border-radius:2px; }

        /* section label */
        .lv-slabel {
          font-family:'Nunito',sans-serif; font-size:0.64rem; font-weight:900;
          letter-spacing:0.18em; text-transform:uppercase; color:var(--text4);
          display:flex; align-items:center; justify-content:space-between; margin-bottom:0.05rem;
        }
        .lv-scnt {
          background:rgba(99,102,241,0.09); color:var(--indigo-l);
          font-size:0.6rem; padding:0.12rem 0.55rem; border-radius:100px;
          font-weight:700; letter-spacing:0.02em;
        }

        /* tasks */
        .lv-task {
          background:rgba(255,255,255,0.025); border:1.5px solid var(--border);
          border-radius:14px; padding:0.95rem 1rem;
          display:flex; gap:0.85rem; align-items:flex-start;
          cursor:pointer; transition:all 0.18s ease;
        }
        .lv-task:hover  { background:rgba(99,102,241,0.05); border-color:rgba(99,102,241,0.22); transform:translateX(3px); }
        .lv-task.done   { background:rgba(16,185,129,0.04); border-color:rgba(16,185,129,0.18); }
        .lv-task.done:hover { transform:none; }

        .lv-chk {
          width:21px; height:21px; border-radius:7px; flex-shrink:0;
          border:2px solid rgba(99,102,241,0.32); background:transparent;
          display:flex; align-items:center; justify-content:center; margin-top:1px;
          color:#fff; transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lv-task.done .lv-chk {
          background:var(--green); border-color:var(--green); transform:scale(1.12);
          box-shadow:0 0 11px rgba(16,185,129,0.42);
        }

        .lv-ttitle { font-family:'Nunito',sans-serif; font-size:0.87rem; font-weight:800; color:var(--text1); margin-bottom:0.22rem; }
        .lv-task.done .lv-ttitle { color:var(--text4); text-decoration:line-through; text-decoration-color:rgba(100,116,139,0.4); }
        .lv-tdesc  { font-size:0.75rem; color:var(--text3); line-height:1.5; }

        .lv-skel { height:70px; border-radius:14px; background:rgba(255,255,255,0.025); border:1.5px solid var(--border); animation:shim 1.4s ease infinite; }
        @keyframes shim { 0%,100%{opacity:1} 50%{opacity:0.33} }

        /* form */
        .lv-field { display:flex; flex-direction:column; gap:0.48rem; }
        .lv-label {
          font-family:'Nunito',sans-serif; font-size:0.7rem; font-weight:900;
          letter-spacing:0.14em; text-transform:uppercase; color:var(--text4);
          display:flex; align-items:center; justify-content:space-between;
        }
        .lv-req { color:var(--indigo); font-size:0.65rem; text-transform:none; letter-spacing:0; font-weight:600; font-family:'Nunito Sans',sans-serif; }
        .lv-input {
          background:rgba(255,255,255,0.028); border:1.5px solid rgba(255,255,255,0.07);
          border-radius:11px; color:var(--text1);
          font-family:'Nunito Sans',sans-serif; font-size:0.88rem;
          padding:0.72rem 1rem; outline:none; width:100%;
          transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .lv-input::placeholder { color:#252e3e; }
        .lv-input:focus { border-color:rgba(99,102,241,0.44); background:rgba(99,102,241,0.04); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }

        .lv-pills { display:flex; gap:0.45rem; flex-wrap:wrap; }
        .lv-pill {
          padding:0.38rem 0.88rem; border-radius:100px;
          border:1.5px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03);
          color:var(--text3); font-size:0.78rem; font-weight:700;
          cursor:pointer; font-family:'Nunito',sans-serif;
          transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lv-pill:hover { border-color:rgba(99,102,241,0.28); color:var(--text2); transform:scale(1.06); }
        .lv-pill.on {
          border-color:var(--indigo); background:rgba(99,102,241,0.12);
          color:var(--indigo-l); transform:scale(1.06);
          box-shadow:0 2px 12px rgba(99,102,241,0.22);
        }

        /* error */
        .lv-err {
          display:flex; align-items:center; gap:0.5rem;
          padding:0.7rem 0.9rem; border-radius:11px;
          background:rgba(239,68,68,0.07); border:1.5px solid rgba(239,68,68,0.2);
          color:#fca5a5; font-size:0.78rem; font-weight:600;
          animation:wgl 0.3s ease;
        }
        @keyframes wgl { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }

        /* panel footer */
        .lv-pfoot { padding:1.1rem 1.6rem 1.6rem; border-top:1px solid rgba(255,255,255,0.05); flex-shrink:0; }
        .lv-btn {
          width:100%; padding:0.9rem 1.2rem; border-radius:14px;
          border:none; color:#fff;
          font-family:'Nunito',sans-serif; font-size:0.88rem;
          font-weight:900; letter-spacing:0.04em; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:0.5rem;
          transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          animation:popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes popIn { from{opacity:0;transform:scale(0.9) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .lv-btn:disabled { opacity:0.52; cursor:not-allowed; transform:none !important; }
        .lv-btn:hover:not(:disabled) { transform:translateY(-2px) scale(1.015); }
        .lv-btn.i { background:linear-gradient(135deg,var(--indigo),#7c3aed); box-shadow:0 4px 20px rgba(99,102,241,0.35); }
        .lv-btn.i:hover:not(:disabled) { box-shadow:0 8px 28px rgba(99,102,241,0.52); }
        .lv-btn.g { background:linear-gradient(135deg,var(--green),#059669); box-shadow:0 4px 20px rgba(16,185,129,0.32); }
        .lv-btn.g:hover:not(:disabled) { box-shadow:0 8px 28px rgba(16,185,129,0.48); }

        .lv-hint { margin-top:0.55rem; font-size:0.72rem; color:var(--text4); text-align:center; }

        /* micro loaders */
        .lv-dots { display:flex; gap:3px; align-items:center; }
        .lv-dots span { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,0.8); animation:bop 0.9s infinite ease-in-out; }
        .lv-dots span:nth-child(2){animation-delay:.15s} .lv-dots span:nth-child(3){animation-delay:.3s}
        @keyframes bop { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-5px)} }

        .lv-spin { width:14px; height:14px; border:2.5px solid rgba(255,255,255,0.28); border-top-color:#fff; border-radius:50%; animation:spin 0.65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* responsive */
        @media(max-width:520px) {
          .lv { padding:1.4rem 1rem 4rem; }
          .lv-grid { grid-template-columns:1fr 1fr; }
          .lv-new-btn span { display:none; }
        }
      `}</style>

      <div className="lv">

        {/* ── Header ── */}
        <header className="lv-header">
          <div className="lv-hrow">
            <div>
              <div className="lv-eyebrow">
                <span className="lv-eyebrow-dot" />
                Learning Path
              </div>
              {roadmap ? (
                <h1 className="lv-title">
                  {(roadmap.requested_field || roadmap.topic || "").split(" ").slice(0,-1).join(" ")}{" "}
                  <em>{(roadmap.requested_field || roadmap.topic || "Roadmap").split(" ").slice(-1)}</em>
                </h1>
              ) : (
                <h1 className="lv-title">Your <em>Roadmap</em> 🗺️</h1>
              )}
              <p className="lv-subtitle">
                {userData.name ? `Hey ${userData.name}! ` : ""}
                {roadmap
                  ? "Finish each day to unlock the next one ✨"
                  : "Create your first roadmap to begin your adventure!"}
              </p>
            </div>

            <button
              className={`lv-new-btn ${createOpen ? "on" : ""}`}
              onClick={() => { setCreateOpen(true); setCreateError(""); }}
            >
              <PlusIcon /> <span>New Roadmap</span>
            </button>
          </div>

          {roadmap && (
            <div className="lv-prog">
              <div className="lv-prog-track">
                <div className="lv-prog-fill" style={{ width:`${Math.max(2, roadmap.progress ?? 0)}%` }} />
              </div>
              <span className="lv-prog-pct">{roadmap.progress ?? 0}%</span>
            </div>
          )}
        </header>

        {/* ── Units or empty ── */}
        {roadmap ? roadmap.units.map((unit, uIdx) => {
          const uc = UNIT_COLORS[uIdx % UNIT_COLORS.length];
          return (
            <section key={unit.unit_number} className="lv-unit">
              <div className="lv-unit-head">
                <span className="lv-unit-pill">Unit {unit.unit_number}</span>
                <span className="lv-unit-name">{unit.unit_title}</span>
                <div className="lv-unit-rule" />
              </div>
              <div className="lv-grid">
                {unit.chapters.map((ch) => {
                  const status = ch.locked ? "locked" : ch.completed ? "completed" : "open";
                  return (
                    <div
                      key={ch.day}
                      className={`lv-card ${status}`}
                      onClick={() => openChapter(ch, unit.unit_number)}
                      onMouseEnter={(e) => {
                        if (status === "open") {
                          e.currentTarget.style.boxShadow = `0 14px 36px ${uc.glow}`;
                          e.currentTarget.style.borderColor = uc.border;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (status === "open") {
                          e.currentTarget.style.boxShadow = "";
                          e.currentTarget.style.borderColor = "";
                        }
                      }}
                    >
                      <div className="lv-card-top">
                        <span className="lv-card-day">Day {ch.day}</span>
                        {status === "locked" && <LockIcon />}
                      </div>
                      <span className="lv-card-title">{ch.title}</span>
                      <span className="lv-card-focus">{ch.focus}</span>
                      <div className="lv-card-foot">
                        <span className={`lv-badge ${status === "completed" ? "done" : status}`}>
                          <span
                            className="lv-bdot"
                            style={status === "open" ? { background: uc.dot, boxShadow: `0 0 5px ${uc.dot}` } : {}}
                          />
                          {status === "locked" ? "Locked" : status === "completed" ? "Done ✓" : "Open"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }) : (
          <div className="lv-empty">
            <div className="lv-empty-icon">🚀</div>
            <p className="lv-empty-title">No roadmap yet!</p>
            <p className="lv-empty-sub">Build your personalised learning path and start your adventure.</p>
            <button className="lv-empty-cta" onClick={() => { setCreateOpen(true); setCreateError(""); }}>
              <PlusIcon /> Create Roadmap
            </button>
          </div>
        )}
      </div>

      {/* ── Overlay ── */}
      <div
        className={`lv-overlay ${drawerOpen || createOpen ? "" : "off"}`}
        onClick={() => { closeDrawer(); setCreateOpen(false); }}
      />

      {/* ── Create Roadmap Panel (left) ── */}
      <aside
        ref={createRef}
        className={`lv-panel left ${createOpen ? "open" : ""}`}
        role="dialog" aria-modal="true" aria-label="Create roadmap"
      >
        <div className="lv-stripe g" />
        <div className="lv-phead">
          <p className="lv-ptag g"><span />New Roadmap</p>
          <h2 className="lv-ptitle">Build Your Path 🗺️</h2>
          <p className="lv-psub">Tell us what you want to learn and we'll craft a day-by-day plan just for you.</p>
          <button className="lv-close-btn" onClick={() => setCreateOpen(false)}><CloseIcon /></button>
        </div>

        <div className="lv-pbody">
          <div className="lv-field">
            <label className="lv-label">
              Topic <span className="lv-req">Required</span>
            </label>
            <input
              className="lv-input"
              type="text"
              placeholder="e.g. Machine Learning, React, Spanish…"
              value={roadmapTopic}
              onChange={(e) => { setRoadmapTopic(e.target.value); setCreateError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
            />
          </div>

          <div className="lv-field">
            <label className="lv-label">Duration</label>
            <div className="lv-pills">
              {DURATION_OPTIONS.map(([v, l]) => (
                <button key={v} className={`lv-pill ${roadmapDuration === v ? "on" : ""}`} onClick={() => setRoadmapDuration(v)}>{l}</button>
              ))}
            </div>
          </div>

          {createError && (
            <div className="lv-err">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13,flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {createError}
            </div>
          )}
        </div>

        <div className="lv-pfoot">
          <button className="lv-btn g" onClick={handleCreate} disabled={creating}>
            {creating
              ? <><div className="lv-dots"><span/><span/><span/></div> Generating…</>
              : <><StarIcon /> Generate Roadmap</>}
          </button>
          {creating && <p className="lv-hint">Hang tight, this might take a few seconds… ⏳</p>}
        </div>
      </aside>

      {/* ── Task Drawer (right) ── */}
      <aside
        ref={drawerRef}
        className={`lv-panel right ${drawerOpen ? "open" : ""}`}
        role="dialog" aria-modal="true" aria-label="Chapter tasks"
      >
        <div className="lv-stripe i" />
        {activeChapter && (
          <>
            <div className="lv-phead">
              <p className="lv-ptag i"><span />Day {activeChapter.day}</p>
              <h2 className="lv-ptitle">{activeChapter.title}</h2>
              <p className="lv-psub">{activeChapter.focus}</p>
              <button className="lv-close-btn" onClick={closeDrawer}><CloseIcon /></button>
            </div>

            <div className="lv-pbody">
              <div className="lv-slabel">
                Today's Tasks
                <span className="lv-scnt">{doneCount}/{tasks.length}</span>
              </div>

              {tasksLoading
                ? [1,2,3].map(i => <div key={i} className="lv-skel" />)
                : tasks.map((task) => {
                    const done = !!checkedTasks[task.id];
                    return (
                      <div key={task.id} className={`lv-task ${done ? "done" : ""}`} onClick={() => toggleTask(task.id)}>
                        <div className="lv-chk"><CheckIcon checked={done} /></div>
                        <div>
                          <p className="lv-ttitle">{task.title}</p>
                          <p className="lv-tdesc">{task.description}</p>
                        </div>
                      </div>
                    );
                  })}

              {completeError && (
                <div className="lv-err">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13,flexShrink:0}}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {completeError}
                </div>
              )}
            </div>

            {allDone && (
              <div className="lv-pfoot">
                <button className="lv-btn i" onClick={markComplete} disabled={completing}>
                  {completing
                    ? <><div className="lv-spin"/> Saving…</>
                    : <>🎉 Mark Day {activeChapter.day} Complete!</>}
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}