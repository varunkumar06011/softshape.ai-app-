import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMenuCSV, getOnboardingData, getOwner, suggestMenuItems, addMenuItem } from './saasApi';
import { Upload, Download, ArrowRight, ArrowLeft, Sparkles, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MenuUploadStep() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [imported, setImported] = useState(0);
  const [aiNames, setAiNames] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiImporting, setAiImporting] = useState(false);
  const owner = getOwner();
  const slug = owner?.slug;

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

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMenuCSV(owner?.restaurantId || 'demo', file);
      setImported(res.imported || 0);
      setDone(true);
      toast.success(`Imported ${res.imported || 0} items`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAiSuggest = async () => {
    const items = aiNames.split('\n').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) { toast.error('Enter at least one item name'); return; }
    setAiLoading(true);
    try {
      const { suggestions } = await suggestMenuItems(items);
      setAiSuggestions(suggestions || []);
    } catch (err) {
      toast.error(err.message || 'AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImport = async () => {
    setAiImporting(true);
    let count = 0;
    for (const s of aiSuggestions) {
      try {
        await addMenuItem({
          itemName: s.itemName, category: s.category, price: s.suggestedPrice,
          isVeg: s.isVeg, menuType: s.menuType, station: s.station,
          specialNote: s.description,
        });
        count++;
      } catch {}
    }
    setImported(count);
    setDone(true);
    setAiImporting(false);
    toast.success(`Imported ${count} items`);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-[48px] border border-[#FFCDD2] p-10 max-w-md w-full text-center">
          <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Menu uploaded!</h2>
          <p className="text-sm text-[#5C5C5C] mb-8">{imported} items imported successfully.</p>
          <button
            onClick={() => navigate(slug ? `/tenant/${slug}` : '/admin')}
            className="w-full py-4 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
          >
            Go to your dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <button onClick={() => navigate('/onboarding/payment')} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-10">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 text-center">Almost done</h1>
          <p className="text-sm text-slate-400 text-center mb-8">Upload your menu to activate your cashier panels</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-[#FFCDD2] rounded-[32px] p-8 bg-[#FFF5F5] text-center">
              <Upload className="w-10 h-10 text-[#E53935] mx-auto mb-4" />
              <h3 className="font-black text-[#1A1A1A] mb-2">Upload CSV</h3>
              <p className="text-xs text-[#5C5C5C] mb-4">Import your full menu in one go</p>
              <button onClick={downloadTemplate} className="flex items-center gap-2 mx-auto px-4 py-2 border border-[#FFCDD2] rounded-xl text-xs font-bold text-[#5C5C5C] hover:bg-white transition-all mb-4">
                <Download className="w-3 h-3" /> Download template
              </button>
              <input type="file" accept=".csv" className="hidden" id="menuCsv" onChange={(e) => setFile(e.target.files[0])} />
              <label htmlFor="menuCsv" className="block cursor-pointer mb-3 text-xs font-bold text-[#E53935] hover:underline">
                {file ? file.name : 'Click to select CSV'}
              </label>
              {file && (
                <button onClick={handleUpload} disabled={uploading}
                  className="w-full py-3 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {uploading ? <span className="inline-flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading...</span> : 'Upload & import →'}
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-purple-200 rounded-[32px] p-8 bg-purple-50/50 text-center">
              <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-4" />
              <h3 className="font-black text-[#1A1A1A] mb-2">AI Smart Import</h3>
              <p className="text-xs text-[#5C5C5C] mb-4">Paste item names — AI fills category, price, veg/nv, station</p>
              {aiSuggestions.length === 0 ? (
                <>
                  <textarea value={aiNames} onChange={e => setAiNames(e.target.value)}
                    placeholder={`Butter Chicken\nDal Makhani\nOld Monk 60ml\nKingfisher Beer`}
                    className="w-full h-24 px-3 py-2 border border-purple-200 rounded-xl text-xs mb-3 resize-none focus:outline-none focus:border-purple-400" />
                  <button onClick={handleAiSuggest} disabled={aiLoading || !aiNames.trim()}
                    className="w-full py-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {aiLoading ? <span className="inline-flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</span> : 'Generate with AI'}
                  </button>
                </>
              ) : (
                <div className="text-left">
                  <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-xs border border-purple-100">
                        <span className="font-medium flex-1 truncate">{s.itemName}</span>
                        <span className="text-gray-500 w-20 truncate">{s.category}</span>
                        <span className="font-bold w-10 text-right">Rs.{s.suggestedPrice}</span>
                        <span className={`w-6 text-center text-[10px] font-bold rounded ${s.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.isVeg ? 'V' : 'NV'}</span>
                        <span className="text-gray-400 w-12 text-right">{s.station}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAiImport} disabled={aiImporting}
                    className="w-full py-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {aiImporting ? <span className="inline-flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Importing...</span> : `Import ${aiSuggestions.length} items`}
                  </button>
                  <button onClick={() => setAiSuggestions([])} className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700">Back to names</button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-[#FFCDD2] rounded-[32px] p-6 bg-white/60 text-center">
              <p className="text-xs text-[#5C5C5C] mb-3">You can upload the menu later from your admin dashboard</p>
              <button onClick={() => navigate(slug ? `/tenant/${slug}` : '/admin')}
                className="px-6 py-3 border-2 border-[#FFCDD2] text-[#5C5C5C] rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-[#FFF5F5] transition-all"
              >
                Skip for now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
