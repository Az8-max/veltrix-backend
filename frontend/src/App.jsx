import { useState, useEffect, useMemo, useRef } from "react";

// ─── UTILS ────────────────────────────────────────────────────────────────

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const TEAM_MEMBERS = [
  { id:1, initials:"SK", name:"Sarah K.", color:"#8b7355" },
  { id:2, initials:"MR", name:"Mike R.",  color:"#5c7a6b" },
  { id:3, initials:"TB", name:"Tom B.",   color:"#6b6b8a" },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --paper: #f5f0e8;
    --paper-dark: #ede8de;
    --paper-mid: #e8e2d6;
    --ink: #1a1714;
    --ink-mid: #4a4540;
    --ink-light: #9a9088;
    --ink-ghost: #c8c0b4;
    --rule: #d8d0c4;
    --accent: #2c4a2e;
    --accent-warm: #7a4a2c;
    --accent-cool: #2c3a4a;
    --serif: 'Libre Baskerville', Georgia, serif;
    --sans: 'DM Sans', sans-serif;
    --mono: 'DM Mono', monospace;
    --r: 4px;
  }
  [data-theme="dark"] {
    --paper: #1a1918;
    --paper-mid: #2a2928;
    --paper-dark: #3a3938;
    --ink: #f9f8f6;
    --ink-mid: #d8d0c4;
    --ink-light: #9a9088;
    --ink-ghost: #4a4540;
    --rule: #4a4540;
  }
  body { background: var(--paper); color: var(--ink); font-family: var(--sans); }
  input, select, button, textarea { font-family: var(--sans); }
  input:focus, select:focus, textarea:focus { outline: none; }
  button { cursor: pointer; border: none; background: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--paper-dark); }
  ::-webkit-scrollbar-thumb { background: var(--ink-ghost); border-radius: 2px; }

  /* ── animations ── */
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .fade-up { animation: fadeUp .4s ease forwards; }
  .fade-in { animation: fadeIn .3s ease forwards; }

  /* ── auth ── */
  .auth-wrap { min-height:100vh; background:var(--paper); display:flex; align-items:center; justify-content:center; padding:20px; }
  .auth-card { width:100%; max-width:400px; animation: fadeUp .5s ease; }
  .auth-logo { font-family:var(--serif); font-size:28px; color:var(--ink); letter-spacing:-.5px; margin-bottom:4px; }
  .auth-sub { font-size:12px; color:var(--ink-light); font-family:var(--mono); letter-spacing:.05em; margin-bottom:40px; }
  .auth-tabs { display:flex; border-bottom:1px solid var(--rule); margin-bottom:28px; }
  .auth-tab { font-size:13px; color:var(--ink-light); padding:8px 0; margin-right:24px; border-bottom:2px solid transparent; transition:.2s; background:none; border-top:none; border-left:none; border-right:none; font-family:var(--sans); font-weight:500; }
  .auth-tab.on { color:var(--ink); border-bottom-color:var(--ink); }
  .field { margin-bottom:16px; }
  .field label { display:block; font-size:11px; font-family:var(--mono); color:var(--ink-light); letter-spacing:.08em; text-transform:uppercase; margin-bottom:6px; }
  .field input { width:100%; padding:10px 12px; background:var(--paper-dark); border:1px solid var(--rule); border-radius:var(--r); font-size:14px; color:var(--ink); transition:border .2s; }
  .field input:focus { border-color:var(--ink-mid); }
  .field input::placeholder { color:var(--ink-ghost); }
  .btn-primary { width:100%; padding:12px; background:var(--ink); color:var(--paper); border-radius:var(--r); font-size:14px; font-weight:500; letter-spacing:.02em; transition:opacity .2s; margin-top:8px; }
  .btn-primary:hover { opacity:.85; }
  .auth-rule { height:1px; background:var(--rule); margin:28px 0; }
  .watermark { font-size:11px; color:var(--ink-ghost); text-align:center; font-family:var(--mono); margin-top:28px; }

  /* ── onboarding ── */
  .ob-wrap { min-height:100vh; background:var(--paper); display:flex; align-items:center; justify-content:center; padding:20px; }
  .ob-card { width:100%; max-width:480px; animation:fadeUp .5s ease; }
  .ob-step { font-family:var(--mono); font-size:11px; color:var(--ink-light); letter-spacing:.1em; text-transform:uppercase; margin-bottom:24px; }
  .ob-title { font-family:var(--serif); font-size:24px; color:var(--ink); margin-bottom:8px; }
  .ob-desc { font-size:14px; color:var(--ink-mid); line-height:1.6; margin-bottom:32px; }
  .ob-rule { height:1px; background:var(--rule); margin:28px 0; }
  .ob-choice { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .ob-option { padding:20px; border:1px solid var(--rule); border-radius:var(--r); background:var(--paper-dark); text-align:left; transition:.2s; }
  .ob-option:hover { border-color:var(--ink-mid); }
  .ob-option.on { border-color:var(--ink); background:var(--paper-mid); }
  .ob-option-icon { font-size:20px; margin-bottom:10px; }
  .ob-option-title { font-size:14px; font-weight:500; color:var(--ink); margin-bottom:3px; }
  .ob-option-sub { font-size:12px; color:var(--ink-light); }
  .ob-input { width:100%; padding:10px 12px; background:var(--paper-dark); border:1px solid var(--rule); border-radius:var(--r); font-size:14px; color:var(--ink); margin-bottom:16px; transition:border .2s; }
  .ob-input:focus { border-color:var(--ink-mid); }
  .ob-input::placeholder { color:var(--ink-ghost); }
  .btn-ink { padding:11px 24px; background:var(--ink); color:var(--paper); border-radius:var(--r); font-size:13px; font-weight:500; transition:opacity .2s; }
  .btn-ink:hover { opacity:.8; }
  .btn-ghost { padding:11px 24px; background:transparent; border:1px solid var(--rule); border-radius:var(--r); font-size:13px; color:var(--ink-mid); transition:.2s; }
  .btn-ghost:hover { border-color:var(--ink-mid); color:var(--ink); }
  .ob-feature { display:flex; gap:14px; align-items:flex-start; margin-bottom:18px; }
  .ob-feature-icon { width:32px; height:32px; border:1px solid var(--rule); border-radius:var(--r); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; background:var(--paper-dark); }
  .ob-feature-title { font-size:14px; font-weight:500; color:var(--ink); margin-bottom:2px; }
  .ob-feature-sub { font-size:12px; color:var(--ink-light); }

  /* ── nav ── */
  .nav { height:52px; background:var(--paper); border-bottom:1px solid var(--rule); display:flex; align-items:center; padding:0 32px; gap:0; position:sticky; top:0; z-index:200; }
  .nav-logo { font-family:var(--serif); font-size:18px; color:var(--ink); letter-spacing:-.3px; margin-right:auto; }
  .nav-link { font-size:13px; color:var(--ink-light); padding:6px 14px; border-radius:var(--r); transition:.15s; font-weight:400; }
  .nav-link:hover, .nav-link.on { color:var(--ink); background:var(--paper-dark); }
  .nav-divider { width:1px; height:18px; background:var(--rule); margin:0 8px; }
  .nav-avatar { width:28px; height:28px; border-radius:50%; background:var(--ink); color:var(--paper); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:500; font-family:var(--mono); margin-left:8px; }

  /* ── dashboard ── */
  .dash-wrap { min-height:calc(100vh - 52px); background:var(--paper); }
  .dash-hero { padding:80px 48px 60px; border-bottom:1px solid var(--rule); }
  .dash-greet { font-family:var(--serif); font-size:42px; color:var(--ink); line-height:1.15; margin-bottom:12px; }
  .dash-greet em { font-style:italic; color:var(--accent); }
  .dash-tagline { font-size:15px; color:var(--ink-mid); max-width:420px; line-height:1.7; margin-bottom:36px; }
  .btn-search { display:inline-flex; align-items:center; gap:10px; padding:14px 28px; background:var(--ink); color:var(--paper); border-radius:var(--r); font-size:14px; font-weight:500; transition:opacity .2s; letter-spacing:.01em; }
  .btn-search:hover { opacity:.82; }
  .btn-search svg { opacity:.6; }
  .dash-stats { display:flex; gap:0; border-top:1px solid var(--rule); }
  .stat-item { flex:1; padding:32px 48px; border-right:1px solid var(--rule); }
  .stat-item:last-child { border-right:none; }
  .stat-num { font-family:var(--serif); font-size:36px; color:var(--ink); margin-bottom:4px; }
  .stat-lbl { font-size:11px; font-family:var(--mono); color:var(--ink-light); text-transform:uppercase; letter-spacing:.08em; }
  .dash-recent { padding:40px 48px; }
  .section-title { font-family:var(--mono); font-size:11px; color:var(--ink-light); letter-spacing:.1em; text-transform:uppercase; margin-bottom:20px; }
  .activity-item { display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--rule); }
  .activity-item:last-child { border-bottom:none; }
  .activity-dot { width:6px; height:6px; border-radius:50%; background:var(--ink-ghost); flex-shrink:0; }
  .activity-text { font-size:13px; color:var(--ink-mid); flex:1; }
  .activity-text strong { color:var(--ink); font-weight:500; }
  .activity-time { font-size:11px; font-family:var(--mono); color:var(--ink-ghost); }

  /* ── search page ── */
  .search-wrap { display:flex; min-height:calc(100vh - 52px); }

  /* sidebar */
  .sidebar { width:260px; flex-shrink:0; border-right:1px solid var(--rule); background:var(--paper); padding:32px 24px; position:sticky; top:52px; height:calc(100vh - 52px); overflow-y:auto; }
  .sidebar-title { font-family:var(--serif); font-size:16px; color:var(--ink); margin-bottom:24px; }
  .filter-group { margin-bottom:28px; }
  .filter-label { font-size:11px; font-family:var(--mono); color:var(--ink-light); letter-spacing:.08em; text-transform:uppercase; margin-bottom:10px; }
  .filter-input { width:100%; padding:8px 10px; background:var(--paper-dark); border:1px solid var(--rule); border-radius:var(--r); font-size:13px; color:var(--ink); transition:border .2s; }
  .filter-input:focus { border-color:var(--ink-mid); }
  .filter-input::placeholder { color:var(--ink-ghost); }
  .filter-select { width:100%; padding:8px 10px; background:var(--paper-dark); border:1px solid var(--rule); border-radius:var(--r); font-size:13px; color:var(--ink); appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239a9088'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; }
  .type-pills { display:flex; flex-direction:column; gap:6px; }
  .type-pill { padding:8px 12px; border:1px solid var(--rule); border-radius:var(--r); font-size:13px; color:var(--ink-mid); text-align:left; transition:.15s; background:var(--paper-dark); }
  .type-pill:hover { border-color:var(--ink-mid); color:var(--ink); }
  .type-pill.on { border-color:var(--ink); background:var(--paper-mid); color:var(--ink); font-weight:500; }
  .sidebar-run { width:100%; padding:11px; background:var(--ink); color:var(--paper); border-radius:var(--r); font-size:13px; font-weight:500; transition:opacity .2s; margin-top:4px; }
  .sidebar-run:hover { opacity:.8; }
  .sidebar-clear { width:100%; padding:9px; background:transparent; border:1px solid var(--rule); border-radius:var(--r); font-size:12px; color:var(--ink-light); transition:.2s; margin-top:8px; }
  .sidebar-clear:hover { border-color:var(--ink-mid); color:var(--ink); }

  /* leads panel */
  .leads-panel { flex:1; padding:32px 36px; overflow-y:auto; }
  .leads-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
  .leads-count { font-size:13px; color:var(--ink-light); font-family:var(--mono); }
  .leads-count strong { color:var(--ink); }
  .btn-export-bulk { display:flex; align-items:center; gap:8px; padding:9px 18px; border:1px solid var(--rule); border-radius:var(--r); font-size:13px; color:var(--ink-mid); transition:.2s; }
  .btn-export-bulk:hover { border-color:var(--ink-mid); color:var(--ink); background:var(--paper-dark); }
  
  .scroll-pill { position:fixed; bottom:40px; right:48px; display:flex; flex-direction:column; background:var(--ink); border-radius:32px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.15); z-index:100; }
  .scroll-pill button { padding:14px 16px; color:var(--paper); transition:.2s; display:flex; align-items:center; justify-content:center; }
  .scroll-pill button:hover { background:var(--ink-mid); }
  .scroll-divider { height:1px; background:#4a4540; width:100%; }

  /* empty state */
  .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; padding:40px; }
  .empty-icon { width:64px; height:64px; border:1px solid var(--rule); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; color:var(--ink-ghost); }
  .empty-title { font-family:var(--serif); font-size:22px; color:var(--ink); margin-bottom:8px; }
  .empty-sub { font-size:14px; color:var(--ink-light); max-width:280px; line-height:1.6; }

  /* lead card */
  .lead-card { border:1px solid var(--rule); border-radius:var(--r); background:var(--paper); margin-bottom:10px; transition:.2s; overflow:hidden; }
  .lead-card:hover { border-color:var(--ink-mid); }
  .lead-card.open { border-color:var(--ink-mid); }
  .lead-card-top { display:flex; align-items:center; gap:14px; padding:16px 18px; cursor:pointer; }
  .lead-check { width:16px; height:16px; accent-color:var(--ink); flex-shrink:0; cursor:pointer; }
  .lead-name { font-size:14px; font-weight:500; color:var(--ink); flex:1; }
  .lead-city { font-size:12px; color:var(--ink-light); flex:1; }
  .type-badge { font-size:11px; font-family:var(--mono); padding:3px 8px; border-radius:2px; border:1px solid; letter-spacing:.04em; }
  .type-badge.Civil { color:#2c4a2e; border-color:#2c4a2e44; background:#2c4a2e0a; }
  .type-badge.Structural { color:#4a2c2e; border-color:#4a2c2e44; background:#4a2c2e0a; }
  .type-badge.MEP { color:#2c3a4a; border-color:#2c3a4a44; background:#2c3a4a0a; }
  .lead-email-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .lead-email-dot.yes { background:#5c7a6b; }
  .lead-email-dot.no { background:var(--ink-ghost); }
  
  .lead-status { display:flex; align-items:center; flex:1; justify-content:flex-end; gap:8px; margin-right:12px; }
  .status-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-family:var(--mono); padding:4px 8px; border:1px solid var(--rule); border-radius:2px; color:var(--ink-mid); background:var(--paper-dark); }
  .status-badge.viewed { color:var(--accent-warm); border-color:#7a4a2c44; background:#7a4a2c08; }
  .status-badge.exported { color:var(--accent); border-color:#2c4a2e44; background:#2c4a2e0a; }
  .lead-expand-btn { color:var(--ink-ghost); font-size:16px; line-height:1; transition:transform .2s; padding:4px; }
  .lead-expand-btn.open { transform:rotate(180deg); }

  .lead-detail { border-top:1px solid var(--rule); padding:20px 18px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; background:var(--paper-dark); animation:fadeIn .2s ease; }
  .detail-group-label { font-size:11px; font-family:var(--mono); color:var(--ink-light); letter-spacing:.08em; text-transform:uppercase; margin-bottom:8px; }
  .detail-val { font-size:13px; color:var(--ink-mid); margin-bottom:4px; }
  .detail-val.email { color:#5c7a6b; }
  .detail-val.missing { color:var(--ink-ghost); font-style:italic; }
  .detail-val.link { color:var(--accent-cool); text-decoration:none; }
  .detail-val.link:hover { text-decoration:underline; }
  .search-btns { display:flex; flex-direction:column; gap:6px; }
  .search-btn { display:flex; align-items:center; gap:8px; padding:7px 12px; border:1px solid var(--rule); border-radius:var(--r); font-size:12px; color:var(--ink-mid); transition:.15s; background:var(--paper); text-align:left; }
  .search-btn:hover { border-color:var(--ink-mid); color:var(--ink); background:var(--paper-dark); }
  .search-btn.linkedin { border-color:#0a66c233; color:#0a66c2; }
  .search-btn.linkedin:hover { background:#0a66c20a; }
  .activity-pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-family:var(--mono); color:var(--ink-light); margin-bottom:4px; }

  /* ── CRM page ── */
  .crm-wrap { padding:40px 48px; max-width:800px; }
  .crm-title { font-family:var(--serif); font-size:28px; color:var(--ink); margin-bottom:8px; }
  .crm-sub { font-size:14px; color:var(--ink-mid); margin-bottom:40px; line-height:1.6; }
  .crm-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:40px; }
  .crm-card { border:1px solid var(--rule); border-radius:var(--r); padding:24px; background:var(--paper-dark); transition:.2s; }
  .crm-card:hover { border-color:var(--ink-mid); }
  .crm-card-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
  .crm-logo { width:36px; height:36px; border-radius:var(--r); border:1px solid var(--rule); display:flex; align-items:center; justify-content:center; font-size:16px; background:var(--paper); }
  .crm-name { font-size:15px; font-weight:500; color:var(--ink); }
  .crm-desc { font-size:12px; color:var(--ink-light); margin-bottom:16px; line-height:1.5; }
  .crm-connect { width:100%; padding:9px; border:1px solid var(--ink); border-radius:var(--r); background:transparent; color:var(--ink); font-size:13px; font-weight:500; transition:.2s; }
  .crm-connect:hover { background:var(--ink); color:var(--paper); }
  .crm-connect.connected { background:var(--ink); color:var(--paper); }
  .crm-export-section { border-top:1px solid var(--rule); padding-top:32px; }
  .crm-export-title { font-size:15px; font-weight:500; color:var(--ink); margin-bottom:16px; }
  .crm-csv-btn { display:inline-flex; align-items:center; gap:10px; padding:12px 24px; border:1px solid var(--rule); border-radius:var(--r); font-size:14px; color:var(--ink-mid); transition:.2s; }
  .crm-csv-btn:hover { border-color:var(--ink-mid); color:var(--ink); background:var(--paper-dark); }

  /* ── toast ── */
  /* ── toast ── */
  .toast { position:fixed; bottom:24px; right:24px; background:var(--ink); color:var(--paper); padding:12px 20px; border-radius:var(--r); font-size:13px; z-index:999; animation:fadeUp .3s ease; display:flex; align-items:center; gap:8px; }

  /* ── Skeleton Loaders ── */
  @keyframes skeleton-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton-box {
    background: linear-gradient(90deg, var(--paper-dark) 25%, var(--rule) 50%, var(--paper-dark) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite linear;
    border-radius: 4px;
  }
  .signal-link { text-decoration:none; color:var(--ink); }
  .signal-link:hover { text-decoration:underline !important; }
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function SkeletonLead() {
  return (
    <div className="lead-card" style={{ pointerEvents: 'none' }}>
      <div className="lead-card-top">
        <div className="skeleton-box" style={{ width: 16, height: 16, borderRadius: 2 }} />
        <div className="skeleton-box" style={{ flex: 1, height: 18, maxWidth: 200 }} />
        <div className="skeleton-box" style={{ flex: 1, height: 14, maxWidth: 150 }} />
        <div className="skeleton-box" style={{ width: 60, height: 20, borderRadius: 2 }} />
        <div className="lead-status">
          <div className="skeleton-box" style={{ width: 80, height: 20, borderRadius: 2 }} />
        </div>
        <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: 4, marginRight: 4 }} />
        <div className="skeleton-box" style={{ width: 28, height: 28, borderRadius: 4, marginRight: 8 }} />
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="dashboard-wrap fade-in">
      <div className="skeleton-box" style={{ width: '60%', height: 36, marginBottom: 8 }} />
      <div className="skeleton-box" style={{ width: '40%', height: 20, marginBottom: 40 }} />
      
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ border: "1px solid var(--rule)", borderRadius: "var(--r)", padding: 24, background: "var(--paper-dark)" }}>
            <div className="skeleton-box" style={{ width: 100, height: 14, marginBottom: 16 }} />
            <div className="skeleton-box" style={{ width: 60, height: 36 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
        <div>
          <div className="skeleton-box" style={{ width: 150, height: 20, marginBottom: 16 }} />
          {[1,2,3,4].map(i => (
            <div key={i} style={{ padding: "16px 0", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-box" style={{ width: "80%", height: 14, marginBottom: 6 }} />
                <div className="skeleton-box" style={{ width: "40%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="skeleton-box" style={{ width: 120, height: 20, marginBottom: 16 }} />
          {[1,2,3].map(i => (
            <div key={i} style={{ padding: "12px 16px", border: "1px solid var(--rule)", borderRadius: "var(--r)", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skeleton-box" style={{ width: 8, height: 8, borderRadius: "50%" }} />
                <div className="skeleton-box" style={{ width: 100, height: 14 }} />
              </div>
              <div className="skeleton-box" style={{ width: 60, height: 24, borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onHide }) {
  useState(() => { const t = setTimeout(onHide, 2800); return () => clearTimeout(t); });
  return <div className="toast">✓ {msg}</div>;
}

function Nav({ page, setPage, user, onLogout, onSettingsClick, onTeamClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.name ? user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "U";
  const teamName = localStorage.getItem("veltrix_team") || "Team";
  
  return (
    <nav className="nav">
      <span className="nav-logo">Veltrix</span>
      <button className={`nav-link ${page==="dashboard"?"on":""}`} onClick={()=>setPage("dashboard")}>Home</button>
      <button className={`nav-link ${page==="search"?"on":""}`} onClick={()=>setPage("search")}>Search</button>
      <button className={`nav-link ${page==="signals"?"on":""}`} onClick={()=>setPage("signals")} style={{display:"flex",alignItems:"center",gap:5}}>Signals <span style={{fontSize:9,background:"rgba(255,107,107,0.15)",color:"#ff6b6b",padding:"1px 5px",borderRadius:3,fontWeight:600,letterSpacing:.3}}>LIVE</span></button>
      <div className="nav-divider"/>
      
      <div style={{marginRight:"auto", marginLeft: 16}}>
        <div style={{background:"var(--accent)", color:"#fff", padding:"4px 10px", borderRadius:4, fontSize:12, fontWeight:500, letterSpacing:0.2}}>
          {teamName}
        </div>
      </div>
      
      <div style={{position:"relative"}}>
        <button className="nav-avatar" onClick={()=>setMenuOpen(!menuOpen)} style={{border:"none",padding:0,cursor:"pointer"}}>{initials}</button>
        {menuOpen && (
          <>
            <div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setMenuOpen(false)}/>
            <div className="fade-in" style={{position:"absolute",top:"100%",right:0,marginTop:8,width:200,background:"var(--paper)",border:"1px solid var(--rule)",borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,0.1)",zIndex:100,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid var(--rule)"}}>
                <div style={{fontSize:13,fontWeight:500,color:"var(--ink)"}}>{user?.name}</div>
                <div style={{fontSize:11,color:"var(--ink-light)",fontFamily:"var(--mono)",marginTop:2}}>{user?.email}</div>
              </div>
              <button style={{padding:"10px 16px",textAlign:"left",fontSize:13,color:"var(--ink-mid)",background:"transparent",border:"none"}} onClick={()=>{setMenuOpen(false); onSettingsClick();}} onMouseOver={e=>e.target.style.background="var(--paper-dark)"} onMouseOut={e=>e.target.style.background="transparent"}>Settings</button>
              <button style={{padding:"10px 16px",textAlign:"left",fontSize:13,color:"var(--ink-mid)",background:"transparent",border:"none"}} onClick={()=>{setMenuOpen(false); onTeamClick();}} onMouseOver={e=>e.target.style.background="var(--paper-dark)"} onMouseOut={e=>e.target.style.background="transparent"}>Team & Usage</button>
              <div style={{height:1,background:"var(--rule)"}}/>
              <button style={{padding:"10px 16px",textAlign:"left",fontSize:13,color:"#d32f2f",background:"transparent",border:"none"}} onClick={()=>{setMenuOpen(false); onLogout();}} onMouseOver={e=>e.target.style.background="var(--paper-dark)"} onMouseOut={e=>e.target.style.background="transparent"}>Sign out</button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="auth-wrap">
      <style>{css}</style>
      <div className="auth-card fade-up">
        <div className="auth-logo">Veltrix</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"on":""}`} onClick={()=>setMode("login")}>Sign in</button>
          <button className={`auth-tab ${mode==="signup"?"on":""}`} onClick={()=>setMode("signup")}>Create account</button>
        </div>
        {mode==="signup" && (
          <div className="field"><label>Full name</label><input placeholder="Jane Smith" value={name} onChange={e=>setName(e.target.value)}/></div>
        )}
        <div className="field"><label>Email</label><input type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="field"><label>Password</label><input type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/></div>
        <button className="btn-primary" onClick={async ()=>{
          try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
            let endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
            let body = mode === "login" ? { email, password: pass } : { name: name || "Alex Johnson", email, password: pass };
            
            const res = await fetch(`${apiUrl}${endpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error((await res.json()).detail || "Authentication failed");
            
            if (mode === "signup") {
              const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: pass })
              });
              if (!loginRes.ok) throw new Error("Auto-login failed after signup");
              const { access_token } = await loginRes.json();
              localStorage.setItem("veltrix_token", access_token);
              
              const meRes = await fetch(`${apiUrl}/api/users/me`, { headers: { "Authorization": `Bearer ${access_token}` } });
              const u = await meRes.json();
              onAuth(u);
            } else {
              const { access_token } = await res.json();
              localStorage.setItem("veltrix_token", access_token);
              
              const meRes = await fetch(`${apiUrl}/api/users/me`, { headers: { "Authorization": `Bearer ${access_token}` } });
              const u = await meRes.json();
              onAuth(u);
            }
          } catch (err) {
            alert(err.message);
          }
        }}>
          {mode==="login" ? "Sign in →" : "Create account →"}
        </button>
        <div className="auth-rule"/>

      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingScreen({ user, onDone }) {
  const [step, setStep] = useState(1);
  const [teamMode, setTeamMode] = useState(null);
  const [teamName, setTeamName] = useState("");
  
  const [createdTeams, setCreatedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("veltrix_token");
    fetch(`${apiUrl}/api/teams`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setCreatedTeams(data);
        if (data.length > 0) setSelectedTeam(data[0].id);
      })
      .catch(console.error);
  }, []);

  const firstName = user?.name ? user.name.split(" ")[0] : "User";

  const handleContinue = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("veltrix_token");
    
    try {
      if (teamMode === "create" && teamName) {
        const res = await fetch(`${apiUrl}/api/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ name: teamName })
        });
        if (!res.ok) throw new Error("Failed to create team");
        const t = await res.json();
        localStorage.setItem("veltrix_team", t.name);
        setStep(2);
      } else if (teamMode === "join" && selectedTeam) {
        const res = await fetch(`${apiUrl}/api/teams/join?team_id=${selectedTeam}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to join team");
        const t = createdTeams.find(x => x.id === selectedTeam);
        localStorage.setItem("veltrix_team", t?.name || "Team");
        setTeamName(t?.name || "Team");
        setStep(2);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="ob-wrap">
      <style>{css}</style>
      <div className="ob-card fade-up">
        <div style={{display:"flex",gap:6,marginBottom:36}}>
          {[1,2].map(s=>(
            <div key={s} style={{height:2,width:48,borderRadius:1,background:s<=step?"var(--ink)":"var(--rule)",transition:".3s"}}/>
          ))}
        </div>

        {step===1 && <>
          <div className="ob-step">Step 1 of 2 · Team setup</div>
          <div className="ob-title">Welcome, {firstName}.</div>
          <div className="ob-desc">Set up your workspace so your team can collaborate on leads — tracking who viewed and exported what.</div>
          <div className="ob-choice">
            <button className={`ob-option ${teamMode==="create"?"on":""}`} onClick={()=>setTeamMode("create")}>
              <div className="ob-option-icon">⊕</div>
              <div className="ob-option-title">New team</div>
              <div className="ob-option-sub">Create a workspace</div>
            </button>
            <button className={`ob-option ${teamMode==="join"?"on":""}`} onClick={()=>setTeamMode("join")}>
              <div className="ob-option-icon">→</div>
              <div className="ob-option-title">Join team</div>
              <div className="ob-option-sub">Select an existing team</div>
            </button>
          </div>
          {teamMode==="create" && <input className="ob-input" placeholder="Team name e.g. Apex BD Team" value={teamName} onChange={e=>setTeamName(e.target.value)}/>}
          {teamMode==="join" && (
            <select className="ob-input" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)} style={{appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239a9088'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center"}}>
              {createdTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button className="btn-ink" style={{width:"100%"}} onClick={handleContinue} disabled={(teamMode==="create"&&!teamName) || !teamMode}>Continue →</button>
        </>}

        {step===2 && <>
          <div className="ob-step">Step 2 of 2 · You're ready</div>
          <div className="ob-title">All set.</div>
          <div className="ob-desc">Team <strong>{teamName||"Apex BD Team"}</strong> is ready. Here's what you can do.</div>
          <div className="ob-rule"/>
          {[
            ["⊙","Search & filter leads","Browse 12,000+ engineering firms by state, type, registration date, and keywords"],
            ["↗","Web search per lead","Instantly open Google or LinkedIn to find contacts for any firm"],
            ["⇄","Export to CRM","Push directly to HubSpot, Pipedrive, or Salesforce — or download CSV"],
            ["◎","Team activity log","See who on your team viewed or exported each lead"],
          ].map(([icon,title,sub])=>(
            <div className="ob-feature" key={title}>
              <div className="ob-feature-icon">{icon}</div>
              <div><div className="ob-feature-title">{title}</div><div className="ob-feature-sub">{sub}</div></div>
            </div>
          ))}
          <div className="ob-rule"/>
          <button className="btn-ink" style={{width:"100%"}} onClick={onDone}>Start discovering →</button>
        </>}
      </div>
    </div>
  );
}

function Dashboard({ user, setPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name ? user.name.split(" ")[0] : "User";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("veltrix_token");
        const res = await fetch(`${apiUrl}/api/dashboard`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.status === 401) {
          // Token expired or invalid DB
          localStorage.clear();
          window.location.reload();
          return;
        }
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);
  if (loading) return <SkeletonDashboard />;

  return (
    <div className="dash-wrap">
      <div className="dash-hero fade-up">
        <div className="dash-greet">Hello, <em>{firstName}.</em></div>
        <div className="dash-tagline">Find, qualify, and export US engineering firm leads — civil, structural, and MEP.</div>
        <button className="btn-search" onClick={()=>setPage("search")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Search leads
        </button>
      </div>

      <div className="dash-stats">
        {[
          [data?.my_stats?.viewed_today || 0, "Leads viewed today"],
          [data?.my_stats?.exported_today || 0, "Leads exported today"],
          [data?.my_stats?.exported_week || 0, "Leads exported this week"],
          [data?.my_stats?.exported_month || 0, "Leads exported this month"]
        ].map(([n,l])=>(
          <div className="stat-item fade-up" key={l}>
            <div className="stat-num">{loading ? "—" : n}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </div>
      
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:40,padding:"0 48px",marginTop:40}}>
        <div className="dash-recent fade-up">
          <div className="section-title" style={{fontSize:16,fontWeight:500,color:"var(--ink)",marginBottom:20}}>Recent team activity</div>
          {loading ? (
            <div style={{fontSize:14,color:"var(--ink-mid)"}}>Loading activity...</div>
          ) : !data?.recent_activity?.length ? (
            <div style={{fontSize:14,color:"var(--ink-mid)"}}>No recent activity found.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {data.recent_activity.map((a, i) => (
                <div className="activity-item" key={i} style={{display:"flex",gap:12,alignItems:"center",paddingBottom:16,borderBottom:"1px solid var(--rule)"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>
                  <div style={{fontSize:14,color:"var(--ink)"}}><strong>{a.name}</strong> {a.action} <strong>{a.target}</strong></div>
                  <div style={{marginLeft:"auto",fontSize:12,color:"var(--ink-light)"}}>{a.time_ago}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="dash-live fade-up" style={{borderLeft:"1px solid var(--rule)",paddingLeft:40}}>
          <div className="section-title" style={{fontSize:16,fontWeight:500,color:"var(--ink)",marginBottom:20}}>Live Team Members</div>
          {loading ? (
            <div style={{fontSize:14,color:"var(--ink-mid)"}}>Loading...</div>
          ) : !data?.live_members?.length ? (
            <div style={{fontSize:14,color:"var(--ink-mid)"}}>You are the only one online right now.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {data.live_members.map(m => (
                <div key={m.id} style={{display:"flex",gap:12,alignItems:"center",padding:12,background:"var(--paper-dark)",borderRadius:6}}>
                  <div style={{position:"relative"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:"var(--ink)",color:"var(--paper)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500}}>
                      {m.name[0].toUpperCase()}
                    </div>
                    <div style={{position:"absolute",bottom:0,right:0,width:8,height:8,background:"#4caf50",borderRadius:"50%",border:"2px solid var(--paper-dark)"}}/>
                  </div>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--ink)"}}>{m.name}</div>
                  <div style={{marginLeft:"auto",fontSize:12,color:"var(--ink-mid)"}}>Active</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH PAGE ──────────────────────────────────────────────────────────────
function SearchPage({ user, results, setResults, setShowSettings }) {
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput] = useState("");
  const [keywordLogic, setKeywordLogic] = useState("AND");
  const [incStates, setIncStates] = useState([]);
  const [excStates, setExcStates] = useState([]);
  const [stateTab, setStateTab] = useState("include");
  const [firmTypes, setFirmTypes] = useState([]);
  const [regAfter, setRegAfter] = useState("");
  const [hasEmail, setHasEmail] = useState(false);
  const [hasLinkedin, setHasLinkedin] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [offset, setOffset] = useState(0);
  const panelRef = useRef(null);

  const [signals, setSignals] = useState({});
  const [signalsLoading, setSignalsLoading] = useState({});
  const [onlyHiring, setOnlyHiring] = useState(false);

  const fetchSignals = async (leadId, force = false) => {
    if (signals[leadId] && !force) return;
    setSignalsLoading(prev => ({...prev, [leadId]: true}));
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("veltrix_token");
      const res = await fetch(`${apiUrl}/api/leads/${leadId}/signals${force ? '?force=true' : ''}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSignals(prev => ({...prev, [leadId]: data}));
        
        // Dynamic intent score calculation for immediate UI response
        if (data.length > 0) {
          const typeWeights = { hiring: 45, social: 30, news: 25 };
          const typesFound = new Set(data.map(s => s.signal_type));
          let score = 0;
          data.forEach(s => {
            const ageDays = Math.max(0, Math.floor((new Date() - new Date(s.created_at)) / (1000 * 60 * 60 * 24)));
            const decay = Math.max(0.2, 1.0 - (ageDays / 30.0));
            score += (typeWeights[s.signal_type] || 10) * decay;
          });
          let finalScore = Math.min(100, Math.floor(score));
          if (typesFound.size > 1) {
            finalScore = Math.min(100, finalScore + 10);
          }
          
          setResults(prev => prev.map(l => l.id === leadId ? {...l, intent_score: finalScore} : l));
        } else {
          setResults(prev => prev.map(l => l.id === leadId ? {...l, intent_score: 0} : l));
        }
      }
    } catch (err) {
      console.error("Error fetching signals:", err);
    } finally {
      setSignalsLoading(prev => ({...prev, [leadId]: false}));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' });
  };

  const runSearch = async (isLoadMore = false) => {
    setLoading(true);
    if (!isLoadMore) {
      setResults([]);
    }
    try {
      const currentOffset = isLoadMore ? offset + 500 : 0;
      const params = new URLSearchParams();
      incStates.forEach(s => params.append("states", s));
      excStates.forEach(s => params.append("exclude_states", s));
      firmTypes.forEach(t => params.append("firm_types", t));
      keywords.forEach(k => params.append("keywords", k));
      params.append("keyword_logic", keywordLogic);
      
      if (regAfter) params.append("reg_after", regAfter);
      if (hasEmail) params.append("has_email", "true");
      if (hasLinkedin) params.append("has_linkedin", "true");
      params.append("limit", "500");
      params.append("offset", currentOffset.toString());

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("veltrix_token");
      const res = await fetch(`${apiUrl}/api/leads?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      
      const mappedLeads = data.leads.map(l => ({
        id: l.id,
        name: l.name,
        type: l.firm_type || "Engineering",
        state: l.state,
        city: l.city || "",
        address: l.address || "",
        phone: l.phone || "",
        email: l.email || "",
        website: l.website || "",
        linkedin: l.linkedin || "",
        regDate: l.reg_date || "",
        licenseNo: l.license_no || "",
        viewedBy: [],
        exportedBy: [],
        intent_score: l.intent_score || 0
      }));
      if (isLoadMore) {
        setResults(prev => [...prev, ...mappedLeads]);
        setOffset(currentOffset);
      } else {
        setResults(mappedLeads);
        setOffset(0);
        setSelected(new Set());
      }
      setTotalLeads(data.total);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setToast("Error fetching leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setKeywords([]); setKwInput(""); setKeywordLogic("AND");
    setIncStates([]); setExcStates([]); setStateTab("include");
    setFirmTypes([]); setRegAfter("");
    setHasEmail(false); setHasLinkedin(false);
    setSearched(false); setResults([]); setSelected(new Set());
    setTotalLeads(0); setOffset(0);
  };

  const toggleSelect = id => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelected(s => s.size === results.length ? new Set() : new Set(results.map(l=>l.id)));
  };

  const recordActivity = async (id, action) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("veltrix_token");
      await fetch(`${apiUrl}/api/leads/${id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
    } catch (e) { console.error(e); }
  };

  const handleView = (id) => {
    const viewer = user?.name ? user.name.split(" ")[0] : "You";
    setResults(prev => prev.map(l => {
      if (l.id === id) {
        if (!l.viewedBy.includes(viewer)) {
          recordActivity(id, "viewed");
          return { ...l, viewedBy: [...l.viewedBy, viewer] };
        }
      }
      return l;
    }));
  };

  const exportCSV = (leadsToExport) => {
    const exporter = user?.name ? user.name.split(" ")[0] : "You";
    setResults(prev => prev.map(l => {
      if (leadsToExport.find(ex => ex.id === l.id)) {
        if (!l.exportedBy.includes(exporter)) {
          recordActivity(l.id, "exported");
          return { ...l, exportedBy: [...l.exportedBy, exporter] };
        }
      }
      return l;
    }));

    const h = "Name,Type,State,City,Phone,Email,Website,LinkedIn,License,Registered\n";
    const rows = leadsToExport.map(l=>`"${l.name}","${l.type}","${l.state}","${l.city}","${l.phone||""}","${l.email||""}","${l.website||""}","${l.linkedin||""}","${l.licenseNo}","${l.regDate}"`).join("\n");
    const blob = new Blob([h+rows],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="engineering-leads.csv"; a.click();
    setToast(`${leadsToExport.length} lead${leadsToExport.length!==1?"s":""} exported as CSV`);
  };

  const exportToCRM = async (leadsToExport) => {
    const url = localStorage.getItem("crmUrl");
    const token = localStorage.getItem("crmToken");
    
    if (!url) {
      setToast("Please configure CRM API URL in Settings (click your profile icon).");
      if (setShowSettings) setShowSettings(true);
      return;
    }
    
    setToast(`Pushing ${leadsToExport.length} lead(s) to CRM...`);
    
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ leads: leadsToExport })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const exporter = user?.name ? user.name.split(" ")[0] : "You";
      setResults(prev => prev.map(l => {
        if (leadsToExport.find(ex => ex.id === l.id)) {
          if (!l.exportedBy.includes(exporter)) {
            recordActivity(l.id, "exported");
            return { ...l, exportedBy: [...l.exportedBy, exporter] };
          }
        }
        return l;
      }));
      setToast(`${leadsToExport.length} lead(s) successfully pushed to CRM!`);
    } catch (err) {
      console.error(err);
      setToast("CRM Export Failed: " + err.message);
    }
  };

  const webSearch = (q) => window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");

  const displayedResults = onlyHiring 
    ? results.filter(l => (l.intent_score || 0) >= 50) 
    : results;

  return (
    <div className="search-wrap">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-title">Filters</div>

        <div className="filter-group">
          <div className="filter-label">Keywords</div>
          <div style={{display:"flex",gap:8,marginBottom:12,padding:4,background:"var(--paper-dark)",borderRadius:6,border:"1px solid var(--rule)"}}>
            <button style={{flex:1,padding:"6px",fontSize:11,borderRadius:4,background:keywordLogic==="AND"?"var(--ink)":"transparent",color:keywordLogic==="AND"?"var(--paper)":"var(--ink-light)",cursor:"pointer",transition:".2s",fontWeight:500}} onClick={()=>setKeywordLogic("AND")}>Match ALL</button>
            <button style={{flex:1,padding:"6px",fontSize:11,borderRadius:4,background:keywordLogic==="OR"?"var(--ink)":"transparent",color:keywordLogic==="OR"?"var(--paper)":"var(--ink-light)",cursor:"pointer",transition:".2s",fontWeight:500}} onClick={()=>setKeywordLogic("OR")}>Match ANY</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {keywords.map(k=>(
              <div key={k} style={{fontSize:12,padding:"2px 8px",background:"var(--ink)",color:"var(--paper)",borderRadius:12,display:"flex",alignItems:"center",gap:6}}>
                {k} <span style={{cursor:"pointer",opacity:0.7}} onClick={()=>setKeywords(keywords.filter(x=>x!==k))}>×</span>
              </div>
            ))}
          </div>
          <input className="filter-input" placeholder="Type keyword and hit Enter…" value={kwInput} onChange={e=>setKwInput(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Enter"){
                if(kwInput.trim() && !keywords.includes(kwInput.trim())) setKeywords([...keywords, kwInput.trim()]);
                setKwInput("");
              }
            }}/>
        </div>

        <div className="filter-group">
          <div className="filter-label">Include states</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {incStates.map(s=>(
              <div key={s} style={{fontSize:12,padding:"2px 8px",background:"#2c4a2e",color:"#fff",borderRadius:12,display:"flex",alignItems:"center",gap:6}}>
                {s} <span style={{cursor:"pointer",opacity:0.7}} onClick={()=>setIncStates(incStates.filter(x=>x!==s))}>×</span>
              </div>
            ))}
          </div>
          <select className="filter-select" value="" onChange={e=>{
            const s = e.target.value;
            if(s && !incStates.includes(s) && !excStates.includes(s)) setIncStates([...incStates, s]);
          }}>
            <option value="">Select states to include...</option>
            {STATES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-label">Exclude states</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {excStates.map(s=>(
              <div key={s} style={{fontSize:12,padding:"2px 8px",background:"#4a2c2e",color:"#fff",borderRadius:12,display:"flex",alignItems:"center",gap:6}}>
                {s} <span style={{cursor:"pointer",opacity:0.7}} onClick={()=>setExcStates(excStates.filter(x=>x!==s))}>×</span>
              </div>
            ))}
          </div>
          <select className="filter-select" value="" onChange={e=>{
            const s = e.target.value;
            if(s && !excStates.includes(s) && !incStates.includes(s)) setExcStates([...excStates, s]);
          }}>
            <option value="">Select states to exclude...</option>
            {STATES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-label">Firm types</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {firmTypes.map(t=>(
              <div key={t} style={{fontSize:12,padding:"2px 8px",background:"var(--ink-mid)",color:"var(--paper)",borderRadius:12,display:"flex",alignItems:"center",gap:6}}>
                {t} <span style={{cursor:"pointer",opacity:0.7}} onClick={()=>setFirmTypes(firmTypes.filter(x=>x!==t))}>×</span>
              </div>
            ))}
          </div>
          <select className="filter-select" value="" onChange={e=>{
            const t = e.target.value;
            if(t && !firmTypes.includes(t)) setFirmTypes([...firmTypes, t]);
          }}>
            <option value="">Select firm types...</option>
            {["Civil", "Electrical", "Environmental", "Geotechnical", "MEP", "Mechanical", "Structural", "Transportation"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-label">Registered after</div>
          <input type="date" className="filter-input" value={regAfter} onChange={e=>setRegAfter(e.target.value)} style={{colorScheme:"light"}}/>
        </div>

        <div className="filter-group" style={{marginTop: 16, marginBottom: 16}}>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:500,color:"var(--ink)",cursor:"pointer"}}>
            <input type="checkbox" checked={onlyHiring} onChange={e=>setOnlyHiring(e.target.checked)} style={{cursor:"pointer"}}/>
            <span>🔥 Show Active & Hiring Only</span>
          </label>
        </div>

        <button className="sidebar-run" onClick={() => runSearch(false)} disabled={loading}>{loading ? "Searching..." : "Run search →"}</button>
        {searched && <button className="sidebar-clear" onClick={clearAll}>Clear & reset</button>}
      </aside>

      {/* LEADS PANEL */}
      <main className="leads-panel" ref={panelRef}>
        {results.length > 0 && (
          <div className="scroll-pill fade-up">
            <button onClick={scrollToTop} title="Scroll to top">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <div className="scroll-divider"/>
            <button onClick={scrollToBottom} title="Scroll to bottom">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        )}

        {!searched ? (
          <div className="empty-state fade-in">
            <div className="empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div className="empty-title">Set filters, then search</div>
            <div className="empty-sub">Use the filters on the left to narrow down engineering firms by state, type, or registration date.</div>
          </div>
        ) : loading && results.length === 0 ? (
          <div className="fade-in">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonLead key={i} />)}
          </div>
        ) : (
          <>
            <div className="leads-header">
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <input type="checkbox" className="lead-check" checked={selected.size===results.length&&results.length>0} onChange={toggleAll}/>
                <span className="leads-count"><strong>{results.length}</strong> firm{results.length!==1?"s":""} found</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                {selected.size>0 && (
                  <>
                    <button className="btn-export-bulk" onClick={()=>exportCSV(results.filter(l=>selected.has(l.id)))}>
                      ↓ Export {selected.size} CSV
                    </button>
                    <button className="btn-export-bulk" onClick={()=>exportToCRM(results.filter(l=>selected.has(l.id)))} style={{background:"var(--ink)",color:"var(--paper)"}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      Push to CRM
                    </button>
                  </>
                )}
                {results.length>0 && (
                  <button className="btn-export-bulk" onClick={()=>exportCSV(results)}>
                    ↓ Export all CSV
                  </button>
                )}
              </div>
            </div>

            {displayedResults.length===0 ? (
              <div className="empty-state fade-in">
                <div className="empty-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className="empty-title">No results</div>
                <div className="empty-sub">Try adjusting your filters or broadening the search.</div>
              </div>
            ) : (
              <div className="fade-in">
                {displayedResults.map(lead => (
                  <div key={lead.id} className={`lead-card ${expanded===lead.id?"open":""}`}>
                    <div className="lead-card-top" onClick={()=>{
                      const isExpanding = expanded !== lead.id;
                      setExpanded(isExpanding ? lead.id : null);
                      if (isExpanding) {
                        handleView(lead.id);
                        fetchSignals(lead.id);
                      }
                    }}>
                      <input type="checkbox" className="lead-check" checked={selected.has(lead.id)}
                        onChange={e=>{e.stopPropagation();toggleSelect(lead.id);}} onClick={e=>e.stopPropagation()}/>
                      <span className="lead-name" style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                        {lead.name}
                        {lead.intent_score >= 80 && (
                          <span style={{fontSize:10,fontWeight:600,background:"rgba(255,107,107,0.1)",color:"#ff6b6b",padding:"2px 6px",borderRadius:4,lineHeight:1,display:"inline-flex",alignItems:"center",gap:2}} title={`High Intent Score: ${lead.intent_score}`}>🔥 High</span>
                        )}
                        {lead.intent_score >= 50 && lead.intent_score < 80 && (
                          <span style={{fontSize:10,fontWeight:600,background:"rgba(245,166,35,0.1)",color:"#f5a623",padding:"2px 6px",borderRadius:4,lineHeight:1,display:"inline-flex",alignItems:"center",gap:2}} title={`Active Score: ${lead.intent_score}`}>⚡ Active</span>
                        )}
                      </span>
                      <span className="lead-city">{lead.city}, {lead.state}</span>
                      <span className={`type-badge ${lead.type}`}>{lead.type}</span>
                      
                      <div className="lead-status">
                        {lead.exportedBy.length > 0 ? (
                          <span className="status-badge exported" title={`Exported by: ${lead.exportedBy.join(', ')}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Exported
                          </span>
                        ) : lead.viewedBy.length > 0 ? (
                          <span className="status-badge viewed" title={`Viewed by: ${lead.viewedBy.join(', ')}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Viewed, not exported
                          </span>
                        ) : null}
                      </div>

                      <button className="search-btn" onClick={e=>{e.stopPropagation(); handleView(lead.id); webSearch(`${lead.name} ${lead.city} ${lead.state}`);}} style={{padding:"4px 8px", marginRight:"4px"}} title="Google Search">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      </button>
                      <button className="search-btn" onClick={e=>{e.stopPropagation(); exportToCRM([lead]);}} style={{padding:"4px 8px", marginRight:"8px"}} title="Push to CRM">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      </button>
                      <span className={`lead-expand-btn ${expanded===lead.id?"open":""}`}>⌄</span>
                    </div>

                    {expanded===lead.id && (
                      <div className="lead-detail" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.2fr",gap:24}}>
                        {/* Registry info */}
                        <div>
                          <div className="detail-group-label">Registry data</div>
                          <div style={{fontSize:13,color:"var(--ink-mid)"}}>{lead.licenseNo}</div>
                          <div style={{marginTop:6,fontSize:12,color:"var(--ink-light)",fontFamily:"var(--mono)"}}>Reg. {lead.regDate}</div>
                          
                          <div style={{marginTop:16}} className="detail-group-label">Contact info</div>
                          <div style={{fontSize:12,color:"var(--ink-mid)",marginTop:4}}>📞 {lead.phone || "No phone listed"}</div>
                          <div style={{fontSize:12,color:"var(--ink-mid)",marginTop:4,wordBreak:"break-all"}}>✉️ {lead.email || "No email listed"}</div>
                          {lead.website && (
                            <div style={{fontSize:12,color:"var(--ink-mid)",marginTop:4,wordBreak:"break-all"}}>
                              🌐 <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" style={{color:"var(--ink)",textDecoration:"underline"}}>{lead.website}</a>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{display:"flex",flexDirection:"column",gap:"8px",alignItems:"stretch"}}>
                          <div className="detail-group-label">Actions</div>
                          <button className="search-btn linkedin" onClick={()=>webSearch(`${lead.name} ${lead.city} ${lead.state} LinkedIn`)} style={{justifyContent:"center"}}>
                            <span style={{fontWeight:700,fontSize:13,marginRight:4}}>in</span> Search LinkedIn
                          </button>
                          <button className="search-btn" onClick={()=>{exportCSV([lead]);}} style={{justifyContent:"center"}}>
                            ↓ Export CSV
                          </button>
                          <button className="search-btn" onClick={()=>{exportToCRM([lead]);}} style={{justifyContent:"center"}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Push to CRM
                          </button>
                        </div>

                        {/* Intent Signals */}
                        <div style={{borderLeft:"1px solid var(--border)",paddingLeft:"24px"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                            <div className="detail-group-label" style={{margin:0}}>Intent Signals</div>
                            {lead.intent_score > 0 && (
                              <span style={{fontSize:10,fontWeight:600,padding:"2px 6px",borderRadius:4,background:lead.intent_score>=80?"rgba(255,107,107,0.1)":"rgba(255,192,74,0.1)",color:lead.intent_score>=80?"#ff6b6b":"#f5a623"}}>
                                {lead.intent_score >= 80 ? "🔥 High Intent" : "⚡ Active"} ({lead.intent_score})
                              </span>
                            )}
                          </div>
                          
                          {signalsLoading[lead.id] ? (
                            <div style={{display:"flex",flexDirection:"column",gap:8}}>
                              <div className="skeleton-box" style={{height:14,width:"80%",borderRadius:3}}/>
                              <div className="skeleton-box" style={{height:12,width:"90%",borderRadius:3}}/>
                              <div className="skeleton-box" style={{height:12,width:"60%",borderRadius:3}}/>
                            </div>
                          ) : !signals[lead.id] || signals[lead.id].length === 0 ? (
                            <div style={{fontSize:12,color:"var(--ink-light)",fontStyle:"italic"}}>
                              No active signals found.
                              <div style={{marginTop:8}}>
                                <button className="search-btn" onClick={() => fetchSignals(lead.id, true)} style={{padding:"4px 8px",fontSize:11}}>
                                  🔎 Query Live Signals
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:"200px",overflowY:"auto",paddingRight:4}}>
                              {signals[lead.id].map(s => {
                                const emoji = s.signal_type === "hiring" ? "💼" : s.signal_type === "social" ? "💬" : "📰";
                                return (
                                  <div key={s.id} style={{fontSize:12,borderBottom:"1px solid var(--border)",paddingBottom:8}}>
                                    <div style={{display:"flex",alignItems:"flex-start",gap:6,fontWeight:600,color:"var(--ink)"}}>
                                      <span style={{flexShrink:0}}>{emoji}</span>
                                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{color:"var(--ink)",textDecoration:"none",lineHeight:1.3}} className="signal-link" title={s.title}>
                                        {s.title.length > 60 ? s.title.slice(0, 60) + "..." : s.title}
                                      </a>
                                    </div>
                                    <div style={{display:"flex",justifyContent:"space-between",color:"var(--ink-light)",fontSize:10,marginTop:4}}>
                                      <span>Source: {s.source}</span>
                                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                              <button className="search-btn" onClick={() => fetchSignals(lead.id, true)} style={{padding:"4px 8px",fontSize:11,alignSelf:"flex-start",marginTop:4}}>
                                🔄 Refresh Signals
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {results.length > 0 && results.length < totalLeads && (
                  <div style={{ textAlign: "center", padding: "24px 0", marginTop: "16px" }}>
                    <button className="btn-export-bulk" onClick={() => runSearch(true)} disabled={loading} style={{width: "100%", justifyContent: "center", padding: "12px", border: "1px solid var(--border)"}}>
                      {loading ? "Loading..." : `Load more leads (${totalLeads - results.length} remaining)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {toast && <Toast msg={toast} onHide={()=>setToast(null)}/>}
    </div>
  );
}

// ─── SIGNALS PAGE ────────────────────────────────────────────────────────────
function SignalsPage({ user, setPage }) {
  const [feed, setFeed] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all | hiring | social | news
  const [offset, setOffset] = useState(0);
  const LIMIT = 40;

  const fetchFeed = async (typeFilter, newOffset, replace = true) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("veltrix_token");
      const params = new URLSearchParams({ limit: LIMIT, offset: newOffset });
      if (typeFilter !== "all") params.set("signal_type", typeFilter);
      const res = await fetch(`${apiUrl}/api/signals/feed?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTotal(data.total);
        setFeed(prev => replace ? data.signals : [...prev, ...data.signals]);
        setOffset(newOffset);
      }
    } catch (e) {
      console.error("Feed fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(filterType, 0, true);
  }, [filterType]);

  const typeConfig = {
    all:     { label: "All Signals",    emoji: "⚡", color: "var(--ink)" },
    hiring:  { label: "Hiring",         emoji: "💼", color: "#2a7a3b" },
    social:  { label: "Social",         emoji: "💬", color: "#1a56a0" },
    news:    { label: "News",           emoji: "📰", color: "#8a4a10" },
  };

  const formatRelative = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--paper)"}}>
      {/* Page header */}
      <div style={{padding:"40px 48px 0",maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:6}}>
          <h1 style={{fontFamily:"var(--serif)",fontSize:28,color:"var(--ink)",fontWeight:700}}>Intent Signals</h1>
          <span style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--ink-light)",letterSpacing:".05em"}}>{total.toLocaleString()} signals tracked</span>
        </div>
        <p style={{fontSize:14,color:"var(--ink-mid)",marginBottom:32,lineHeight:1.6}}>
          Live feed of hiring activity, social mentions, and news coverage detected across all your leads.
          Expand any lead in <button onClick={()=>setPage("search")} style={{color:"var(--accent)",textDecoration:"underline",background:"none",border:"none",cursor:"pointer",fontSize:14,padding:0}}>Search</button> to trigger a fresh scan for a specific firm.
        </p>

        {/* Type filter tabs */}
        <div style={{display:"flex",gap:8,marginBottom:32,borderBottom:"1px solid var(--rule)",paddingBottom:0}}>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button key={key} onClick={()=>setFilterType(key)} style={{
              padding:"8px 16px",fontSize:13,fontWeight:500,border:"none",background:"none",cursor:"pointer",
              color: filterType===key ? "var(--ink)" : "var(--ink-light)",
              borderBottom: filterType===key ? "2px solid var(--ink)" : "2px solid transparent",
              transition:".15s", marginBottom:"-1px"
            }}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div style={{maxWidth:960,margin:"0 auto",padding:"0 48px 60px"}}>
        {loading && feed.length === 0 ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{border:"1px solid var(--rule)",borderRadius:8,padding:"16px 20px",background:"var(--paper-dark)",display:"flex",gap:16,alignItems:"center"}}>
                <div className="skeleton-box" style={{width:36,height:36,borderRadius:6,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div className="skeleton-box" style={{height:14,width:"60%",marginBottom:8}}/>
                  <div className="skeleton-box" style={{height:12,width:"85%"}}/>
                </div>
                <div className="skeleton-box" style={{width:60,height:20,borderRadius:4}}/>
              </div>
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{fontSize:40,marginBottom:16}}>📭</div>
            <div style={{fontSize:18,fontFamily:"var(--serif)",color:"var(--ink)",marginBottom:8}}>No signals yet</div>
            <div style={{fontSize:14,color:"var(--ink-light)",lineHeight:1.6,maxWidth:380,margin:"0 auto"}}>
              Signals are collected when you expand a lead card in Search. Expand a few leads to start building your intent feed.
            </div>
            <button onClick={()=>setPage("search")} style={{marginTop:24,padding:"10px 24px",background:"var(--ink)",color:"var(--paper)",border:"none",borderRadius:6,fontSize:14,fontWeight:500,cursor:"pointer"}}>
              Go to Search →
            </button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {feed.map(sig => {
              const scoreColor = sig.lead_intent_score >= 80 ? "#ff6b6b" : sig.lead_intent_score >= 50 ? "#f5a623" : "var(--ink-light)";
              const typeBg = sig.signal_type==="hiring" ? "rgba(42,122,59,0.08)" : sig.signal_type==="social" ? "rgba(26,86,160,0.08)" : "rgba(138,74,16,0.08)";
              const typeColor = sig.signal_type==="hiring" ? "#2a7a3b" : sig.signal_type==="social" ? "#1a56a0" : "#8a4a10";
              const typeEmoji = sig.signal_type==="hiring" ? "💼" : sig.signal_type==="social" ? "💬" : "📰";

              return (
                <div key={sig.id} style={{border:"1px solid var(--rule)",borderRadius:8,padding:"14px 20px",background:"var(--paper)",display:"flex",gap:16,alignItems:"flex-start",transition:".15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--paper-dark)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--paper)"}
                >
                  {/* Type icon */}
                  <div style={{width:36,height:36,borderRadius:6,background:typeBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    {typeEmoji}
                  </div>

                  {/* Content */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--ink)",whiteSpace:"nowrap"}}>{sig.lead_name}</span>
                      <span style={{fontSize:10,color:"var(--ink-light)",fontFamily:"var(--mono)"}}>{sig.lead_city}{sig.lead_city&&sig.lead_state?", ":""}{sig.lead_state}</span>
                      <span style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:"var(--paper-dark)",color:"var(--ink-mid)",border:"1px solid var(--rule)"}}>{sig.lead_type}</span>
                      {sig.lead_intent_score >= 50 && (
                        <span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:3,background: sig.lead_intent_score>=80?"rgba(255,107,107,0.1)":"rgba(245,166,35,0.1)",color:scoreColor}}>
                          {sig.lead_intent_score >= 80 ? "🔥" : "⚡"} {sig.lead_intent_score}
                        </span>
                      )}
                    </div>
                    <a href={sig.url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"var(--ink)",textDecoration:"none",lineHeight:1.4,display:"block"}}
                      onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                      onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}
                    >
                      {sig.title}
                    </a>
                    <div style={{marginTop:4,fontSize:11,color:"var(--ink-light)",display:"flex",gap:12}}>
                      <span style={{background:typeBg,color:typeColor,padding:"1px 6px",borderRadius:3,fontWeight:500}}>{typeEmoji} {sig.signal_type}</span>
                      <span>via {sig.source}</span>
                      <span>{formatRelative(sig.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {feed.length < total && (
              <button onClick={()=>fetchFeed(filterType, offset+LIMIT, false)} disabled={loading}
                style={{marginTop:8,padding:"12px",width:"100%",border:"1px solid var(--rule)",borderRadius:8,background:"var(--paper-dark)",color:"var(--ink-mid)",fontSize:13,cursor:"pointer",transition:".15s"}}
                onMouseEnter={e=>e.currentTarget.style.color="var(--ink)"}
                onMouseLeave={e=>e.currentTarget.style.color="var(--ink-mid)"}
              >
                {loading ? "Loading..." : `Load more · ${total - feed.length} remaining`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CRM EXPORT PAGE ──────────────────────────────────────────────────────────
function CRMPage({ leads }) {
  const [connected, setConnected] = useState({});
  const [toast, setToast] = useState(null);

  const toggle = (crm) => {
    setConnected(c => ({...c, [crm]: !c[crm]}));
    setToast(connected[crm] ? `${crm} disconnected` : `${crm} connected successfully`);
  };

  const exportAll = (crm) => {
    setToast(`${leads.length} leads pushed to ${crm}`);
  };

  const crms = [
    { name:"HubSpot", icon:"🟠", desc:"Sync leads as Companies. Contact properties map to HubSpot's standard fields. Requires a HubSpot API key from your account settings." },
    { name:"Pipedrive", icon:"🟢", desc:"Push firms as Organizations with associated People records. Uses Pipedrive's REST API v1. Connect via your Pipedrive API token." },
    { name:"Salesforce", icon:"☁️", desc:"Import as Accounts in your Salesforce org. Uses the Salesforce REST API with OAuth 2.0. Requires Salesforce Connected App credentials." },
  ];

  return (
    <div className="crm-wrap fade-up">
      <div className="crm-title">CRM Export</div>
      <div className="crm-sub">Connect your CRM to push leads directly, or download a CSV to import manually. All exports are logged in your team's activity feed.</div>

      <div className="section-title" style={{marginBottom:16}}>Connect a CRM</div>
      <div className="crm-grid">
        {crms.map(({name,icon,desc})=>(
          <div className="crm-card" key={name}>
            <div className="crm-card-header">
              <div className="crm-logo">{icon}</div>
              <div>
                <div className="crm-name">{name}</div>
                <div style={{fontSize:11,fontFamily:"var(--mono)",color:connected[name]?"var(--accent)":"var(--ink-ghost)"}}>
                  {connected[name]?"● Connected":"○ Not connected"}
                </div>
              </div>
            </div>
            <div className="crm-desc">{desc}</div>
            <div style={{display:"flex",gap:8}}>
              <button className={`crm-connect ${connected[name]?"connected":""}`} onClick={()=>toggle(name)}>
                {connected[name] ? "✓ Connected — disconnect" : `Connect ${name}`}
              </button>
              {connected[name] && (
                <button onClick={()=>exportAll(name)} style={{padding:"9px 14px",border:"1px solid var(--rule)",borderRadius:"var(--r)",fontSize:13,color:"var(--ink-mid)",transition:".2s",background:"transparent"}}
                  onMouseOver={e=>e.currentTarget.style.background="var(--paper-mid)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  Push all ↑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="crm-export-section">
        <div className="crm-export-title">Manual export</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button className="crm-csv-btn" onClick={()=>{
            const h="Name,Type,State,City,Phone,Email,Website,LinkedIn,License,Registered\n";
            const rows=leads.map(l=>`"${l.name}","${l.type}","${l.state}","${l.city}","${l.phone||""}","${l.email||""}","${l.website||""}","${l.linkedin||""}","${l.licenseNo}","${l.regDate}"`).join("\n");
            const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([h+rows],{type:"text/csv"}));a.download="all-leads.csv";a.click();
            setToast("All leads exported as CSV");
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download all leads · CSV
          </button>
          <div style={{fontSize:13,color:"var(--ink-light)",display:"flex",alignItems:"center",fontFamily:"var(--mono)"}}>
            {leads.length} leads ready
          </div>
        </div>
        <div style={{marginTop:24,padding:"16px",background:"var(--paper-dark)",border:"1px solid var(--rule)",borderRadius:"var(--r)",fontSize:13,color:"var(--ink-light)",lineHeight:1.7}}>
          <strong style={{color:"var(--ink)"}}>Field mapping note —</strong> exported files include: firm name, type (Civil/Structural/MEP), state, city, phone, email, website, LinkedIn URL, license number, and registration date. CRM field mapping is configured per integration after connecting.
        </div>
      </div>

      {toast && <Toast msg={toast} onHide={()=>setToast(null)}/>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  
  const [crmUrl, setCrmUrl] = useState(() => localStorage.getItem("crmUrl") || "");
  const [crmToken, setCrmToken] = useState(() => localStorage.getItem("crmToken") || "");
  const [theme, setTheme] = useState(() => localStorage.getItem("veltrix_theme") || "light");
  const [accent, setAccent] = useState(() => localStorage.getItem("veltrix_accent") || "#2c4a2e");
  const [settingsTab, setSettingsTab] = useState("crm");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    document.documentElement.style.setProperty('--accent', accent);
    localStorage.setItem("veltrix_theme", theme);
    localStorage.setItem("veltrix_accent", accent);
  }, [theme, accent]);

  // Digital Wellbeing Tracker
  useEffect(() => {
    const timer = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const stats = JSON.parse(localStorage.getItem("veltrix_wellbeing") || "{}");
      if (!stats[today]) stats[today] = 0;
      stats[today] += 1;
      localStorage.setItem("veltrix_wellbeing", JSON.stringify(stats));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [screen, setScreen] = useState(() => {
    const savedUser = localStorage.getItem("veltrix_user");
    const savedTeam = localStorage.getItem("veltrix_team");
    if (savedUser && savedTeam) return "app";
    if (savedUser) return "onboarding";
    return "auth";
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("veltrix_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState([]);

  const handleAuth = (u) => {
    setUser(u);
    localStorage.setItem("veltrix_user", JSON.stringify(u));
    if (localStorage.getItem("veltrix_team")) {
      setScreen("app");
    } else {
      setScreen("onboarding");
    }
  };

  const handleLogout = () => {
    setScreen("auth");
    setUser(null);
    setPage("dashboard");
    localStorage.removeItem("veltrix_user");
    localStorage.removeItem("veltrix_token");
    // We purposefully do not remove veltrix_team so the team persists for the user
  };

  // Wellbeing stats getter
  const getWellbeingStats = () => {
    const stats = JSON.parse(localStorage.getItem("veltrix_wellbeing") || "{}");
    const today = new Date().toISOString().split('T')[0];
    const todaySeconds = stats[today] || 0;
    
    // Quick estimation for week/month just by summing existing keys
    const totalSeconds = Object.values(stats).reduce((a, b) => a + b, 0);
    
    const format = (sec) => {
      if (sec < 60) return `${sec} sec`;
      const m = Math.floor(sec / 60);
      const h = Math.floor(m / 60);
      if (h > 0) return `${h}h ${m%60}m`;
      return `${m} min`;
    };
    
    return { today: format(todaySeconds), total: format(totalSeconds) };
  };
  const wbStats = getWellbeingStats();

  if (screen==="auth") return <AuthScreen onAuth={handleAuth}/>;
  if (screen==="onboarding") return <OnboardingScreen user={user} onDone={()=>setScreen("app")}/>;

  return (
    <div>
      <style>{css}</style>
      <Nav page={page} setPage={setPage} user={user} onLogout={handleLogout} onSettingsClick={()=>setShowSettings(true)} onTeamClick={()=>setShowTeamModal(true)}/>
      {page==="dashboard" && <Dashboard user={user} setPage={setPage}/>}
      {page==="search"    && <SearchPage user={user} results={leads} setResults={setLeads} setShowSettings={setShowSettings}/>}
      {page==="signals"   && <SignalsPage user={user} setPage={setPage}/>}

      {showSettings && (
        <div className="modal-overlay" style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
          <div className="modal fade-up" style={{background:"var(--paper)",width:600,borderRadius:8,boxShadow:"0 12px 40px rgba(0,0,0,0.2)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"24px 32px",borderBottom:"1px solid var(--rule)"}}>
              <h2 style={{fontFamily:"var(--serif)",fontSize:20,color:"var(--ink)"}}>Settings</h2>
            </div>
            
            <div style={{display:"flex",flex:1}}>
              <div style={{width:160,borderRight:"1px solid var(--rule)",display:"flex",flexDirection:"column",padding:"16px 0",background:"var(--paper)"}}>
                {["crm", "appearance", "wellbeing"].map(tab => (
                  <button key={tab} style={{padding:"12px 24px",textAlign:"left",fontSize:13,textTransform:tab==="crm"?"none":"capitalize",fontWeight:500,color:settingsTab===tab?"var(--ink)":"var(--ink-light)",background:settingsTab===tab?"var(--paper-dark)":"transparent",borderLeft:settingsTab===tab?"3px solid var(--ink)":"3px solid transparent",transition:"all 0.2s"}} onClick={()=>setSettingsTab(tab)}>{tab==="crm"?"CRM":tab}</button>
                ))}
              </div>
            
              <div style={{padding:32,display:"flex",flexDirection:"column",gap:24,flex:1,background:"var(--paper)"}}>
                {settingsTab === "crm" && (
                  <>
                    <div>
                      <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:8,letterSpacing:0.5}}>CRM Webhook / API URL</label>
                      <input style={{width:"100%",padding:"10px 12px",background:"var(--paper-dark)",border:"1px solid var(--rule)",borderRadius:4,fontSize:14,color:"var(--ink)"}} placeholder="https://api.hubapi.com/v1/..." value={crmUrl} onChange={e=>setCrmUrl(e.target.value)}/>
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:8,letterSpacing:0.5}}>API Key / Bearer Token</label>
                      <input type="password" style={{width:"100%",padding:"10px 12px",background:"var(--paper-dark)",border:"1px solid var(--rule)",borderRadius:4,fontSize:14,color:"var(--ink)"}} placeholder="sk-..." value={crmToken} onChange={e=>setCrmToken(e.target.value)}/>
                    </div>
                  </>
                )}
                {settingsTab === "appearance" && (
                  <>
                    <div>
                      <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:12,letterSpacing:0.5}}>Color Theme</label>
                      <div style={{display:"flex",gap:12}}>
                        <button style={{padding:"10px 20px",borderRadius:4,border:theme==="light"?"2px solid var(--ink)":"1px solid var(--rule)",background:"#f9f8f6",color:"#1a1918",fontSize:14}} onClick={()=>setTheme("light")}>Light</button>
                        <button style={{padding:"10px 20px",borderRadius:4,border:theme==="dark"?"2px solid var(--ink)":"1px solid var(--rule)",background:"#1a1918",color:"#f9f8f6",fontSize:14}} onClick={()=>setTheme("dark")}>Dark</button>
                      </div>
                    </div>
                    <div style={{marginTop: 8}}>
                      <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:12,letterSpacing:0.5}}>Accent Color</label>
                      <div style={{display:"flex",gap:12}}>
                        {["#2c4a2e", "#2c3a4a", "#7a4a2c", "#4a2c4a", "#7a2c2c"].map(c => (
                          <button key={c} style={{width:32,height:32,borderRadius:"50%",background:c,border:accent===c?"2px solid var(--ink)":"2px solid transparent",cursor:"pointer",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"}} onClick={()=>setAccent(c)} title={c} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {settingsTab === "wellbeing" && (
                  <>
                    <div>
                      <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:8,letterSpacing:0.5}}>Digital Wellbeing</label>
                      <div style={{background:"var(--paper-dark)",padding:20,borderRadius:8,border:"1px solid var(--rule)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                          <span style={{fontSize:14,color:"var(--ink-mid)"}}>Today's Time:</span>
                          <strong style={{fontSize:15,color:"var(--ink)"}}>{wbStats.today}</strong>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontSize:14,color:"var(--ink-mid)"}}>Total Logged:</span>
                          <strong style={{fontSize:15,color:"var(--ink)"}}>{wbStats.total}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div style={{padding:"20px 32px",borderTop:"1px solid var(--rule)",display:"flex",justifyContent:"flex-end",background:"var(--paper-dark)"}}>
              <button style={{padding:"10px 20px",background:"var(--ink)",color:"var(--paper)",borderRadius:4,fontSize:14,fontWeight:500}} onClick={()=>{
                localStorage.setItem("crmUrl", crmUrl);
                localStorage.setItem("crmToken", crmToken);
                setShowSettings(false);
              }}>Save & Close</button>
            </div>
          </div>
        </div>
      )}
      
      {showTeamModal && <TeamModal onClose={()=>setShowTeamModal(false)} />}
    </div>
  );
}

function TeamModal({ onClose }) {
  const [teamData, setTeamData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("veltrix_token");
    fetch(`${apiUrl}/api/teams/me`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(async res => {
        if (res.status === 401) {
          localStorage.clear();
          window.location.reload();
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => setTeamData(data))
      .catch(err => {
        console.error(err);
        setError("Failed to load team data. Please try again later.");
      });
  }, []);

  return (
    <div className="modal-overlay" style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div className="modal fade-up" style={{background:"var(--paper)",width:480,borderRadius:8,boxShadow:"0 12px 40px rgba(0,0,0,0.2)",overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:"90vh"}}>
        <div style={{padding:"24px 32px",borderBottom:"1px solid var(--rule)"}}>
          <h2 style={{fontFamily:"var(--serif)",fontSize:20,color:"var(--ink)"}}>Team & Usage Reports</h2>
        </div>
        
        <div style={{padding:32,display:"flex",flexDirection:"column",gap:24,flex:1,overflowY:"auto"}}>
          {error ? (
            <div style={{fontSize:14,color:"#d32f2f",textAlign:"center",padding:20}}>{error}</div>
          ) : !teamData || !teamData.members ? (
            <div style={{fontSize:14,color:"var(--ink-mid)",textAlign:"center",padding:20}}>Loading team data...</div>
          ) : (
            <>
              <div>
                <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:8,letterSpacing:0.5}}>Team Name</label>
                <div style={{fontSize:16,fontWeight:500,color:"var(--ink)"}}>{teamData.name}</div>
              </div>
              
              <div>
                <label style={{display:"block",fontSize:11,fontFamily:"var(--mono)",textTransform:"uppercase",color:"var(--ink-light)",marginBottom:12,letterSpacing:0.5}}>Members & Activity</label>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {teamData.members.map(m => (
                    <div key={m.id} style={{padding:16,border:"1px solid var(--rule)",borderRadius:6,background:"var(--paper-dark)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:14,fontWeight:500,color:"var(--ink)"}}>{m.name}</div>
                      <div style={{display:"flex",gap:16,fontSize:13,color:"var(--ink-mid)"}}>
                        <span><strong style={{color:"var(--ink)"}}>{m.viewed_count}</strong> Viewed</span>
                        <span><strong style={{color:"var(--ink)"}}>{m.exported_count}</strong> Exported</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div style={{padding:"20px 32px",borderTop:"1px solid var(--rule)",display:"flex",justifyContent:"flex-end",background:"var(--paper-dark)"}}>
          <button style={{padding:"10px 20px",background:"var(--ink)",color:"var(--paper)",borderRadius:4,fontSize:14,fontWeight:500}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
