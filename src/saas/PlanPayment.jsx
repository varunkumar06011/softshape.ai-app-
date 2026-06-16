import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOnboardingData, saveOnboardingStep, activateOwner } from './saasApi';
import { PLANS } from './plans';
import { CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlanPayment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const onboarding = getOnboardingData();
  const planId = onboarding.planSelected || 'pro';
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];

  const handlePay = async () => {
    setLoading(true);
    try {
      await activateOwner(planId);
      await saveOnboardingStep('payment', { paid: true, plan: planId, paidAt: new Date().toISOString() });
      setPaid(true);
      toast.success('Payment successful!');
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Payment successful!</h2>
          <p className="text-sm text-slate-400 mb-8">Your {plan.name} plan is now active for 1 year.</p>
          <button
            onClick={() => navigate('/onboarding/menu-upload')}
            className="w-full py-3 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all"
          >
            Set up your menu →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/onboarding')} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Complete your order</h1>
          <p className="text-sm text-slate-400">Review and confirm your subscription</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-4">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Restaurant</span>
              <span className="font-medium text-slate-700">{onboarding.restaurant?.name || 'Your Restaurant'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Plan</span>
              <span className="font-medium text-slate-700">{plan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <span className="font-medium text-slate-700">₹{plan.price.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Valid until</span>
              <span className="font-medium text-slate-700">{new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-[#E53935]">₹{plan.price.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Demo mode — no real charge</span>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Pay now'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          You can update or cancel your plan anytime from Settings.
        </p>
      </div>
    </div>
  );
}
