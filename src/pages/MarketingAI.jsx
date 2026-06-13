import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Upload, Instagram, Facebook, Calendar, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const MarketingAI = () => {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [generatedPosters, setGeneratedPosters] = useState([])
  const [scheduleMode, setScheduleMode] = useState('now')
  const [scheduleDate, setScheduleDate] = useState('')

  const handleUpload = () => {
    setGeneratedPosters([
      { id: 1, color: 'bg-gradient-to-br from-red-500 to-orange-500', text: 'Paneer Butter Masala', caption: 'Creamy, rich, and absolutely delicious! Our signature Paneer Butter Masala is a customer favorite. Try it today! #PaneerLover #IndianFood #Foodie', hashtags: ['#PaneerLover', '#IndianFood', '#Foodie', '#Yummy'] },
      { id: 2, color: 'bg-gradient-to-br from-purple-500 to-pink-500', text: 'Chicken Biryani', caption: 'Aromatic and flavorful Chicken Biryani made with authentic spices. Perfect for lunch or dinner! #Biryani #Chicken #Authentic', hashtags: ['#Biryani', '#Chicken', '#Authentic', '#Delicious'] },
      { id: 3, color: 'bg-gradient-to-br from-green-500 to-teal-500', text: 'Dal Tadka', caption: 'Comfort food at its best! Our Dal Tadka is served with hot butter naan. #ComfortFood #Dal #Vegetarian', hashtags: ['#ComfortFood', '#Dal', '#Vegetarian', '#Healthy'] }
    ])
    toast.success('Posters generated successfully!')
  }

  const handlePost = (platform) => {
    toast.success(`Posted successfully to ${platform === 'instagram' ? 'Instagram' : 'Facebook'}!`)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <h1 className="text-2xl font-bold mb-6">Marketing AI</h1>

        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Food Photo</h2>
          <div
            onClick={handleUpload}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 lg:p-12 text-center cursor-pointer hover:border-brand transition-colors"
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
          </div>
        </div>

        {generatedPosters.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Generated Posters</h2>
            {generatedPosters.map((poster) => (
              <div key={poster.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className={`${poster.color} h-48 rounded-xl flex items-center justify-center mb-4`}>
                  <p className="text-white text-2xl font-bold">{poster.text}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">{poster.caption}</p>
                  <div className="flex flex-wrap gap-2">
                    {poster.hashtags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-brand-light text-brand rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="now"
                      checked={scheduleMode === 'now'}
                      onChange={() => setScheduleMode('now')}
                      className="text-brand"
                    />
                    Post now
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="schedule"
                      checked={scheduleMode === 'schedule'}
                      onChange={() => setScheduleMode('schedule')}
                      className="text-brand"
                    />
                    Schedule
                  </label>
                  {scheduleMode === 'schedule' && (
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => handlePost('instagram')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Instagram className="w-4 h-4" />
                    Post to Instagram
                  </button>
                  <button
                    onClick={() => handlePost('facebook')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Post to Facebook
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketingAI
