import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { Sparkles, Download, Upload, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/ai-studio/upscaler')({
  component: UpscalerComponent,
})

function UpscalerComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(4)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResultUrl(null)
      setError(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        setResultUrl(null)
        setError(null)
      }
    }
  }

  const handleUpscale = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('scale', scale.toString())

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upscale-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du traitement de l\'image')
      }

      const data = await response.json()
      setResultUrl(data.url)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!resultUrl) return
    try {
      const response = await fetch(`http://127.0.0.1:8000${resultUrl}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `souk-digital-upscaled-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed', err)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-[1200px] mx-auto w-full space-y-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-sabra/20 rounded-2xl border border-sabra/30 shadow-glow-gold">
            <Sparkles className="w-8 h-8 text-sabra" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">AI Upscaler (HD)</h1>
            <p className="text-muted-foreground text-sm">Améliorez la résolution et la netteté de vos photos instantanément</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Upload & Original Image Panel */}
          <div className="col-span-1 lg:col-span-4 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <h2 className="text-xl font-bold mb-6 z-10 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sabra" /> Source
            </h2>
            
            <div className="flex-1 z-10 flex flex-col">
              {!previewUrl ? (
                <div 
                  className="w-full h-full min-h-[300px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-sabra/50 hover:bg-white/5 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-sabra" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Glissez votre photo ici</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-6">
                    Idéal pour les vieilles photos ou images floues (Max 10MB)
                  </p>
                  <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
                    Sélectionner un fichier
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-2 mb-6">
                    <img src={previewUrl} alt="Source" className="max-w-full max-h-full object-contain rounded-xl" />
                    <button 
                      onClick={() => {
                        setPreviewUrl(null)
                        setSelectedFile(null)
                        setResultUrl(null)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    <div>
                      <h3 className="text-sm font-medium text-white/80 mb-3 uppercase tracking-wider">Qualité d'amélioration</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setScale(2)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            scale === 2 
                              ? 'border-sabra bg-sabra/10 shadow-glow-gold' 
                              : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-lg font-bold ${scale === 2 ? 'text-sabra' : 'text-white'}`}>2x</span>
                          <span className="text-xs text-muted-foreground mt-1">Plus rapide</span>
                        </button>
                        <button 
                          onClick={() => setScale(4)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            scale === 4 
                              ? 'border-sabra bg-sabra/10 shadow-glow-gold' 
                              : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-lg font-bold ${scale === 4 ? 'text-sabra' : 'text-white'}`}>4x</span>
                          <span className="text-xs text-muted-foreground mt-1">Ultra HD</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleUpscale}
                      disabled={isProcessing}
                      className="w-full py-4 bg-gradient-to-r from-sabra to-orange-500 hover:opacity-90 disabled:opacity-50 text-black font-bold rounded-xl shadow-glow-gold transition-all flex items-center justify-center gap-3 text-lg mt-auto"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Traitement IA (Long)...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          Améliorer la netteté
                        </>
                      )}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <p className="text-xs text-center text-muted-foreground">
                      Le premier traitement peut prendre du temps (téléchargement du modèle IA).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result Panel */}
          <div className="col-span-1 lg:col-span-8 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-hidden">
            <h2 className="text-xl font-bold mb-6 z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-majorelle" /> Résultat (Haute Définition)
            </h2>
            
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 flex items-center justify-center relative overflow-hidden custom-scrollbar">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-6 text-center z-10 max-w-md">
                  <div className="w-24 h-24 rounded-3xl bg-sabra/10 flex items-center justify-center relative shadow-glow-gold">
                    <Sparkles className="w-10 h-10 text-sabra animate-pulse" />
                    <div className="absolute inset-0 border-2 border-sabra/30 rounded-3xl animate-ping opacity-50" />
                  </div>
                  <div>
                    <h3 className="text-lg text-sabra font-bold mb-2">Reconstruction par IA en cours...</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      L'intelligence artificielle analyse et réinvente chaque pixel pour recréer les détails manquants. Cela prend beaucoup de ressources.
                    </p>
                  </div>
                </div>
              ) : resultUrl ? (
                <div className="w-full h-full relative flex items-center justify-center group">
                  <img src={`http://127.0.0.1:8000${resultUrl}`} alt="Résultat HD" className="max-w-full max-h-full object-contain drop-shadow-2xl z-10 relative rounded-xl" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-sm rounded-xl">
                    <button 
                      onClick={handleDownload}
                      className="px-6 py-3 bg-sabra/90 hover:bg-sabra rounded-xl text-black font-bold transition-colors shadow-glow-gold flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger ({scale}x Haute Qualité)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center opacity-50">
                  <div className="flex items-center gap-4 mb-6">
                    <ImageIcon className="w-12 h-12" />
                    <ArrowRight className="w-6 h-6" />
                    <Sparkles className="w-12 h-12 text-sabra" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Le résultat apparaîtra ici</h3>
                  <p className="max-w-sm">
                    L'upscaler utilise Real-ESRGAN pour deviner et recréer la texture et les détails perdus.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
