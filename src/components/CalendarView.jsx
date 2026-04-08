import React, { useState, useEffect } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
  isSameMonth as isSameMonthFn
} from 'date-fns';
import { ChevronLeft, ChevronRight, Briefcase, Home as HomeIcon, MapPin } from 'lucide-react';
import { fetchPortugalHolidays } from '../services/holidays';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function CalendarView() {
  const { currentUser } = useAuth();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const isCurrentMonth = isSameMonthFn(currentMonth, today);
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [logs, setLogs] = useState({}); // { 'YYYY-MM-DD': { type: 'office' | 'home' | 'holiday' } }

  useEffect(() => {
    async function loadHolidays() {
      const year = currentMonth.getFullYear();
      const holidays = await fetchPortugalHolidays(year);
      setPublicHolidays(holidays);
    }
    loadHolidays();
  }, [currentMonth.getFullYear()]);

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to all logs for the user to make calculation easier.
    // In a huge app, we'd query by month, but here we can pull all or current year.
    const unsubscribe = onSnapshot(collection(db, `users/${currentUser.uid}/logs`), (snapshot) => {
      const newLogs = {};
      snapshot.forEach(doc => {
        newLogs[doc.id] = doc.data();
      });
      setLogs(newLogs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  async function handleDayClick(day) {
    const dateStr = format(day, 'yyyy-MM-dd');
    let currentType = logs[dateStr]?.type;
    let nextType = null;

    if (!currentType) nextType = 'office';
    else if (currentType === 'office') nextType = 'home';
    else if (currentType === 'home') nextType = 'holiday';
    else nextType = null; // reset

    try {
      const docRef = doc(db, `users/${currentUser.uid}/logs`, dateStr);
      if (nextType) {
        await setDoc(docRef, { type: nextType });
      } else {
        // We could delete the document or mark as empty, let's set it to empty type to keep it simple, or use deleteDoc
        await setDoc(docRef, { type: null });
      }
    } catch (e) {
      console.error("Error saving log", e);
    }
  }

  function getDayContent(dateStr, isWeekend) {
    if (logs[dateStr]?.type === 'office') return <span style={{fontSize: '1rem'}}>🏢</span>;
    if (logs[dateStr]?.type === 'home') return <span style={{fontSize: '1rem'}}>🏠</span>;
    if (logs[dateStr]?.type === 'holiday') return <span style={{fontSize: '1rem'}}>🌴</span>;
    if (publicHolidays.includes(dateStr)) return <span style={{fontSize: '1rem'}}>🇵🇹</span>;
    return null;
  }

  return (
    <div className="glass-panel section-panel p-4" style={{padding: '1.5rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h2 className="section-title" style={{margin: 0}}>Calendar</h2>
        <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
          <button
            onClick={() => setCurrentMonth(today)}
            style={{
              padding: '0.2rem 0.75rem',
              borderRadius: '999px',
              border: '1px solid var(--primary)',
              background: 'transparent',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              opacity: isCurrentMonth ? 0 : 1,
              pointerEvents: isCurrentMonth ? 'none' : 'auto',
              transform: isCurrentMonth ? 'scale(0.85)' : 'scale(1)',
            }}
          >
            Today
          </button>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="borderless-btn">
            <ChevronLeft size={20} />
          </button>
          <span style={{fontWeight: 600, minWidth: '100px', textAlign: 'center'}}>
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="borderless-btn">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)'}}>
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem'}}>
          {daysInMonth.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const currentObjType = logs[dateStr]?.type;
            
            let bgClass = 'var(--bg-card-solid)';
            if (currentObjType === 'office') bgClass = 'rgba(59, 130, 246, 0.1)';
            if (currentObjType === 'home') bgClass = 'rgba(16, 185, 129, 0.1)';
            if (currentObjType === 'holiday' || publicHolidays.includes(dateStr)) bgClass = 'rgba(245, 158, 11, 0.1)';

            return (
              <div 
                key={i} 
                onClick={() => handleDayClick(day)}
                style={{
                  aspectRatio: '1/1',
                  minWidth: 0,
                  minHeight: 0,
                  backgroundColor: bgClass,
                  border: isToday(day) ? '2px solid var(--primary)' : '1px solid var(--border-color-solid)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: isSameMonth(day, monthStart) ? 1 : 0.3,
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none',
                  boxShadow: isWeekend ? 'inset 0 0 0 1000px rgba(128, 128, 128, 0.12)' : 'none'
                }}
              >
                <span style={{
                  position: 'absolute', top: '4px', left: '4px', fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  fontWeight: isToday(day) ? 'bold' : 'normal',
                  lineHeight: 1
                }}>
                  {format(day, 'd')}
                </span>
                
                <div style={{
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getDayContent(dateStr, isWeekend)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><span style={{fontSize: '0.875rem'}}>🏢</span> Office</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><span style={{fontSize: '0.875rem'}}>🏠</span> Home</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}><span style={{fontSize: '0.875rem'}}>🌴</span> Holiday</div>
      </div>
    </div>
  );
}
