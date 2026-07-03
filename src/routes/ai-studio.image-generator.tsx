import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAIStudioStore } from '../stores/useAIStudioStore'
import { Wand2, Download, Image as ImageIcon, Settings2, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/ai-studio/image-generator')({
  component: ImageGenerator,
})

function ImageGenerator() {
  const { settings, updateSettings, isGenerating, setIsGenerating } = useAIStudioStore()
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  const handleGenerate = async () => {
    if (!settings.prompt) {
      toast.error("Veuillez entrer un prompt avant de générer.")
      return
    }

    setIsGenerating(true)
    // Simulate generation for now since backend is not running yet
    setTimeout(() => {
      setIsGenerating(false)
      toast.success("Image générée avec succès!")
    }, 3000)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Panel - Controls */}
      <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col h-full shadow-sm z-10 overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Générateur d'Images
          </h2>
          <p className="text-sm text-gray-500 mt-1">Créez des visuels produits époustouflants.</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Prompt */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex justify-between">
              Prompt
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">Requis</span>
            </label>
            <textarea
              className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
              placeholder="Ex: Un vase en céramique marocaine fait main sur une table en bois..."
              value={settings.prompt}
              onChange={(e) => updateSettings({ prompt: e.target.value })}
            />
          </div>

          {/* Style */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Style</label>
            <div className="grid grid-cols-2 gap-2">
              {['Photorealistic', 'Product Photography', 'Minimalist', 'Luxury', 'Studio', '3D Render'].map(style => (
                <button
                  key={style}
                  onClick={() => updateSettings({ style })}
                  className={`p-2 text-xs rounded-lg border transition-all ${
                    settings.style === style 
                      ? 'border-primary bg-primary/5 text-primary font-medium shadow-sm' 
                      : 'border-gray-200 hover:border-primary/50 text-gray-600'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <details className="group">
            <summary className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer hover:text-primary transition-colors list-none">
              <SlidersHorizontal className="w-4 h-4" />
              Paramètres Avancés
            </summary>
            
            <div className="mt-4 space-y-6 pt-4 border-t border-gray-100">
              {/* Aspect Ratio */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Format</label>
                <div className="flex flex-wrap gap-2">
                  {['1:1', '4:5', '16:9', '9:16', '3:2'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => updateSettings({ aspectRatio: ratio })}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        settings.aspectRatio === ratio 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guidance Scale */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-gray-700">Guidance Scale</label>
                  <span className="text-xs text-gray-500 font-mono">{settings.guidanceScale}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="20" step="0.5"
                  value={settings.guidanceScale}
                  onChange={(e) => updateSettings({ guidanceScale: parseFloat(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Steps</label>
                <div className="flex gap-2">
                  {[20, 30, 40, 60].map(step => (
                    <button
                      key={step}
                      onClick={() => updateSettings({ steps: step })}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                        settings.steps === step 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        <div className="p-6 mt-auto border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Générer (Fal.ai Flux)
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel - Result / Gallery */}
      <div className="flex-1 bg-gray-50/50 flex flex-col relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        
        {/* Header Tabs */}
        <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 flex items-center gap-6 z-10 sticky top-0">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`h-full border-b-2 font-medium px-2 transition-all ${activeTab === 'generate' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Résultat Actuel
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`h-full border-b-2 font-medium px-2 transition-all ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Historique
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto relative z-10">
          {activeTab === 'generate' && (
            <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-6 text-center animate-pulse">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                    <Sparkles className="w-10 h-10 text-primary animate-bounce" />
                    <div className="absolute inset-0 border-4 border-primary/30 rounded-2xl animate-ping opacity-50" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">L'IA crée votre image...</h3>
                    <p className="text-gray-500 mt-2">Cela peut prendre quelques secondes.</p>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center text-center opacity-60">
                  <ImageIcon className="w-24 h-24 text-gray-300 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-700">Aucune image générée</h3>
                  <p className="text-gray-500 max-w-md mt-4">
                    Utilisez le panneau de gauche pour décrire l'image que vous souhaitez créer. L'IA s'occupe du reste.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Placeholder for history */}
              <div className="col-span-full text-center py-20 text-gray-500">
                L'historique des générations apparaîtra ici.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
