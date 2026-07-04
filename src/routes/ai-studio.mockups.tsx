import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { LayoutTemplate, Download, Upload, Image as ImageIcon, Loader2, ArrowRight, Settings2 } from 'lucide-react'

export const Route = createFileRoute('/ai-studio/mockups')({
  component: MockupsComponent,
})

const TEMPLATES = [
  { id: 'template_table', name: 'Table Rustique', thumb: '/templates/template_table.jpg' },
  { id: 'template_marble', name: 'Socle Marbre', thumb: '/templates/template_marble.jpg' },
  { id: 'template_desert', name: 'Désert', thumb: '/templates/template_desert.jpg' },
]

function MockupsComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [productUrl, setProductUrl] = useState<string | null>(null)
  
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0].id)
  
  // Transform States
  const [scale, setScale] = useState<number>(0.3)
  const [xPercent, setXPercent] = useState<number>(0.5)
  const [yPercent, setYPercent] = useState<number>(0.5)
  const [rotation, setRotation] = useState<number>(0)
  const [shadowOpacity, setShadowOpacity] = useState<number>(0.5)

  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setProductUrl(URL.createObjectURL(file))
      setResultUrl(null)
      setError(null)
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('template_id', activeTemplate)
    formData.append('x_percent', xPercent.toString())
    formData.append('y_percent', yPercent.toString())
    formData.append('scale', scale.toString())
    formData.append('rotation', rotation.toString())
    formData.append('shadow_opacity', shadowOpacity.toString())

    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate-mockup', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du mockup HD')
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
      a.download = `mockup-hd-${Date.now()}.jpg`
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
      <div className="max-w-[1400px] mx-auto w-full space-y-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-majorelle/20 rounded-2xl border border-majorelle/30 shadow-glow-blue">
            <LayoutTemplate className="w-8 h-8 text-majorelle" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Mockups Studio (V1)</h1>
            <p className="text-muted-foreground text-sm">Placez vos produits dans des décors ultra-réalistes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Controls Panel */}
          <div className="col-span-1 lg:col-span-4 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-majorelle" /> Configuration
            </h2>
            
            <div className="flex flex-col gap-6 flex-1">
              
              {/* 1. Templates */}
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 uppercase tracking-wider">1. Choisir un décor</h3>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTemplate(t.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        activeTemplate === t.id ? 'border-majorelle shadow-glow-blue' : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <img src={t.thumb} alt={t.name} className="absolute inset-0 w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                        <span className="text-xs text-left font-medium leading-tight">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Product Upload */}
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 uppercase tracking-wider">2. Importer le produit (détouré)</h3>
                {!productUrl ? (
                  <div 
                    className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-majorelle/50 hover:bg-white/5 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 text-muted-foreground mb-2 group-hover:text-majorelle transition-colors" />
                    <p className="text-sm">Cliquez pour importer un PNG</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/webp" onChange={handleFileSelect} />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/10">
                    <div className="w-16 h-16 rounded-lg bg-[url('/checkered-pattern.png')] flex items-center justify-center">
                      <img src={productUrl} alt="Prod" className="max-w-full max-h-full object-contain drop-shadow-md" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Produit chargé</p>
                      <button onClick={() => { setProductUrl(null); setSelectedFile(null); }} className="text-xs text-red-400 hover:text-red-300">Retirer</button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Adjustments */}
              {productUrl && (
                <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                  <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">3. Ajustements (Preview)</h3>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Taille (Scale)</span>
                      <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <input type="range" min="0.1" max="1.5" step="0.01" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full accent-majorelle" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Position X</span>
                      <span>{Math.round(xPercent * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={xPercent} onChange={e => setXPercent(parseFloat(e.target.value))} className="w-full accent-majorelle" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Position Y</span>
                      <span>{Math.round(yPercent * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={yPercent} onChange={e => setYPercent(parseFloat(e.target.value))} className="w-full accent-majorelle" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Rotation</span>
                      <span>{rotation}°</span>
                    </div>
                    <input type="range" min="-180" max="180" step="1" value={rotation} onChange={e => setRotation(parseFloat(e.target.value))} className="w-full accent-majorelle" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Ombre Portée (Opacité)</span>
                      <span>{Math.round(shadowOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={shadowOpacity} onChange={e => setShadowOpacity(parseFloat(e.target.value))} className="w-full accent-majorelle" />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleGenerate}
                disabled={isProcessing || !selectedFile}
                className="w-full py-4 bg-gradient-to-r from-majorelle to-purple-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl shadow-glow-blue transition-all flex items-center justify-center gap-3 text-lg mt-auto"
              >
                {isProcessing ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Rendu HD en cours...</>
                ) : (
                  <><LayoutTemplate className="w-6 h-6" /> Générer Rendu HD</>
                )}
              </button>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6 min-h-[600px]">
            
            {/* Interactive Preview Viewport */}
            <div className="flex-1 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                Aperçu Interactif (Low-Res)
              </h2>
              <div className="flex-1 bg-black/40 rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10">
                
                {/* Background Template */}
                <div className="w-full h-full relative flex items-center justify-center bg-[#1a1a24]">
                  {/* Simulate the background for preview */}
                  <img 
                    src={TEMPLATES.find(t => t.id === activeTemplate)?.thumb} 
                    alt="Template" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  
                  {/* Draggable Product Overlay */}
                  {productUrl && (
                    <img 
                      src={productUrl} 
                      alt="Product Preview"
                      style={{
                        position: 'absolute',
                        left: `${xPercent * 100}%`,
                        top: `${yPercent * 100}%`,
                        width: `${scale * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        filter: shadowOpacity > 0 ? `drop-shadow(0px 20px 15px rgba(0,0,0,${shadowOpacity}))` : 'none',
                        transition: 'all 0.1s ease-out'
                      }}
                      className="object-contain pointer-events-none"
                    />
                  )}
                </div>

              </div>
            </div>

            {/* High Res Result Viewport */}
            {resultUrl && (
              <div className="h-[400px] rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-green-400">
                    <ArrowRight className="w-5 h-5" /> Rendu HD Final
                  </h2>
                  <button onClick={handleDownload} className="px-4 py-2 bg-majorelle rounded-lg font-bold flex items-center gap-2 hover:bg-majorelle/80 transition-colors">
                    <Download className="w-4 h-4" /> Télécharger
                  </button>
                </div>
                <div className="flex-1 bg-black/20 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 p-2">
                   <img src={`http://127.0.0.1:8000${resultUrl}`} alt="Final Mockup" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                </div>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </div>
  )
}
