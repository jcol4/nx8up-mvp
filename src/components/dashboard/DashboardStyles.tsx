export default function DashboardStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap');

      .dash-root {
        min-height: 100vh;
        background-color: #060d18;
        background-image: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,200,255,0.04) 0%, transparent 60%);
        font-family: 'Exo 2', sans-serif;
        color: #c8dff0;
      }

      .dash-root::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
      }

      .dash-topbar {
        height: 56px;
        background: rgba(6,13,24,0.95);
        border-bottom: 1px solid rgba(0,200,255,0.12);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem 0 2rem;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .dash-logo {
        font-family: 'Rajdhani', sans-serif;
        font-size: 1.3rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.15em;
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
      }

      .dash-logo-icon { display: flex; gap: 2px; align-items: center; }
      .dash-logo-icon span { display: block; width: 3px; height: 14px; background: #00c8ff; border-radius: 1px; }
      .dash-logo-icon span:nth-child(2) { height: 10px; opacity: 0.7; }
      .dash-logo-icon span:nth-child(3) { height: 16px; }

      .dash-panel {
        background: rgba(10,18,35,0.8);
        border: 1px solid rgba(0,200,255,0.12);
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .dash-panel::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #00c8ff, #7b4fff);
        opacity: 0.5;
      }

      .dash-panel-title {
        font-family: 'Rajdhani', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #c8dff0;
      }

      .dash-stat {
        background: rgba(10,18,35,0.8);
        border: 1px solid rgba(0,200,255,0.12);
        border-radius: 10px;
        padding: 1.25rem 1.5rem;
        position: relative;
        overflow: hidden;
      }

      .dash-stat::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #00c8ff, #7b4fff);
        opacity: 0.5;
      }

      .dash-stat-label {
        font-family: 'Rajdhani', sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #3a5570;
        margin-bottom: 0.5rem;
      }

      .dash-stat-value {
        font-family: 'Rajdhani', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #e8f4ff;
        line-height: 1.2;
      }

      .dash-nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #4a6080;
        text-decoration: none;
        transition: color 0.2s, background 0.2s;
      }

      .dash-nav-item:hover {
        color: #c8dff0;
        background: rgba(0,200,255,0.05);
      }

      .dash-nav-item--active {
        color: #00c8ff;
        background: rgba(0,200,255,0.08);
      }

      .dash-nav-icon { width: 18px; height: 18px; opacity: 0.8; }

      .dash-avatar {
        border: 1px solid rgba(0,200,255,0.15);
        background: rgba(0,200,255,0.05);
      }

      .dash-avatar-fallback {
        font-family: 'Rajdhani', sans-serif;
        font-weight: 600;
        color: #00c8ff;
      }

      .dash-text-muted { color: #4a6080; }
      .dash-text { color: #c8dff0; }
      .dash-text-bright { color: #e8f4ff; }
      .dash-accent { color: #00c8ff; }
      .dash-purple { color: #7b4fff; }
      .dash-success { color: #22c55e; }
      .dash-border { border-color: rgba(0,200,255,0.12); }
      .dash-bg-inner { background: rgba(0,0,0,0.2); }

      .dash-card-image {
        transition: border-color 0.2s;
      }

      .dash-card-image:hover {
        border-color: rgba(0,200,255,0.25);
      }

      .dash-insight-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}</style>
  )
}
