import Sidebar from '../components/Sidebar'
import PrinterSetup from '../components/PrinterSetup'

export default function PrinterManagement() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <h1 className="text-2xl font-bold mb-6">Printers</h1>
        <PrinterSetup />
      </div>
    </div>
  )
}
