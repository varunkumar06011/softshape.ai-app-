import { useState } from 'react'
import { X, CreditCard, Smartphone, Banknote } from 'lucide-react'

const BillModal = ({ order, onClose, onConfirmPayment }) => {
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const gst = Math.round(subtotal * 0.05)
  const total = subtotal + gst
  const [paymentMode, setPaymentMode] = useState('cash')

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

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST (5%)</span>
            <span>₹{gst}</span>
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
              className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                paymentMode === 'cash' ? 'border-brand bg-brand-light' : 'border-gray-200'
              }`}
            >
              <Banknote className="w-5 h-5" />
              Cash
            </button>
            <button
              onClick={() => setPaymentMode('upi')}
              className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                paymentMode === 'upi' ? 'border-brand bg-brand-light' : 'border-gray-200'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              UPI
            </button>
            <button
              onClick={() => setPaymentMode('card')}
              className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${
                paymentMode === 'card' ? 'border-brand bg-brand-light' : 'border-gray-200'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Card
            </button>
          </div>
        </div>

        <button
          onClick={() => onConfirmPayment(paymentMode)}
          className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors font-semibold"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  )
}

export default BillModal
