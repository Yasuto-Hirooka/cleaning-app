import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import StaffManagement from './components/StaffManagement';
import RoomManagement from './components/RoomManagement';
import FastEntry from './components/FastEntry';
import VendorReport from './components/VendorReport';
import MonthlyReport from './components/MonthlyReport';
import Settings from './components/Settings';
import Home from './components/Home';
import Dashboard from './Dashboard';

function NavContent() {
  const location = useLocation();
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isHomePage = location.pathname === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMasterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="nav">
      {!isHomePage && (
        <div className="nav-group-main">
          <NavLink
            to="/"
            className="nav-link"
          >
            🏠 ホーム
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            📊 ダッシュボード
          </NavLink>
          <NavLink
            to="/entry"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            日報入力
          </NavLink>
          <NavLink
            to="/daily"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            日次集計
          </NavLink>
          <NavLink
            to="/monthly"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            月報集計
          </NavLink>
        </div>
      )}

      <div className="nav-group-admin" ref={dropdownRef}>
        <div className="dropdown">
          <button
            className={`nav-link master-link ${isMasterOpen ? 'active' : ''}`}
            onClick={() => setIsMasterOpen(!isMasterOpen)}
          >
            ⚙️ マスタ管理
          </button>
          {isMasterOpen && (
            <div className="dropdown-menu">
              <NavLink to="/staff" className="dropdown-item" onClick={() => setIsMasterOpen(false)}>
                作業者管理
              </NavLink>
              <NavLink to="/rooms" className="dropdown-item" onClick={() => setIsMasterOpen(false)}>
                部屋管理
              </NavLink>
              <NavLink to="/settings" className="dropdown-item" onClick={() => setIsMasterOpen(false)}>
                データ管理
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MainLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  return (
    <div className={isHomePage ? 'home-page-wrapper' : 'container'}>
      {!isHomePage && (
        <h1 className="title" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
          Smart Housekeeping System
        </h1>
      )}
      {isHomePage ? (
        // On home page: show only the master admin button overlaid on top
        <div className="home-nav-overlay">
          <NavContent />
        </div>
      ) : (
        <NavContent />
      )}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/rooms" element={<RoomManagement />} />
        <Route path="/entry" element={<FastEntry />} />
        <Route path="/daily" element={<VendorReport />} />
        <Route path="/monthly" element={<MonthlyReport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Home />} />
      </Routes>

      {!isHomePage && (
        <footer className="footer">
          operated by ベストクリエイト
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
