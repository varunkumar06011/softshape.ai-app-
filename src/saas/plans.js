export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 7999,
    cashiers: 1,
    captains: 3,
    features: [
      '1 admin dashboard',
      '1 cashier station',
      '3 captain logins',
      'CSV menu upload',
      'KOT + receipt printing',
      'Daily reports',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    cashiers: 3,
    captains: 5,
    features: [
      '1 admin dashboard',
      '3 cashier stations',
      '5 captain logins',
      'Bar + dining + parcel counters',
      'Inventory management',
      'Analytics dashboard',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 12000,
    cashiers: 5,
    captains: 7,
    features: [
      '1 admin dashboard',
      '5 cashier stations',
      '7 captain logins',
      'Full analytics & reports',
      'Priority support',
      'Custom printer configs',
    ],
    popular: false,
  },
];

export const CASHIER_TYPES = [
  { id: 'dining', label: 'Dining cashier', desc: 'Food menu only — dine-in tables', menuFilter: 'FOOD' },
  { id: 'bar', label: 'Bar cashier', desc: 'Liquor menu only — bar tables', menuFilter: 'LIQUOR' },
  { id: 'parcel', label: 'Parcel counter', desc: 'Walk-in takeaway — full menu', menuFilter: 'BOTH' },
];
