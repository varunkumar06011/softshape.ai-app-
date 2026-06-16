import { useState } from 'react'
import { X, CreditCard, Smartphone, Banknote, Send } from 'lucide-react'
import { sendDigitalBill } from '../saas/saasApi'
import { generateBill } from '../utils/printTemplates'
import toast from 'react-hot-toast'

const BillModal = ({ order, onClose, onConfirmPayment }) => {
  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const cgst = order.cgst || Math.round(subtotal * 0.025 * 100) / 100
  const sgst = order.sgst || Math.round(subtotal * 0.025 * 100) / 100
  const total = order.total || subtotal + cgst + sgst
  const [paymentMode, setPaymentMode] = useState('cash')
  const [customerPhone, setCustomerPhone] = useState('')
  const [sendChannels, setSendChannels] = useState(new Set())
  const [digitalLoading, setDigitalLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  const isOnline = navigator.onLine
  const isValidPhone = /^[6-9]\d{9}$/.test(customerPhone)
  const canSendDigital = isOnline && isValidPhone && sendChannels.size > 0
  const showDigitalSection = isOnline && customerPhone.trim().length > 0

  const toggleChannel = (channel) => {
    setSendChannels(prev => {
      const next = new Set(prev)
      if (next.has(channel)) next.delete(channel)
      else next.add(channel)
      return next
    })
  }

  const handlePrintPaper = () => {
    onConfirmPayment(paymentMode)
  }

  const handleSendAndSkip = async () => {
    if (!isValidPhone) { setPhoneError('Enter a valid 10-digit mobile number'); return }
    if (sendChannels.size === 0) return
    setDigitalLoading(true)
    setPhoneError('')
    try {
      onConfirmPayment(paymentMode)
      await sendDigitalBill(order.id, { phone: customerPhone, channels: [...sendChannels], order })
      toast.success('Bill sent to customer!')
    } catch (err) {
      toast.error('Could not send digital bill — order is still settled')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Bill</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="font-semibold mb-2">Items</h3>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1">
              <span>{item.name} x {item.qty}</span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 font-mono text-xs whitespace-pre-line leading-relaxed overflow-x-auto">
          {generateBill({
            billNumber: order.billNumber,
            tableName: order.tableName,
            section: order.section,
            items: order.items,
            subtotal, cgst, sgst, total,
            paymentMode,
            restaurantName: order.restaurantName,
            restaurantAddress: order.restaurantAddress,
            gstin: order.gstin,
            barGstin: order.barGstin,
            createdAt: order.createdAt,
            stationType: order.stationType,
          }, order.billTemplate || 'CLASSIC')}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">CGST (2.5%)</span>
            <span>₹{cgst}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">SGST (2.5%)</span>
            <span>₹{sgst}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Payment Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMode('cash')}
              className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold ${
                paymentMode === 'cash' ? 'border-brand bg-brand-light' : 'border-gray-200'
              }`}
            >
              <Banknote className="w-5 h-5" />
              Cash
            </button>
            <button
              onClick={() => setPaymentMode('upi')}
              className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold ${
                paymentMode === 'upi' ? 'border-brand bg-brand-light' : 'border-gray-200'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              UPI
            </button>
            <button
              onClick={() => setPaymentMode('card')}
              className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold ${
                paymentMode === 'card' ? 'border-brand bg-brand-light' : 'border-gray-200'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Card
            </button>
          </div>
        </div>

        {isOnline && (
          <div className="border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium mb-2">📱 Send Digital Bill <span className="text-xs text-gray-400 font-normal">(optional)</span></p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-500">+91</span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => { setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError('') }}
                placeholder="Mobile number"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-brand"
              />
            </div>
            {phoneError && <p className="text-xs text-red-500 mb-2">{phoneError}</p>}
            {showDigitalSection && (
              <div className="flex gap-2 mb-3">
                {['whatsapp', 'sms'].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      sendChannels.has(ch)
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {ch === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </button>
                ))}
              </div>
            )}
            {!isOnline && <p className="text-xs text-gray-400">Digital bill unavailable offline.</p>}
          </div>
        )}

        {customerPhone.trim().length === 0 ? (
          <button
            onClick={handlePrintPaper}
            className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors font-semibold"
          >
            Confirm Payment
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handlePrintPaper}
              className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
            >
              Print Paper Bill
            </button>
            <button
              onClick={handleSendAndSkip}
              disabled={!canSendDigital || digitalLoading}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {digitalLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send & Skip Print
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BillModal
