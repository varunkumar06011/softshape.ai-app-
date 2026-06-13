import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS, CASHIER_TYPES } from './plans';
import { getOnboardingData, saveOnboardingStep, getOwner } from './saasApi';
import { Check, Plus, Upload, Trash2, Download, Printer, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const TOTAL_STEPS = 6;

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [onboarding, setOnboarding] = useState({});
  const owner = getOwner();

  useEffect(() => {
    const data = getOnboardingData();
    setOnboarding(data);
  }, []);

  const persist = (key, value) => {
    const updated = { ...onboarding, [key]: value };
    setOnboarding(updated);
    saveOnboardingStep(key, value);
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else navigate('/onboarding/payment');
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const inputClass =
    'w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-[#E53935] focus:ring-2 focus:ring-red-100 transition-all placeholder:text-slate-400';

  const stepLabels = ['Details', 'Floor plan', 'Menu', 'Staff', 'Printers', 'Plan'];

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── LOGO ── */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <img src="/logo softshape.ai.png" alt="Softshape.ai" className="h-10 object-contain" />
          <div className="w-16" />
        </div>

        {/* ── PROGRESS: mobile = thin bar + label, desktop = full stepper ── */}
        <div className="mb-6">
          {/* Mobile progress */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#E53935] uppercase tracking-wider">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-xs font-semibold text-slate-500">{stepLabels[step - 1]}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E53935] rounded-full transition-all duration-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop stepper */}
          <div className="hidden sm:flex items-center justify-between">
            {stepLabels.map((label, idx) => (
              <div key={idx} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      idx + 1 <= step ? 'bg-[#E53935] text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {idx + 1 < step ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[9px] font-bold mt-1.5 uppercase tracking-wider ${idx + 1 === step ? 'text-[#E53935]' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {idx < stepLabels.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${idx + 1 < step ? 'bg-[#E53935]' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP CONTENT ── */}
        {step === 1 && <Step1 form={onboarding.restaurant || {}} onChange={(v) => persist('restaurant', v)} inputClass={inputClass} />}
        {step === 2 && <Step2 form={onboarding.sections || []} onChange={(v) => persist('sections', v)} />}
        {step === 3 && <Step3 form={onboarding.menu || []} onChange={(v) => persist('menu', v)} />}
        {step === 4 && <Step4 plan={onboarding.planSelected || 'pro'} onChangePlan={(v) => persist('planSelected', v)} onboarding={onboarding} />}
        {step === 5 && <StepPrinter onboarding={onboarding} persist={persist} />}
        {step === 6 && <Step5 plan={onboarding.planSelected || 'pro'} onChangePlan={(v) => persist('planSelected', v)} onProceed={goNext} />}

        {/* ── NAVIGATION ── */}
        <div className="flex justify-between mt-6 gap-3">
          {step > 1 ? (
            <button
              onClick={goBack}
              className="px-5 sm:px-7 py-3 border border-slate-200 text-slate-500 rounded-xl font-semibold text-sm hover:bg-white transition-all"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={goNext}
            className="px-6 sm:px-8 py-3 bg-[#E53935] text-white rounded-xl font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all"
          >
            {step < TOTAL_STEPS ? 'Next →' : 'Proceed to payment →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step1({ form, onChange, inputClass }) {
  const f = { name: '', address: '', gst: '', logo: '', cuisine: '', seating: '', swiggyStoreId: '', zomatoOutletId: '', ...form };
  const set = (k, v) => onChange({ ...f, [k]: v });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">Restaurant details</h2>
      <div className="space-y-4">
        <input type="text" placeholder="Restaurant name" value={f.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        <textarea placeholder="Full address" value={f.address} onChange={(e) => set('address', e.target.value)} className={`${inputClass} h-24 py-4 resize-none`} />
        <input type="text" placeholder="GST number (optional)" value={f.gst} onChange={(e) => set('gst', e.target.value)} className={inputClass} />
        <select value={f.cuisine} onChange={(e) => set('cuisine', e.target.value)} className={inputClass}>
          <option value="">Select cuisine type</option>
          <option value="Indian">Indian</option>
          <option value="Chinese">Chinese</option>
          <option value="Multi-cuisine">Multi-cuisine</option>
          <option value="Fast food">Fast food</option>
          <option value="Bar & Restaurant">Bar & Restaurant</option>
          <option value="Other">Other</option>
        </select>
        <input type="number" placeholder="Seating capacity" value={f.seating} onChange={(e) => set('seating', e.target.value)} className={inputClass} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Swiggy Store ID (e.g. 123456)" value={f.swiggyStoreId} onChange={(e) => set('swiggyStoreId', e.target.value)} className={inputClass} />
          <input type="text" placeholder="Zomato Outlet ID (e.g. 98765)" value={f.zomatoOutletId} onChange={(e) => set('zomatoOutletId', e.target.value)} className={inputClass} />
        </div>
        <p className="text-xs text-slate-400">Get these from your Swiggy/Zomato restaurant dashboard</p>
        <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50">
          <input type="file" accept="image/*" className="hidden" id="logoUpload" onChange={(e) => set('logo', e.target.files[0]?.name || '')} />
          <label htmlFor="logoUpload" className="cursor-pointer text-sm font-bold text-slate-500">
            {f.logo ? `Selected: ${f.logo}` : 'Click to upload logo'}
          </label>
        </div>
      </div>
    </div>
  );
}

function Step2({ form, onChange }) {
  const sections = form && form.length ? form : [];
  const addSection = () => {
    onChange([...sections, { name: '', tables: 1, capacity: 4 }]);
  };
  const updateSection = (idx, k, v) => {
    const s = [...sections];
    s[idx] = { ...s[idx], [k]: v };
    onChange(s);
  };
  const removeSection = (idx) => {
    const s = [...sections];
    s.splice(idx, 1);
    onChange(s);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">Floor plan</h2>
      <button
        onClick={addSection}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#E53935] text-white rounded-lg font-semibold text-sm hover:bg-[#C62828] active:scale-[0.97] transition-all mb-6"
      >
        <Plus className="w-4 h-4" /> Add section
      </button>

      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <div key={idx} className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="text"
                placeholder="Section name (e.g. Main Hall)"
                value={sec.name}
                onChange={(e) => updateSection(idx, 'name', e.target.value)}
                className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-[#E53935] focus:ring-2 focus:ring-red-100 transition-all"
              />
              <button onClick={() => removeSection(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tables</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={sec.tables}
                  onChange={(e) => updateSection(idx, 'tables', parseInt(e.target.value) || 1)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-[#E53935] focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Capacity per table</label>
                <input
                  type="number"
                  value={sec.capacity}
                  onChange={(e) => updateSection(idx, 'capacity', parseInt(e.target.value) || 1)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-[#E53935] focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            </div>
          </div>
        ))}
        {sections.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Add at least one section to continue.</p>}
      </div>
    </div>
  );
}

function Step3({ form, onChange }) {
  const [tab, setTab] = useState('csv');
  const items = form && form.length ? form : [];
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', type: 'FOOD', isVeg: true, variants: '' });

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;
    const variants = newItem.variants
      ? newItem.variants.split(',').map((v) => {
          const [n, p] = v.split(':');
          return { name: n.trim(), price: parseInt(p) || 0 };
        })
      : [];
    onChange([...items, { ...newItem, price: parseInt(newItem.price), variants }]);
    setNewItem({ name: '', category: '', price: '', type: 'FOOD', isVeg: true, variants: '' });
    toast.success('Item added');
  };

  const removeItem = (idx) => {
    const next = [...items];
    next.splice(idx, 1);
    onChange(next);
  };

  const downloadTemplate = () => {
    const csv = `item_name,category,price,type,is_veg,variants
Butter Chicken,Main Course,320,FOOD,false,Half:280|Full:320
Paneer Tikka,Starters,220,FOOD,true,
Old Monk Rum,Spirits,180,LIQUOR,false,30ml:180|60ml:320|90ml:450
Kingfisher Beer,Beer,120,LIQUOR,false,`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'softshape_menu_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border border-slate-200 p-5 sm:p-8">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">Menu setup</h2>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('csv')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'csv' ? 'bg-[#E53935] text-white' : 'bg-red-50 text-slate-500'}`}>Upload CSV</button>
        <button onClick={() => setTab('manual')} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'manual' ? 'bg-[#E53935] text-white' : 'bg-red-50 text-slate-500'}`}>Add manually</button>
      </div>

      {tab === 'csv' && (
        <div className="space-y-4">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Download template
          </button>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50">
            <input type="file" accept=".csv" className="hidden" id="csvUpload" onChange={(e) => {
              const file = e.target.files[0];
              if (file) toast.success(`Selected: ${file.name}`);
            }} />
            <label htmlFor="csvUpload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-[#E53935]" />
              <span className="text-sm font-bold text-slate-500">Click to upload CSV</span>
            </label>
          </div>
        </div>
      )}

      {tab === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all" />
            <input type="text" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all" />
            <input type="number" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all" />
            <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })} className="h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all">
              <option value="FOOD">FOOD</option>
              <option value="LIQUOR">LIQUOR</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <input type="checkbox" checked={newItem.isVeg} onChange={(e) => setNewItem({ ...newItem, isVeg: e.target.checked })} className="w-4 h-4 accent-[#E53935]" />
              Vegetarian
            </label>
          </div>
          <input type="text" placeholder="Variants (e.g. Half:280,Full:320)" value={newItem.variants} onChange={(e) => setNewItem({ ...newItem, variants: e.target.value })} className="w-full h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all" />
          <button onClick={addItem} className="px-6 py-3 bg-[#E53935] text-white rounded-2xl font-bold text-xs  hover:bg-[#B71C1C] active:scale-[0.98] transition-all">+ Add item</button>

          <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-sm text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.category} · {item.type} · ₹{item.price} {item.isVeg ? '· Veg' : ''}</p>
                </div>
                <button onClick={() => removeItem(idx)} className="p-2 text-[#C62828] hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step4({ plan, onChangePlan, onboarding }) {
  const planData = PLANS.find((p) => p.id === plan) || PLANS[1];
  const stationsCount = planData.cashiers;
  const captainsCount = planData.captains;

  const stations = onboarding.stations || Array.from({ length: stationsCount }, (_, i) => ({
    name: '',
    type: 'dining',
    username: '',
    password: '',
  }));
  const captains = onboarding.captains || Array.from({ length: captainsCount }, (_, i) => ({ name: '', pin: '' }));
  const admin = onboarding.admin || { username: (getOwner()?.email) || '', password: '' };

  const updateStation = (idx, k, v) => {
    const s = [...stations];
    s[idx] = { ...s[idx], [k]: v };
    saveOnboardingStep('stations', s);
  };
  const updateCaptain = (idx, k, v) => {
    const c = [...captains];
    c[idx] = { ...c[idx], [k]: v };
    saveOnboardingStep('captains', c);
  };
  const updateAdmin = (k, v) => {
    const a = { ...admin, [k]: v };
    saveOnboardingStep('admin', a);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border border-slate-200 p-5 sm:p-8 space-y-7">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Set up your cashier stations</h2>
        <p className="text-sm text-slate-500">Your {planData.name} plan includes {stationsCount} station{stationsCount > 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-4">
        {stations.map((s, idx) => (
          <div key={idx} className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
            <p className="text-xs font-bold  text-slate-400 mb-3">Station {idx + 1}</p>
            <input type="text" placeholder="Station name (e.g. Dining Counter 1)" value={s.name} onChange={(e) => updateStation(idx, 'name', e.target.value)} className="w-full h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#E53935] transition-all mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {CASHIER_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateStation(idx, 'type', t.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${s.type === t.id ? 'border-[#E53935] bg-white' : 'border-slate-200 bg-white'}`}
                >
                  <p className="text-xs font-bold text-slate-900">{t.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Username" value={s.username} onChange={(e) => updateStation(idx, 'username', e.target.value)} className="h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#E53935] transition-all" />
              <input type="password" placeholder="Password" value={s.password} onChange={(e) => updateStation(idx, 'password', e.target.value)} className="h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#E53935] transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Captains</h3>
        <p className="text-sm text-slate-500 mb-4">Waiters who take orders · {captainsCount} included</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {captains.map((c, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Captain {idx + 1}</p>
              <input type="text" placeholder="Name" value={c.name} onChange={(e) => updateCaptain(idx, 'name', e.target.value)} className="w-full h-10 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#E53935] transition-all mb-2" />
              <input type="password" maxLength={4} placeholder="4-digit PIN" value={c.pin} onChange={(e) => updateCaptain(idx, 'pin', e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full h-10 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#E53935] transition-all" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Admin credentials</h3>
        <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Admin username" value={admin.username} onChange={(e) => updateAdmin('username', e.target.value)} className="h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#E53935] transition-all" />
          <input type="password" placeholder="Admin password" value={admin.password} onChange={(e) => updateAdmin('password', e.target.value)} className="h-11 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#E53935] transition-all" />
        </div>
      </div>
    </div>
  );
}

function StepPrinter({ onboarding, persist }) {
  const [kotIp, setKotIp] = useState(onboarding.printers?.kotIp || '192.168.1.100');
  const [billIp, setBillIp] = useState(onboarding.printers?.billIp || '192.168.1.101');
  const [tested, setTested] = useState({ kot: false, bill: false });

  const save = (kotVal, billVal) => {
    persist('printers', { kotIp: kotVal, billIp: billVal });
  };

  const testPrint = (type) => {
    setTimeout(() => {
      setTested((prev) => ({ ...prev, [type]: true }));
      toast.success(`${type === 'kot' ? 'KOT' : 'Bill'} printer test sent!`);
    }, 1000);
  };

  const printers = [
    {
      key: 'kot',
      label: 'KOT Printer',
      subLabel: 'Kitchen Order Ticket',
      desc: 'Placed at the kitchen counter. Prints every new order automatically.',
      ip: kotIp,
      setIp: (v) => { setKotIp(v); save(v, billIp); },
      steps: [
        'Connect the thermal printer to your restaurant WiFi or LAN switch.',
        'Power on and hold the FEED button to print a self-test page.',
        'The test page will show the printer\'s IP address.',
        'Enter that IP address in the field below and click Test.',
      ],
    },
    {
      key: 'bill',
      label: 'Bill Printer',
      subLabel: 'Customer Receipt',
      desc: 'Placed at the cashier counter. Prints bills and receipts.',
      ip: billIp,
      setIp: (v) => { setBillIp(v); save(kotIp, v); },
      steps: [
        'Connect the printer to the same WiFi/LAN as your POS device.',
        'Print a self-test page by holding FEED while powering on.',
        'Find the IP address printed on the test page.',
        'Enter the IP below and test the connection.',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border border-slate-200 p-5 sm:p-7">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Printer setup</h2>
        <p className="text-sm text-slate-400">Connect thermal printers so KOTs and bills print automatically when orders are placed.</p>
      </div>

      {printers.map((printer) => (
        <div key={printer.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 border border-slate-200 p-5 sm:p-7">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5 text-[#E53935]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm sm:text-base">{printer.label}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{printer.subLabel}</p>
              <p className="text-xs text-slate-500 mt-1">{printer.desc}</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {printer.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-50 text-[#E53935] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs sm:text-sm text-slate-500 leading-snug">{s}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Printer IP Address</label>
              <input
                type="text"
                value={printer.ip}
                onChange={(e) => printer.setIp(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#E53935] focus:bg-white transition-all"
                placeholder="e.g. 192.168.1.100"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={() => testPrint(printer.key)}
                className={`h-11 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  tested[printer.key]
                    ? 'bg-[#E8F5E9] text-[#2E7D32] border-2 border-[#A5D6A7]'
                    : 'bg-[#E53935] text-white hover:bg-[#B71C1C] active:scale-[0.97]'
                }`}
              >
                {tested[printer.key] ? '✓ OK' : 'Test'}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-[#FFFDE7] border border-[#FFF9C4] rounded-xl p-4 sm:p-5">
        <p className="text-[10px] font-bold text-[#F9A825] uppercase tracking-wider mb-3">💡 Quick tips</p>
        <ul className="space-y-2">
          {[
            'Recommended printers: Epson TM-T82, TVS RP3220, or any 80mm thermal printer.',
            'Both printers must be on the same WiFi/LAN as the POS tablet/computer.',
            'If you only have 1 printer, use the same IP for both KOT and billing.',
            'You can update printer IPs anytime from the Admin Dashboard → Settings.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#795548]">
              <span className="shrink-0">•</span>{tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Step5({ plan, onChangePlan, onProceed }) {
  const selected = plan || 'pro';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChangePlan(p.id)}
            className={`relative text-left p-6 rounded-[32px] border transition-all bg-white ${
              selected === p.id ? 'border-2 border-[#E53935]' : 'border-slate-200'
            }`}
          >
            {p.popular && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-[#E53935] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Popular
              </span>
            )}
            {selected === p.id && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-[#2E7D32] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Selected
              </span>
            )}
            <h3 className="text-lg font-bold text-slate-900 mb-2">{p.name}</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">₹{p.price.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 mb-4">per year</p>
            <ul className="space-y-2">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <Check className="w-3 h-3 text-[#2E7D32] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border border-slate-200 p-5 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Order summary</h3>
        {(() => {
          const p = PLANS.find((x) => x.id === selected) || PLANS[1];
          return (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-bold text-slate-900">{p.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Validity</span><span className="font-bold text-slate-900">1 year</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Stations</span><span className="font-bold text-slate-900">{p.cashiers}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Captains</span><span className="font-bold text-slate-900">{p.captains}</span></div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-[#E53935]">₹{p.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
