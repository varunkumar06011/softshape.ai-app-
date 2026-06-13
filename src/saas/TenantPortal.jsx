import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenantBySlug } from './saasApi';
import { Shield, Monitor, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TenantPortal() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenantBySlug(slug)
      .then((data) => setTenant(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-[48px] border border-[#FFCDD2] p-10 max-w-md w-full text-center">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-2">Restaurant not found</h2>
          <p className="text-sm text-[#5C5C5C] mb-6">We couldn't locate a restaurant with that URL.</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all"
          >
            Go to Softshape.ai
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    { role: 'admin', label: 'Admin Dashboard', icon: Shield, desc: 'Manage menu, staff, reports', path: `/tenant/${slug}/admin` },
    { role: 'cashier', label: 'Cashier', icon: Monitor, desc: 'Billing & KOT stations', path: `/tenant/${slug}/cashier/1` },
    { role: 'captain', label: 'Captain', icon: Smartphone, desc: 'Take orders from tables', path: `/tenant/${slug}/captain` },
  ];

  return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.restaurantName} className="h-20 mx-auto object-contain mb-4" />
          ) : (
            <img src="/logo softshape.ai.png" alt="Softshape.ai" className="h-20 mx-auto object-contain mb-4" />
          )}
          <h1 className="text-3xl font-black text-[#1A1A1A]">{tenant.restaurantName}</h1>
          <p className="text-sm text-[#5C5C5C] mt-1">Powered by Softshape.ai</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <button
              key={c.role}
              onClick={() => navigate(c.path)}
              className="bg-white rounded-[32px] border border-[#FFCDD2] p-8 text-left hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 bg-[#FFEBEE] rounded-2xl flex items-center justify-center mb-4">
                <c.icon className="w-6 h-6 text-[#E53935]" />
              </div>
              <h3 className="text-lg font-black text-[#1A1A1A] mb-1">{c.label}</h3>
              <p className="text-xs text-[#5C5C5C]">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
