import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onSwitch }) => {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) setSuccess(true);
  };

  if (success) return null; // Parent should redirect

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Login</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Username</span>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Password</span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', padding: '10px 0', borderRadius: 4, fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 16, marginTop: 8 }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div style={{ color: '#dc2626', textAlign: 'center' }}>{error}</div>}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          Don't have an account?{' '}
          <button type="button" onClick={onSwitch} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Register</button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage; 