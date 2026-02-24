import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

async function getUsers() {
  const client = await clerkClient()
  const { data } = await client.users.getUserList({ limit: 50 })
  return data.map((user) => ({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? '—',
    username: user.username ?? '—',
    role: (user.publicMetadata?.role as string) ?? 'none',
    onboarded: !!(user.publicMetadata?.onboardingComplete),
    ageVerified: !!(user.publicMetadata?.ageVerified),
    createdAt: new Date(user.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }),
    imageUrl: user.imageUrl,
  }))
}

export default async function AdminPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as any)?.role

  if (role !== 'admin') redirect('/')

  const users = await getUsers()

  const totalUsers = users.length
  const totalCreators = users.filter((u) => u.role === 'creator').length
  const totalAdmins = users.filter((u) => u.role === 'admin').length
  const totalOnboarded = users.filter((u) => u.onboarded).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adm-root {
          min-height: 100vh;
          background-color: #060d18;
          background-image:
            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,200,255,0.04) 0%, transparent 60%);
          font-family: 'Exo 2', sans-serif;
          color: #c8dff0;
        }

        .adm-topbar {
          height: 56px;
          background: rgba(6,13,24,0.95);
          border-bottom: 1px solid rgba(0,200,255,0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .adm-logo {
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

        .adm-logo-icon { display: flex; gap: 2px; align-items: center; }
        .adm-logo-icon span { display: block; width: 3px; height: 14px; background: #00c8ff; border-radius: 1px; }
        .adm-logo-icon span:nth-child(2) { height: 10px; opacity: 0.7; }
        .adm-logo-icon span:nth-child(3) { height: 16px; }

        .adm-topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #ff6b8a;
        }

        .adm-topbar-right::before {
          content: '';
          width: 6px; height: 6px;
          background: #ff6b8a;
          border-radius: 50%;
          box-shadow: 0 0 6px #ff6b8a;
        }

        .adm-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
        }

        .adm-header {
          margin-bottom: 2.5rem;
        }

        .adm-breadcrumb {
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3a5570;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .adm-breadcrumb span { color: #00c8ff; }

        .adm-page-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #e8f4ff;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .adm-page-title span { color: #00c8ff; }

        .adm-page-subtitle {
          font-size: 0.85rem;
          color: #4a6080;
          margin-top: 0.4rem;
          font-weight: 300;
        }

        /* Stat cards */
        .adm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .adm-stat {
          background: rgba(10,18,35,0.8);
          border: 1px solid rgba(0,200,255,0.12);
          border-radius: 10px;
          padding: 1.25rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .adm-stat::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00c8ff, #7b4fff);
          opacity: 0.5;
        }

        .adm-stat-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3a5570;
          margin-bottom: 0.5rem;
        }

        .adm-stat-value {
          font-family: 'Rajdhani', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: #e8f4ff;
          line-height: 1;
        }

        .adm-stat-value span {
          font-size: 0.85rem;
          color: #3a5570;
          font-weight: 400;
          margin-left: 4px;
        }

        /* Table card */
        .adm-table-card {
          background: rgba(10,18,35,0.8);
          border: 1px solid rgba(0,200,255,0.12);
          border-radius: 12px;
          overflow: hidden;
        }

        .adm-table-header {
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid rgba(0,200,255,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .adm-table-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c8dff0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .adm-table-title::before {
          content: '';
          width: 3px; height: 14px;
          background: linear-gradient(180deg, #00c8ff, #7b4fff);
          border-radius: 2px;
        }

        .adm-count-badge {
          background: rgba(0,200,255,0.08);
          border: 1px solid rgba(0,200,255,0.15);
          border-radius: 999px;
          padding: 2px 10px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #00c8ff;
        }

        .adm-table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead tr {
          border-bottom: 1px solid rgba(0,200,255,0.08);
        }

        th {
          padding: 0.875rem 1.75rem;
          text-align: left;
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3a5570;
          white-space: nowrap;
        }

        tbody tr {
          border-bottom: 1px solid rgba(0,200,255,0.05);
          transition: background 0.15s;
        }

        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(0,200,255,0.02); }

        td {
          padding: 1rem 1.75rem;
          font-size: 0.875rem;
          color: #c8dff0;
          white-space: nowrap;
        }

        .adm-user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .adm-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(0,200,255,0.15);
          object-fit: cover;
          background: rgba(0,200,255,0.05);
          flex-shrink: 0;
        }

        .adm-avatar-fallback {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(0,200,255,0.15);
          background: rgba(0,200,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Rajdhani', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #00c8ff;
          flex-shrink: 0;
        }

        .adm-username {
          font-weight: 500;
          color: #e8f4ff;
        }

        .adm-email {
          font-size: 0.78rem;
          color: #4a6080;
        }

        .adm-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 4px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .adm-role-badge--admin {
          background: rgba(255,107,138,0.08);
          border: 1px solid rgba(255,107,138,0.2);
          color: #ff6b8a;
        }

        .adm-role-badge--creator {
          background: rgba(0,200,255,0.07);
          border: 1px solid rgba(0,200,255,0.18);
          color: #00c8ff;
        }

        .adm-role-badge--none {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          color: #3a5570;
        }

        .adm-role-badge::before {
          content: '';
          width: 4px; height: 4px;
          border-radius: 50%;
          background: currentColor;
        }

        .adm-status-dot {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: #4a6080;
        }

        .adm-status-dot--yes {
          color: #00c8ff;
        }

        .adm-status-dot::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        .adm-date {
          color: #3a5570;
          font-size: 0.8rem;
        }

        .adm-id {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.75rem;
          color: #2a3f55;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .adm-stats { grid-template-columns: repeat(2, 1fr); }
          .adm-body { padding: 1.5rem 1rem; }
        }
      `}</style>

      <div className="adm-root">
        <div className="adm-topbar">
          <a href="/" className="adm-logo">
            <div className="adm-logo-icon">
              <span /><span /><span />
            </div>
            NX8UP
          </a>
          <div className="adm-topbar-right">
            Admin Access
          </div>
        </div>

        <div className="adm-body">
          <div className="adm-header">
            <div className="adm-breadcrumb">
              Admin <span>/ User Management</span>
            </div>
            <h1 className="adm-page-title">User <span>Management</span></h1>
            <p className="adm-page-subtitle">View and manage all registered platform users and their roles.</p>
          </div>

          {/* Stats */}
          <div className="adm-stats">
            <div className="adm-stat">
              <div className="adm-stat-label">Total Users</div>
              <div className="adm-stat-value">{totalUsers}</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-label">Creators</div>
              <div className="adm-stat-value">{totalCreators}</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-label">Admins</div>
              <div className="adm-stat-value">{totalAdmins}</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-label">Onboarded</div>
              <div className="adm-stat-value">
                {totalOnboarded}
                <span>/ {totalUsers}</span>
              </div>
            </div>
          </div>

          {/* User table */}
          <div className="adm-table-card">
            <div className="adm-table-header">
              <div className="adm-table-title">All Users</div>
              <div className="adm-count-badge">{totalUsers} total</div>
            </div>
            <div className="adm-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Onboarded</th>
                    <th>Age Verified</th>
                    <th>Joined</th>
                    <th>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="adm-user-cell">
                          {user.imageUrl ? (
                            <img className="adm-avatar" src={user.imageUrl} alt={user.username} />
                          ) : (
                            <div className="adm-avatar-fallback">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="adm-username">{user.username}</div>
                            <div className="adm-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.username}</td>
                      <td>
                        <span className={`adm-role-badge adm-role-badge--${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-status-dot ${user.onboarded ? 'adm-status-dot--yes' : ''}`}>
                          {user.onboarded ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-status-dot ${user.ageVerified ? 'adm-status-dot--yes' : ''}`}>
                          {user.ageVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="adm-date">{user.createdAt}</td>
                      <td className="adm-id">{user.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}