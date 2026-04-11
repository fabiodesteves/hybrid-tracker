import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Settings as SettingsIcon, LogOut, Eraser } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import { db } from './services/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';

function App() {
  const { currentUser, logout } = useAuth();
  const [geoPrompt, setGeoPrompt] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Optional: Location Background Prompt logic here 
    async function checkLocation() {
      if (!navigator.geolocation) return;
      
      const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (!docSnap.exists() || !docSnap.data().officeLocation) return;
      
      const officeAddress = docSnap.data().officeLocation;
      
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Very basic mock distance check (in reality, use Haversine formula)
        const latDiff = Math.abs(latitude - officeAddress.lat);
        const lngDiff = Math.abs(longitude - officeAddress.lng);
        
        // If within ~500 meters roughly
        if (latDiff < 0.005 && lngDiff < 0.005) {
          // check if already logged today
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const logSnap = await getDoc(doc(db, `users/${currentUser.uid}/logs`, todayStr));
          if (!logSnap.exists() || logSnap.data().type !== 'office') {
            setGeoPrompt(todayStr); // store the date
          }
        }
      }, () => {
        // Location denied or error
      });
    }

    checkLocation();
  }, [currentUser]);

  async function handleLogLocation() {
    if (!geoPrompt) return;
    try {
      await setDoc(doc(db, `users/${currentUser.uid}/logs`, geoPrompt), { type: 'office' });
      setGeoPrompt(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleClearFuture() {
    setShowMenu(false);
    if (!window.confirm("Are you sure you want to clear all future logging data?")) return;

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const logsRef = collection(db, `users/${currentUser.uid}/logs`);
      const q = query(logsRef, where('__name__', '>', todayStr));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert("No future logging data to clear.");
        return;
      }

      // Firestore batches can hold up to 500 writes
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      
      alert("Future data successfully cleared!");
    } catch (e) {
      console.error("Error clearing data", e);
      alert("Failed to clear data.");
    }
  }

  if (!currentUser) {
    return <Auth />;
  }

  const initial = currentUser.displayName 
    ? currentUser.displayName.charAt(0).toUpperCase() 
    : currentUser.email.charAt(0).toUpperCase();

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="app-title" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/hybrid-tracker-icon.png" alt="Hybrid Tracker" style={{ height: '36px', width: 'auto', borderRadius: '10px' }} />
            Hybrid Tracker
          </Link>
          <div className="avatar-container" ref={menuRef}>
            <div 
              className="user-avatar" 
              title={currentUser.email}
              onClick={() => setShowMenu(!showMenu)}
              style={{ cursor: 'pointer' }}
            >
              {initial}
            </div>
            
            {showMenu && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={handleClearFuture}>
                  <Eraser size={16} /> Clear Future Days
                </button>
                <Link to="/settings" className="dropdown-item" onClick={() => setShowMenu(false)} style={{ textDecoration: 'none' }}>
                  <SettingsIcon size={16} /> Settings
                </Link>
                <button className="dropdown-item danger" onClick={() => { setShowMenu(false); logout(); }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {geoPrompt && (
          <div className="glass-panel" style={{padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <strong>At the office?</strong>
              <p style={{fontSize: '0.875rem', margin: 0}}>We noticed you're near the office. Log it?</p>
            </div>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button className="btn btn-outline" onClick={() => setGeoPrompt(false)}>No</button>
              <button className="btn btn-primary" onClick={handleLogLocation}>Yes</button>
            </div>
          </div>
        )}

        <main className="app-main">
          <Routes>
            <Route path="/" element={<><Dashboard /><CalendarView /></>} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>


      </div>
    </Router>
  );
}

export default App;
