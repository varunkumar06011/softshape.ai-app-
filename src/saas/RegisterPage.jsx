import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerOwner, saveOnboardingStep } from './saasApi';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    city: '',
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.restaurantName.trim()) e.restaurantName = 'Restaurant name is required';
    if (!form.city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        restaurantName: form.restaurantName,
        city: form.city,
      };
      const res = await registerOwner(data);
      await saveOnboardingStep('restaurant', {
        name: form.restaurantName,
        city: form.city,
        ownerName: form.name,
        email: form.email,
        phone: form.phone,
      });
      toast.success(res.message || 'Registered successfully');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-[#E53935] focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start sm:justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-400">Start your 1-year subscription in minutes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full name</label>
              <input type="text" placeholder="Owner full name" value={form.name} onChange={handleChange('name')} className={inputClass} />
              {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email</label>
              <input type="email" placeholder="you@restaurant.com" autoComplete="email" value={form.email} onChange={handleChange('email')} className={inputClass} />
              {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Phone</label>
              <input type="tel" placeholder="10-digit mobile number" inputMode="numeric" value={form.phone} onChange={handleChange('phone')} className={inputClass} />
              {errors.phone && <p className="text-xs text-red-500 mt-1.5">{errors.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</label>
                <input type="password" placeholder="Min 6 characters" autoComplete="new-password" value={form.password} onChange={handleChange('password')} className={inputClass} />
                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Confirm</label>
                <input type="password" placeholder="Re-enter password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} className={inputClass} />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{errors.confirmPassword}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Restaurant name</label>
              <input type="text" placeholder="Your restaurant name" value={form.restaurantName} onChange={handleChange('restaurantName')} className={inputClass} />
              {errors.restaurantName && <p className="text-xs text-red-500 mt-1.5">{errors.restaurantName}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">City</label>
              <input type="text" placeholder="e.g. Bangalore" value={form.city} onChange={handleChange('city')} className={inputClass} />
              {errors.city && <p className="text-xs text-red-500 mt-1.5">{errors.city}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already registered?{' '}
          <button onClick={() => navigate('/')} className="text-[#E53935] font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
