import Badge from './Badge'

const TableCard = ({ table, onClick, status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'free':
        return 'bg-white border-2 border-green-400 hover:border-green-600'
      case 'occupied':
        return 'bg-brand text-white'
      case 'bill-requested':
        return 'bg-white border-2 border-yellow-400 animate-pulse'
      default:
        return 'bg-white border-2 border-gray-200'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl cursor-pointer transition-all ${getStatusStyles()}`}
    >
      <p className="font-bold text-lg">{table.label}</p>
      <p className="text-sm opacity-75">{table.section}</p>
      {status === 'occupied' && (
        <Badge variant="warning" className="mt-2">Occupied</Badge>
      )}
      {status === 'bill-requested' && (
        <Badge variant="warning" className="mt-2">Bill Requested</Badge>
      )}
    </div>
  )
}

export default TableCard
