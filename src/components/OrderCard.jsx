import Badge from './Badge'
import { Clock, MapPin } from 'lucide-react'

const OrderCard = ({ order, onAccept, onReject, showActions = false }) => {
  return (
    <div className={`bg-white border rounded-2xl p-4 ${order.status === 'new' ? 'border-red-400 animate-pulse' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <Badge variant={order.platform === 'swiggy' ? 'swiggy' : 'zomato'}>
          {order.platform.toUpperCase()}
        </Badge>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          {order.time}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{order.customerName}</h3>
      <div className="text-sm text-gray-600 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx}>{item.name} x {item.qty}</div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-bold text-lg">₹{order.total}</p>
        {showActions && order.status === 'new' && (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderCard
