import { X, Printer } from 'lucide-react'

const KOTPreview = ({ kotData, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">KOT Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Table: {kotData.table}</span>
            <span className="text-sm text-gray-500">{kotData.time}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            {kotData.items.map((item, idx) => (
              <div key={idx} className="text-sm py-1">{item}</div>
            ))}
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors font-semibold flex items-center justify-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Send to Printer
        </button>
      </div>
    </div>
  )
}

export default KOTPreview
