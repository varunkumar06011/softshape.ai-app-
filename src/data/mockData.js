export const restaurants = [
  { id: 'r1', name: 'VGrand Restaurant', plan: 'annual', active: true }
]

export const users = [
  { id: 'u1', email: 'admin@vgrand.com', password: 'admin123', role: 'admin', restaurantId: 'r1', name: 'Ravi Kumar' },
  { id: 'u2', email: 'cashier1@vgrand.com', password: '1234', role: 'cashier1', restaurantId: 'r1', name: 'Cashier Dine-In' },
  { id: 'u3', email: 'cashier2@vgrand.com', password: '1234', role: 'cashier2', restaurantId: 'r1', name: 'Cashier Delivery' },
  { id: 'u4', email: 'captain@vgrand.com', password: '1234', role: 'captain', restaurantId: 'r1', name: 'Captain Arjun' }
]

export const menuItems = [
  { id: 'm1', name: 'Paneer Butter Masala', category: 'Main Course', type: 'veg', price: 280, available: true },
  { id: 'm2', name: 'Chicken Biryani', category: 'Rice', type: 'nonveg', price: 320, available: true },
  { id: 'm3', name: 'Dal Tadka', category: 'Main Course', type: 'veg', price: 180, available: true },
  { id: 'm4', name: 'Whisky (60ml)', category: 'Bar', type: 'bar', price: 350, available: true },
  { id: 'm5', name: 'Kingfisher Beer', category: 'Bar', type: 'bar', price: 180, available: true },
  { id: 'm6', name: 'Butter Naan', category: 'Breads', type: 'veg', price: 60, available: true },
  { id: 'm7', name: 'Tandoori Chicken', category: 'Starters', type: 'nonveg', price: 380, available: true },
  { id: 'm8', name: 'Veg Fried Rice', category: 'Rice', type: 'veg', price: 220, available: true }
]

export const tables = [
  { id: 't1', label: 'AC-1', section: 'AC', status: 'free' },
  { id: 't2', label: 'AC-2', section: 'AC', status: 'occupied' },
  { id: 't3', label: 'AC-3', section: 'AC', status: 'free' },
  { id: 't4', label: 'Roof-1', section: 'Rooftop', status: 'free' },
  { id: 't5', label: 'Roof-2', section: 'Rooftop', status: 'occupied' },
  { id: 't6', label: 'PDR-1', section: 'Private Dining', status: 'free' },
  { id: 't7', label: 'Bar-1', section: 'Bar', status: 'free' },
  { id: 't8', label: 'Bar-2', section: 'Bar', status: 'occupied' }
]

export const runningOrders = [
  { id: 'o1', tableId: 't2', items: [
    { menuItemId: 'm1', name: 'Paneer Butter Masala', qty: 2, price: 280 },
    { menuItemId: 'm6', name: 'Butter Naan', qty: 4, price: 60 }
  ], status: 'running', source: 'dine-in' },
  { id: 'o2', tableId: 't5', items: [
    { menuItemId: 'm2', name: 'Chicken Biryani', qty: 1, price: 320 },
    { menuItemId: 'm4', name: 'Whisky (60ml)', qty: 2, price: 350 }
  ], status: 'running', source: 'dine-in' }
]

export const deliveryOrders = [
  { id: 'd1', platform: 'swiggy', customerName: 'Rahul S', items: [
    { name: 'Chicken Biryani', qty: 2, price: 320 },
    { name: 'Butter Naan', qty: 2, price: 60 }
  ], total: 760, status: 'new', time: '2 min ago' },
  { id: 'd2', platform: 'zomato', customerName: 'Priya M', items: [
    { name: 'Dal Tadka', qty: 1, price: 180 },
    { name: 'Veg Fried Rice', qty: 1, price: 220 }
  ], total: 400, status: 'new', time: '5 min ago' }
]

export const revenueData = [
  { day: 'Mon', dineIn: 12400, delivery: 3200 },
  { day: 'Tue', dineIn: 15800, delivery: 4100 },
  { day: 'Wed', dineIn: 9200, delivery: 5600 },
  { day: 'Thu', dineIn: 18300, delivery: 3800 },
  { day: 'Fri', dineIn: 22100, delivery: 6200 },
  { day: 'Sat', dineIn: 28400, delivery: 8900 },
  { day: 'Sun', dineIn: 31200, delivery: 9400 }
]
