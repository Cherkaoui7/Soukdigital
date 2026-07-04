import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { Wand2, Download, Upload, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/ai-studio/background-remover')({
  component: BackgroundRemoverComponent,
})

function BackgroundRemoverComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
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

  const handleRemoveBackground = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/remove-background', {
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
      a.download = `souk-digital-bg-removed-${Date.now()}.png`
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
            <Wand2 className="w-8 h-8 text-sabra" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Background Remover</h1>
            <p className="text-muted-foreground text-sm">Détourez vos produits en un clic grâce à l'IA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          
          {/* Upload & Original Image Panel */}
          <div className="rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <h2 className="text-xl font-bold mb-6 z-10 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sabra" /> Image Originale
            </h2>
            
            <div className="flex-1 z-10 flex flex-col items-center justify-center">
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
                    Formats supportés : JPG, PNG, WEBP (Max 10MB)
                  </p>
                  <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
                    Parcourir les fichiers
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
                <div className="w-full h-full flex flex-col items-center">
                  <div className="relative w-full flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-4">
                    <img src={previewUrl} alt="A détourer" className="max-w-full max-h-full object-contain rounded-xl" />
                    <button 
                      onClick={() => {
                        setPreviewUrl(null)
                        setSelectedFile(null)
                        setResultUrl(null)
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="mt-6 w-full">
                    <button
                      onClick={handleRemoveBackground}
                      disabled={isProcessing}
                      className="w-full py-4 bg-gradient-to-r from-sabra to-orange-500 hover:opacity-90 disabled:opacity-50 text-black font-bold rounded-xl shadow-glow-gold transition-all flex items-center justify-center gap-3 text-lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Détourage magique en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          Détourer l'image
                        </>
                      )}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result Panel */}
          <div className="rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-hidden">
            <h2 className="text-xl font-bold mb-6 z-10 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-majorelle" /> Résultat (Transparent)
            </h2>
            
            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 flex items-center justify-center relative overflow-hidden custom-scrollbar">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4 text-center z-10">
                  <div className="w-20 h-20 rounded-2xl bg-sabra/10 flex items-center justify-center relative">
                    <Wand2 className="w-8 h-8 text-sabra animate-pulse" />
                    <div className="absolute inset-0 border-2 border-sabra/30 rounded-2xl animate-ping opacity-50" />
                  </div>
                  <p className="text-sm text-sabra font-medium">Analyse et détourage...</p>
                </div>
              ) : resultUrl ? (
                <div className="w-full h-full relative flex items-center justify-center group">
                  {/* Checkerboard background for transparency preview */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }} />
                  <img src={`http://127.0.0.1:8000${resultUrl}`} alt="Résultat détouré" className="max-w-full max-h-full object-contain drop-shadow-2xl z-10 relative" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-sm rounded-xl">
                    <button 
                      onClick={handleDownload}
                      className="px-6 py-3 bg-sabra/90 hover:bg-sabra rounded-xl text-black font-bold transition-colors shadow-glow-gold flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger (PNG HD)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ImageIcon className="w-6 h-6 opacity-50" />
                  </div>
                  <p>L'image détourée apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
