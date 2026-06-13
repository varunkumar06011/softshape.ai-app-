import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMenuCSV, getOnboardingData, getOwner } from './saasApi';
import { Upload, Download, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MenuUploadStep() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [imported, setImported] = useState(0);
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
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-[48px] border border-[#FFCDD2] p-8 md:p-10">
          <h1 className="text-2xl font-black text-[#1A1A1A] mb-1 text-center">Almost done</h1>
          <p className="text-sm text-[#5C5C5C] text-center mb-8">Upload your menu to activate your cashier panels</p>

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
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-3 bg-[#E53935] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#B71C1C] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {uploading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload & import →'
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#FFCDD2] rounded-[32px] p-8 bg-white/60 text-center">
              <h3 className="font-black text-[#1A1A1A] mb-2">Skip for now</h3>
              <p className="text-xs text-[#5C5C5C] mb-4">You can upload the menu later from your admin dashboard</p>
              <button
                onClick={() => navigate(slug ? `/tenant/${slug}` : '/admin')}
                className="px-6 py-3 border-2 border-[#FFCDD2] text-[#5C5C5C] rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-[#FFF5F5] transition-all"
              >
                Skip →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
