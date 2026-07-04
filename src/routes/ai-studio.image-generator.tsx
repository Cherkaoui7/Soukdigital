import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAIStudioStore } from '../stores/useAIStudioStore'
import { Wand2, Download, Image as ImageIcon, Sparkles, Loader2, ShieldCheck, Zap, Palette, Box, MessageSquare, Sliders, CheckCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/ai-studio/image-generator')({
  component: ImageGenerator,
})

function ImageGenerator() {
  const { settings, updateSettings, isGenerating, setIsGenerating, resultUrls, setResultUrls } = useAIStudioStore()
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')

  const handleGenerate = async () => {
    if (!settings.prompt) {
      toast.error("Veuillez entrer un prompt avant de générer.")
      return
    }

    setIsGenerating(true)
    setResultUrls(null)
    setActiveTab('generate')

    try {
      // 1. Trigger Generation
      const createRes = await fetch("http://127.0.0.1:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: settings.prompt,
          negative_prompt: settings.negativePrompt || undefined,
          style: settings.style,
          aspect_ratio: settings.aspectRatio,
          quality: settings.quality,
          guidance_scale: settings.guidanceScale,
          num_inference_steps: settings.steps,
          num_images: settings.numImages
        })
      });

      if (!createRes.ok) throw new Error("Erreur lors de la création de la tâche");
      const task = await createRes.json();
      let status = task.status;
      let resultTask = task;

      // 2. Poll for completion
      while (status === "PENDING" || status === "PROCESSING") {
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s
        const checkRes = await fetch(`http://127.0.0.1:8000/api/generations/${task.id}`);
        if (!checkRes.ok) throw new Error("Erreur de vérification");
        resultTask = await checkRes.json();
        status = resultTask.status;
      }

      if (status === "COMPLETED" && resultTask.result_urls) {
        setResultUrls(resultTask.result_urls);
        toast.success("Image générée avec succès!");
      } else {
        throw new Error(resultTask.error_message || "La génération a échoué");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de connexion au serveur");
    } finally {
      setIsGenerating(false)
    }
  }

  const styles = [
    { id: 'Photorealiste', name: 'Photoréaliste', color: 'bg-orange-500/20 text-orange-400' },
    { id: '3D Render', name: '3D Render', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'Illustration', name: 'Illustration', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'Cinematique', name: 'Cinématique', color: 'bg-amber-500/20 text-amber-400' },
    { id: 'Minimaliste', name: 'Minimaliste', color: 'bg-teal-500/20 text-teal-400' }
  ];

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* LIGNE DU HAUT : Formulaire | Résultats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] h-full relative z-10">
          
          {/* Colonne 1 : Formulaire Créez votre image */}
          <div className="col-span-1 lg:col-span-4 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6 z-10">
              <Sparkles className="w-5 h-5 text-sabra" />
              <h2 className="text-xl font-bold">Créez votre image</h2>
            </div>
            
            <div className="space-y-6 flex-1 z-10 overflow-y-auto pr-2 pb-4 custom-scrollbar">
              
              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Décrivez votre image</label>
                <div className="relative">
                  <textarea
                    className="w-full h-32 p-4 bg-background/50 border border-white/10 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none text-sm"
                    placeholder="Un vase en céramique marocain fait main avec des motifs traditionnels, sur une table en bois dans un riad..."
                    value={settings.prompt}
                    onChange={(e) => updateSettings({ prompt: e.target.value })}
                  />
                  <div className="absolute bottom-3 right-3 p-2 bg-gradient-to-br from-primary to-sabra rounded-lg">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
                    {settings.prompt.length} / 500
                  </div>
                </div>
              </div>

              {/* Style */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Style</label>
                <div className="grid grid-cols-5 gap-3">
                  {styles.map(s => (
                    <button
                      key={s.id}
                      onClick={() => updateSettings({ style: s.id })}
                      className={`flex flex-col items-center gap-2 transition-all group ${
                        settings.style === s.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center transition-all ${
                        settings.style === s.id ? 'border-sabra bg-sabra/10 shadow-glow-gold' : 'border-white/5 bg-black/20 group-hover:border-white/20'
                      } ${s.color}`}>
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight truncate w-full px-1">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format & Quality */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Format</label>
                  <div className="flex flex-wrap gap-2">
                    {['1:1', '16:9', '4:5', '9:16'].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => updateSettings({ aspectRatio: ratio })}
                        className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${
                          settings.aspectRatio === ratio 
                            ? 'border-sabra bg-sabra/20 text-sabra shadow-glow-gold' 
                            : 'border-white/5 bg-black/20 hover:border-white/20 text-muted-foreground'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Qualité</label>
                  <div className="flex flex-wrap gap-2">
                    {['Standard', 'HD', '4K Ultra'].map(q => (
                      <button
                        key={q}
                        onClick={() => updateSettings({ quality: q })}
                        className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${
                          settings.quality === q 
                            ? 'border-sabra bg-sabra/20 text-sabra shadow-glow-gold' 
                            : 'border-white/5 bg-black/20 hover:border-white/20 text-muted-foreground'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Colors & Number */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Couleurs dominantes</label>
                  <div className="flex gap-2">
                    {['bg-orange-800', 'bg-amber-600', 'bg-slate-800', 'bg-teal-700', 'bg-blue-900'].map((color, i) => (
                      <button key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-transparent hover:border-white/50 transition-all`} />
                    ))}
                    <button className="w-8 h-8 rounded-full border border-dashed border-white/30 flex items-center justify-center hover:border-white text-white/50">
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Nombre d'images</label>
                  <div className="flex gap-2">
                    {[1, 2, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => updateSettings({ numImages: n })}
                        className={`w-12 h-10 text-xs font-medium rounded-xl border transition-all ${
                          settings.numImages === n 
                            ? 'border-sabra bg-sabra/20 text-sabra shadow-glow-gold' 
                            : 'border-white/5 bg-black/20 hover:border-white/20 text-muted-foreground'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-6 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white bg-gradient-to-r from-[#6b46c1] to-[#eab308] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Générer l'image
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </>
              )}
            </button>
          </div>

          {/* Colonne 2 : Résultats */}
          <div className="col-span-1 lg:col-span-8 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl p-6 flex flex-col relative overflow-hidden h-full">
            <div className="flex justify-between items-center mb-6 z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">Résultats</h2>
                <span className="text-xs text-muted-foreground">{resultUrls ? resultUrls.length : 0} image(s) générée(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-background border border-white/10 hover:border-white/30 rounded-lg transition-all text-foreground">
                  <Download className="w-3.5 h-3.5" />
                  Télécharger tout
                </button>
                <div className="flex border border-white/10 rounded-lg overflow-hidden">
                  <button className="p-1.5 bg-primary/20 text-white"><Box className="w-4 h-4" /></button>
                  <button className="p-1.5 bg-background text-muted-foreground hover:bg-white/5"><CheckCircle className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 overflow-y-auto custom-scrollbar flex items-center justify-center relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                    <Sparkles className="w-8 h-8 text-sabra animate-pulse" />
                    <div className="absolute inset-0 border-2 border-sabra/30 rounded-2xl animate-ping opacity-50" />
                  </div>
                  <p className="text-sm text-sabra font-medium">L'IA crée votre chef-d'œuvre...</p>
                </div>
              ) : resultUrls && resultUrls.length > 0 ? (
                <div className={`grid gap-6 w-full ${resultUrls.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'}`}>
                  {resultUrls.map((url, i) => (
                    <div key={i} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/20 shadow-2xl">
                      <img src={`http://127.0.0.1:8000${url}`} alt="Génération IA" className="w-full h-auto object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="p-4 bg-sabra/90 backdrop-blur-sm rounded-full text-black hover:bg-sabra transition-colors shadow-glow-gold">
                          <Download className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center opacity-40">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm">Votre image apparaîtra ici.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}

