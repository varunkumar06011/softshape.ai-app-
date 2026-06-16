import { X, Printer } from 'lucide-react'
import { generateKOT } from '../utils/printTemplates'

const KOTPreview = ({ kotData, onClose, onConfirm }) => {
  const text = generateKOT(kotData)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">KOT Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 font-mono text-sm whitespace-pre-line leading-relaxed">
          {text}
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
