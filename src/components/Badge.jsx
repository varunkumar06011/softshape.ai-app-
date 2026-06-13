const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    swiggy: 'bg-orange-100 text-orange-800',
    zomato: 'bg-red-100 text-red-800',
    veg: 'bg-green-100 text-green-800',
    nonveg: 'bg-red-100 text-red-800',
    bar: 'bg-purple-100 text-purple-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    brand: 'bg-brand-light text-brand'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export default Badge
