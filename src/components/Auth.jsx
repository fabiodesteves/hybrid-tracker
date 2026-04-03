import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (e) {
      setError('Failed to log in with Google: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', textAlign: 'center' }}>
        <h1 className="app-title" style={{ marginBottom: '1.5rem' }}>Tracker Hub</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Log in to track your office days</p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            disabled={loading}
            onClick={handleGoogleLogin} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
