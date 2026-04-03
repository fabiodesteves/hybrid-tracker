import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsView() {
  const { currentUser } = useAuth();
  const [targetPercentage, setTargetPercentage] = useState(50);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      if (!currentUser) return;
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.targetPercentage) setTargetPercentage(data.targetPercentage);
        if (data.officeLocation) {
          setOfficeLocation(data.officeLocation);
          setAddress(data.officeLocation.address || '');
        }
      }
    }
    loadSettings();
  }, [currentUser]);

  useEffect(() => {
    function initAutocomplete() {
      if (!window.google || !inputRef.current) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['geometry', 'formatted_address', 'name']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;

        const newLoc = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name
        };
        setOfficeLocation(newLoc);
        setAddress(newLoc.address);
      });
    }

    // If Google Maps is already loaded, initialize immediately
    if (window.google) {
      initAutocomplete();
    } else {
      // Otherwise poll until the script has finished loading
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initAutocomplete();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleSave() {
    try {
      setMessage('Saving...');
      await setDoc(doc(db, 'users', currentUser.uid), {
        targetPercentage: Number(targetPercentage),
        officeLocation
      }, { merge: true });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving doc", error);
      setMessage('Failed to save settings.');
    }
  }

  return (
    <>
      <div className="glass-panel section-panel">
        <h2 className="section-title">Settings</h2>
        
        {message && <div style={{marginBottom: '1rem', color: message.includes('Failed') ? 'var(--danger)' : 'var(--success)'}}>{message}</div>}

        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">Target Office Percentage (%)</label>
            <input 
              type="number" 
              className="input-field" 
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(e.target.value)}
              min="0"
              max="100"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Office Location</label>
            <input 
              ref={inputRef}
              type="text" 
              className="input-field" 
              placeholder="Search address..." 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button onClick={handleSave} className="btn btn-primary">
          Save Settings
        </button>
      </div>
    </>
  );
}
