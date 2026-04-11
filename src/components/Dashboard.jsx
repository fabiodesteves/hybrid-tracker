import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { isSameQuarter, isSameMonth, parseISO } from 'date-fns';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [targetPercentage, setTargetPercentage] = useState(50);
  const [countBy, setCountBy] = useState('quarter');
  const [stats, setStats] = useState({ office: 0, home: 0, total: 0 });

  // Load Settings
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.targetPercentage) setTargetPercentage(data.targetPercentage);
        if (data.countBy) setCountBy(data.countBy);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Calculate Stats based on input days
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = onSnapshot(collection(db, `users/${currentUser.uid}/logs`), (snapshot) => {
      let officeTemp = 0;
      let homeTemp = 0;
      const today = new Date();

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const dateStr = docSnap.id;
        const dateObj = parseISO(dateStr);
        
        // Filter based on countBy setting (quarter or month)
        const isInPeriod = countBy === 'month'
          ? isSameMonth(dateObj, today)
          : isSameQuarter(dateObj, today);
        
        if (isInPeriod) {
          if (data.type === 'office') officeTemp++;
          if (data.type === 'home') homeTemp++;
          // 'holiday' is ignored as it doesn't count towards working pool
        }
      });

      setStats({
        office: officeTemp,
        home: homeTemp,
        total: officeTemp + homeTemp
      });
    });

    return () => unsubscribe();
  }, [currentUser, countBy]);

  const currentPercent = stats.total > 0 ? (stats.office / stats.total) * 100 : 0;
  
  // Calculate how many more office days needed or allowed
  const targetRatio = targetPercentage / 100;
  
  let suggestion = "";
  if (stats.total === 0) {
    suggestion = "Start logging days in the calendar!";
  } else if (currentPercent >= targetPercentage) {
    suggestion = `Great job! You are ${Math.round(currentPercent - targetPercentage)}% above your target.`;
  } else {
    // Math to find how many contiguous office days needed to hit target
    // (office + X) / (total + X) = targetRatio
    // office + X = targetRatio * total + targetRatio * X
    // X * (1 - targetRatio) = targetRatio * total - office
    // X = (targetRatio * total - office) / (1 - targetRatio)
    if (targetRatio < 1) {
      const daysNeeded = Math.ceil((targetRatio * stats.total - stats.office) / (1 - targetRatio));
      suggestion = `You need ${daysNeeded} more consecutive office days to reach ${targetPercentage}%.`;
    }
  }

  // Generate period title
  const today = new Date();
  const periodTitle = countBy === 'month'
    ? today.toLocaleString('default', { month: 'long', year: 'numeric' })
    : `Q${Math.ceil((today.getMonth() + 1) / 3)} Dashboard`;

  return (
    <div className="glass-panel section-panel">
      <h2 className="section-title">{periodTitle}</h2>
      
      <div className="stats-grid" style={{marginBottom: '1.5rem'}}>
        <div className="stat-card">
          <p className="stat-label">Office</p>
          <p className="stat-value primary-text">{stats.office}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Target</p>
          <p className="stat-value">{targetPercentage}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Current</p>
          <p className={"stat-value " + (currentPercent >= targetPercentage ? 'success-text' : 'warning-text')}>
            {Math.round(currentPercent)}%
          </p>
        </div>
      </div>

      <div style={{backgroundColor: 'var(--bg-card-solid)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color-solid)', minHeight: '60px', display: 'flex', alignItems: 'center'}}>
        <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, width: '100%'}}>
          Total working days logged: {stats.total} (Holidays/PTO are excluded)
        </p>
      </div>
    </div>
  );
}
