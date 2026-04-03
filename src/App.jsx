import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Home, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import { db } from './services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';

function App() {
  const { currentUser } = useAuth();
  const [geoPrompt, setGeoPrompt] = useState(false);

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
          <h1 className="app-title">Hybrid Tracker</h1>
          <div className="user-avatar" title={currentUser.email}>{initial}</div>
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

        <nav className="bottom-nav">
          <ul className="nav-list">
            <li>
              <Link to="/" className="nav-item">
                <Home size={24} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link to="/settings" className="nav-item">
                <SettingsIcon size={24} />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </Router>
  );
}

export default App;
