import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantLogin } from './saasApi';
import { currentBase, loadServerUrl, saveServerUrl } from '../lib/serverUrl';
import { ArrowLeft, User, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TenantLoginScreen({ slug, role, stationId, onSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', pin: '' });
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(currentBase);

  useEffect(() => {
    loadServerUrl().then(() => setServerUrl(currentBase));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let username = form.username;
      let password = form.password;
      if (role === 'captain') {
        username = selectedCaptain?.name || '';
        password = form.pin;
      }
      const res = await tenantLogin(slug, role, username, password, stationId || null);
      onSuccess(res.session);
      toast.success('Logged in');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-14 rounded-2xl border-2 border-[#FFCDD2] bg-[#FFF5F5] px-5 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all';

  return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(`/tenant/${slug}`)} className="flex items-center gap-2 text-sm font-bold text-[#5C5C5C] mb-6 hover:text-[#E53935] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-[48px] border border-[#FFCDD2] p-8 md:p-10 relative">
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#E53935] transition-colors"
            title="Connection settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black text-[#1A1A1A] mb-1 text-center">
            {role === 'admin' && 'Admin Login'}
            {role === 'cashier' && 'Cashier Login'}
            {role === 'captain' && 'Captain Login'}
          </h1>
          <p className="text-sm text-[#5C5C5C] text-center mb-8">
            {stationId ? `Station: ${stationId}` : slug}
          </p>

          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-[#FFEBEE] text-[#C62828] text-sm font-bold">
              {error}
            </div>
          )}

          {role === 'captain' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                  const name = `Captain ${i}`;
                  const isActive = selectedCaptain?.name === name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedCaptain({ name })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        isActive ? 'border-[#E53935] bg-[#FFEBEE]' : 'border-[#FFCDD2] bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E53935] text-white flex items-center justify-center text-xs font-black">
                        {name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[10px] font-bold text-[#1A1A1A]">{name}</span>
                    </button>
                  );
                })}
              </div>
              {selectedCaptain && (
                <>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={loading || form.pin.length !== 4}
                    className="w-full py-4 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {loading ? 'Logging in...' : 'Login →'}
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#E53935] text-white flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider">{role}</p>
                </div>
              </div>
              <input
                type="text"
                placeholder={role === 'admin' ? 'Email address' : 'Username'}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={inputClass}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  'Login →'
                )}
              </button>
            </form>
          )}
        </div>

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-bold mb-1">Connection settings</h3>
              <p className="text-xs text-gray-400 mb-4">Point the app to your local backend</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Server address</label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]"
                    placeholder="e.g. http://192.168.1.50:3001"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Default: {import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000'}
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await saveServerUrl(serverUrl);
                    toast.success('Server address saved. Restart app to apply.');
                    setShowSettings(false);
                  }}
                  className="flex-1 py-3 bg-[#E53935] text-white rounded-xl text-sm font-semibold hover:bg-[#C62828]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
