import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Dashboard | Nx8up",
  description: "Creator dashboard",
};

export default function CreatorLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap');

        .cr-root {
          min-height: 100vh;
          background-color: #060d18;
          background-image:
            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,200,255,0.04) 0%, transparent 60%);
          font-family: 'Exo 2', sans-serif;
          color: #c8dff0;
        }

        .cr-root::before {
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

        .cr-topbar {
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
          overflow: visible;
        }

        .cr-logo {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.15em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cr-logo-icon { display: flex; gap: 2px; align-items: center; }
        .cr-logo-icon span { display: block; width: 3px; height: 14px; background: #00c8ff; border-radius: 1px; }
        .cr-logo-icon span:nth-child(2) { height: 10px; opacity: 0.7; }
        .cr-logo-icon span:nth-child(3) { height: 16px; }

        .cr-panel {
          background: rgba(10,18,35,0.8);
          border: 1px solid rgba(0,200,255,0.12);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .cr-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00c8ff, #7b4fff);
          opacity: 0.5;
        }

        .cr-panel-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c8dff0;
          margin-bottom: 1rem;
        }

        .cr-text-muted { color: #4a6080; }
        .cr-text { color: #c8dff0; }
        .cr-text-bright { color: #e8f4ff; }
        .cr-accent { color: #00c8ff; }
        .cr-purple { color: #7b4fff; }
        .cr-success { color: #22c55e; }
        .cr-border { border-color: rgba(0,200,255,0.12); }
        .cr-bg-inner { background: rgba(0,0,0,0.2); }
      `}</style>
      <div className="cr-root">
        <div className="relative z-10">{children}</div>
      </div>
    </>
  );
}
