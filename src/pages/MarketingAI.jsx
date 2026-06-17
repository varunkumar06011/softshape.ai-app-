import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { analyzeMenuImage, getSocialStatus, postToSocial } from '../saas/saasApi'
import { Upload, Download, Copy, Instagram, Facebook, MessageCircle, RefreshCw, Send, Twitter, Linkedin } from 'lucide-react'
import toast from 'react-hot-toast'

const LAYOUTS = [
  { name: 'Classic Split', aspect: 1, layout: 'split' },
  { name: 'Full Bleed Overlay', aspect: 1, layout: 'bleed' },
  { name: 'Bordered Card', aspect: 1, layout: 'border' },
  { name: 'Circle Focus', aspect: 1, layout: 'circle' },
  { name: 'Story Portrait', aspect: 0.56, layout: 'story' },
  { name: 'Minimal Clean', aspect: 1, layout: 'minimal' },
]

function getOwner() {
  try { return JSON.parse(localStorage.getItem('saas_owner') || 'null') } catch { return null }
}

export default function MarketingAI() {
  const owner = getOwner()
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [restaurantName, setRestaurantName] = useState(owner?.restaurantName || 'Restaurant')
  const [price, setPrice] = useState('')
  const [activeTagline, setActiveTagline] = useState(0)
  const [customColor, setCustomColor] = useState('')
  const [captionTab, setCaptionTab] = useState('instagram')
  const [socialStatus, setSocialStatus] = useState(null)
  const [postingMap, setPostingMap] = useState({})

  useEffect(() => {
    getSocialStatus().then(setSocialStatus).catch(() => {})
  }, [])

  const handleImageSelect = (file) => {
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    setAnalyzing(true)
    try {
      const result = await analyzeMenuImage(imageFile)
      setAiResult(result)
      setActiveTagline(0)
    } catch (err) {
      toast.error(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageSelect(file)
  }

  const posterThemes = aiResult?.posterThemes || []
  const theme = posterThemes.length > 0 ? posterThemes[0] : {}

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 lg:ml-64">
        <h1 className="text-2xl font-bold mb-6">Marketing AI</h1>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Food Photo</h2>
          {!imagePreview ? (
            <div
              onClick={() => document.getElementById('marketing-upload')?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 lg:p-12 text-center cursor-pointer hover:border-brand transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400 mt-1">JPEG, PNG, WebP up to 5MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              <div className="flex gap-3">
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50">
                  {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                </button>
                <button onClick={() => { setImageFile(null); setImagePreview(null); setAiResult(null) }}
                  className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm">
                  Remove
                </button>
              </div>
              {aiResult && (
                <p className="text-sm text-gray-600">Detected: <span className="font-semibold">{aiResult.dishName}</span> | {aiResult.cuisine} | {aiResult.isVeg ? 'Veg' : 'Non-Veg'}</p>
              )}
            </div>
          )}
          <input id="marketing-upload" type="file" accept="image/*" className="hidden"
            onChange={e => handleImageSelect(e.target.files?.[0])} />
        </div>

        {/* Customization Panel */}
        {aiResult && (
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold mb-4">Customize</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Restaurant Name</label>
                <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (optional)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 280"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tagline</label>
                <select value={activeTagline} onChange={e => setActiveTagline(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-brand">
                  {(aiResult.taglines || []).map((t, i) => <option key={i} value={i}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color Override</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={customColor || theme.bg || '#E53935'} onChange={e => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <button onClick={() => setCustomColor('')} className="text-xs text-gray-500 hover:text-gray-700">Reset</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Poster Grid */}
        {aiResult && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Poster Designs</h2>
              <button onClick={downloadAllPosters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" /> Download All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {LAYOUTS.map((layout, idx) => (
                <PosterCard key={idx} layout={layout} idx={idx} aiResult={aiResult}
                  theme={posterThemes[idx] || theme}
                  customColor={customColor}
                  restaurantName={restaurantName}
                  dishName={aiResult.dishName}
                  tagline={(aiResult.taglines || [])[activeTagline] || ''}
                  price={price}
                  caption={aiResult?.captions?.[captionTab] || ''}
                  socialStatus={socialStatus}
                  posting={postingMap[idx]}
                  onPostStart={() => setPostingMap(prev => ({ ...prev, [idx]: true }))}
                  onPostEnd={() => setPostingMap(prev => ({ ...prev, [idx]: false }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Social Captions */}
        {aiResult?.captions && (
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Social Captions</h2>
              <button onClick={handleAnalyze} className="flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {['instagram', 'facebook', 'whatsapp'].map(p => (
                <button key={p} onClick={() => setCaptionTab(p)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${captionTab === p ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p === 'instagram' ? <Instagram className="w-4 h-4 inline mr-1" /> : p === 'facebook' ? <Facebook className="w-4 h-4 inline mr-1" /> : <MessageCircle className="w-4 h-4 inline mr-1" />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {aiResult.captions[captionTab]}
              </p>
              <button onClick={() => { navigator.clipboard.writeText(aiResult.captions[captionTab]); toast.success('Copied') }}
                className="absolute top-0 right-0 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PosterCard({ layout, idx, aiResult, theme, customColor, restaurantName, dishName, tagline, price, caption, socialStatus, posting, onPostStart, onPostEnd }) {
  const canvasRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState([])

  const bg = customColor || theme?.bg || '#E53935'
  const cardBg = theme?.cardBg || bg
  const textColor = theme?.textColor || '#FFFFFF'
  const accentColor = theme?.accentColor || '#FFD600'

  useEffect(() => {
    if (!canvasRef.current || !aiResult?.imageDataUrl) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const w = layout.aspect >= 1 ? 600 : 600
    const h = layout.aspect >= 1 ? 600 : Math.round(600 / layout.aspect)
    canvas.width = w
    canvas.height = h

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, w, h)

      if (layout.layout === 'split') {
        // Top half image
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(0, h * 0.5)
        ctx.lineTo(w, h * 0.45)
        ctx.lineTo(w, 0)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, 0, 0, w, h * 0.55)
        ctx.restore()
        // Bottom bg
        ctx.fillStyle = bg
        ctx.fillRect(0, h * 0.45, w, h * 0.55)
        // Text
        ctx.fillStyle = textColor
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(restaurantName, w / 2, h * 0.6)
        ctx.font = 'bold 36px sans-serif'
        ctx.fillText(dishName, w / 2, h * 0.72)
        ctx.font = '20px sans-serif'
        ctx.fillStyle = accentColor
        ctx.fillText(tagline, w / 2, h * 0.82)
        if (price) {
          ctx.fillStyle = textColor
          ctx.font = 'bold 24px sans-serif'
          ctx.fillText(`Rs.${price}`, w / 2, h * 0.92)
        }
      } else if (layout.layout === 'bleed') {
        // Full image
        ctx.drawImage(img, 0, 0, w, h)
        // Dark overlay from bottom
        const grad = ctx.createLinearGradient(0, h * 0.4, 0, h)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, 'rgba(0,0,0,0.85)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
        // Text at bottom
        ctx.fillStyle = textColor
        ctx.font = 'bold 40px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(dishName, w / 2, h * 0.75)
        ctx.font = '22px sans-serif'
        ctx.fillStyle = accentColor
        ctx.fillText(tagline, w / 2, h * 0.85)
        // Order now pill
        ctx.fillStyle = bg
        ctx.beginPath()
        ctx.roundRect(w / 2 - 70, h * 0.9, 140, 36, 18)
        ctx.fill()
        ctx.fillStyle = textColor
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText('Order Now', w / 2, h * 0.9 + 25)
      } else if (layout.layout === 'border') {
        // Background
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)
        // Border
        const pad = 20
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 4
        ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2)
        // Image in center
        const iw = w - pad * 4
        const ih = h * 0.5
        const ix = pad * 2
        const iy = h * 0.18
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(ix, iy, iw, ih, 12)
        ctx.clip()
        ctx.drawImage(img, ix, iy, iw, ih)
        ctx.restore()
        // Text above
        ctx.fillStyle = textColor
        ctx.font = 'bold 22px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(restaurantName, w / 2, pad * 2 + 10)
        // Text below
        ctx.font = 'bold 30px sans-serif'
        ctx.fillText(dishName, w / 2, h * 0.78)
        ctx.font = '18px sans-serif'
        ctx.fillStyle = accentColor
        ctx.fillText(tagline, w / 2, h * 0.88)
        // Hashtags strip
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.fillRect(0, h - 40, w, 40)
        ctx.fillStyle = textColor
        ctx.font = '12px sans-serif'
        ctx.fillText('#Foodie #IndianFood #Yummy #Restaurant', w / 2, h - 15)
      } else if (layout.layout === 'circle') {
        // Background
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)
        // Circle image
        const r = w * 0.35
        const cx = w / 2
        const cy = h * 0.35
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2)
        ctx.restore()
        // Circle border
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
        // Text below
        ctx.fillStyle = textColor
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(dishName, w / 2, h * 0.72)
        ctx.font = '20px sans-serif'
        ctx.fillStyle = accentColor
        ctx.fillText(tagline, w / 2, h * 0.82)
      } else if (layout.layout === 'story') {
        // 9:16 portrait
        ctx.fillStyle = cardBg
        ctx.fillRect(0, 0, w, h)
        // Top: restaurant name
        ctx.fillStyle = textColor
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(restaurantName, w / 2, 50)
        // Middle: image (40% height)
        const ih = h * 0.4
        ctx.drawImage(img, w * 0.1, 70, w * 0.8, ih)
        // Bottom: tagline, price, badge
        ctx.fillStyle = textColor
        ctx.font = 'bold 28px sans-serif'
        ctx.fillText(dishName, w / 2, 70 + ih + 50)
        ctx.font = '18px sans-serif'
        ctx.fillStyle = accentColor
        ctx.fillText(tagline, w / 2, 70 + ih + 85)
        if (price) {
          ctx.fillStyle = textColor
          ctx.font = 'bold 22px sans-serif'
          ctx.fillText(`Rs.${price}`, w / 2, 70 + ih + 120)
        }
        // Badge
        ctx.fillStyle = bg
        ctx.beginPath()
        ctx.roundRect(w / 2 - 80, h - 70, 160, 36, 18)
        ctx.fill()
        ctx.fillStyle = textColor
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText("Today's Special", w / 2, h - 47)
      } else {
        // Minimal Clean
        ctx.fillStyle = cardBg
        ctx.fillRect(0, 0, w, h)
        // Left 40% image
        const iw = w * 0.4
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(20, 20, iw - 20, h - 40, 12)
        ctx.clip()
        ctx.drawImage(img, 20, 20, iw - 20, h - 40)
        ctx.restore()
        // Right 60% text
        ctx.fillStyle = textColor
        ctx.textAlign = 'left'
        ctx.font = 'bold 32px sans-serif'
        const words = dishName.split(' ')
        let y = h * 0.3
        words.forEach(word => {
          ctx.fillText(word, iw + 20, y)
          y += 42
        })
        ctx.font = '18px sans-serif'
        ctx.fillStyle = accentColor
        ctx.fillText(tagline, iw + 20, y + 10)
        if (price) {
          ctx.fillStyle = bg
          ctx.beginPath()
          ctx.roundRect(iw + 20, y + 30, 80, 30, 8)
          ctx.fill()
          ctx.fillStyle = textColor
          ctx.font = 'bold 16px sans-serif'
          ctx.fillText(`Rs.${price}`, iw + 35, y + 50)
        }
        // Veg dot
        ctx.beginPath()
        ctx.arc(iw + 20, h - 40, 8, 0, Math.PI * 2)
        ctx.fillStyle = '#4CAF50'
        ctx.fill()
      }
    }
    img.src = aiResult.imageDataUrl
  }, [layout, aiResult, theme, customColor, restaurantName, dishName, tagline, price])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${restaurantName.replace(/\s+/g, '-')}_${dishName.replace(/\s+/g, '-')}_${layout.name.replace(/\s+/g, '-')}.png`
      a.click()
      URL.revokeObjectURL(url)
      setDownloading(false)
      toast.success('Downloaded')
    })
  }

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handlePost = async () => {
    if (selectedPlatforms.length === 0) { toast.error('Select at least one platform'); return }
    const canvas = canvasRef.current
    if (!canvas) return
    onPostStart()
    try {
      const imageBase64 = canvas.toDataURL('image/png')
      const res = await postToSocial(imageBase64, caption, selectedPlatforms)
      const results = res.results || {}
      let successCount = 0
      Object.entries(results).forEach(([platform, result]) => {
        if (result?.success) { successCount++; toast.success(`Posted to ${platform}`) }
        else { toast.error(`${platform}: ${result?.error || 'Failed'}`) }
      })
      if (successCount === 0) toast.error('No posts succeeded')
    } catch (err) {
      toast.error(err.message || 'Post failed')
    } finally {
      onPostEnd()
    }
  }

  const platforms = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, connected: socialStatus?.facebook?.connected },
    { id: 'instagram', label: 'Instagram', icon: Instagram, connected: socialStatus?.instagram?.connected },
    { id: 'x', label: 'X', icon: Twitter, connected: socialStatus?.x?.connected },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, connected: socialStatus?.linkedin?.connected },
  ].filter(p => p.connected)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <canvas ref={canvasRef} className="w-full rounded-xl mb-3" style={{ aspectRatio: layout.aspect }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{layout.name}</span>
        <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{layout.aspect >= 1 ? '1:1' : '9:16'}</span>
      </div>
      <button onClick={handleDownload} disabled={downloading}
        className="w-full py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 mb-3">
        <Download className="w-4 h-4" /> {downloading ? 'Saving...' : 'Download PNG'}
      </button>

      {platforms.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Post to</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {platforms.map(p => (
              <label key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${selectedPlatforms.includes(p.id) ? 'bg-brand text-white border-brand' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                <input type="checkbox" className="sr-only" checked={selectedPlatforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
                <p.icon className="w-3.5 h-3.5" /> {p.label}
              </label>
            ))}
          </div>
          <button onClick={handlePost} disabled={posting}
            className="w-full py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {posting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {posting ? 'Posting...' : 'Post Now'}
          </button>
        </div>
      )}
      {platforms.length === 0 && socialStatus && (
        <p className="text-[10px] text-gray-400 text-center">No social accounts connected. Add them in onboarding.</p>
      )}
    </div>
  )
}

function downloadAllPosters() {
  const canvases = document.querySelectorAll('canvas')
  canvases.forEach((canvas, idx) => {
    setTimeout(() => {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `poster-${idx + 1}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    }, idx * 300)
  })
  toast.success('Downloading all posters...')
}
