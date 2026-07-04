import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Code2, Wand2, Download, Copy, Play, Loader2, Sparkles, Check, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/ai-studio/codex')({
  component: CodexStudio,
})

declare global {
  interface Window {
    puter: any;
  }
}

function CodexStudio() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('openai/gpt-5.3-codex')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code')
  const [copied, setCopied] = useState(false)
  const [puterLoaded, setPuterLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Dynamically load Puter.js CDN
  useEffect(() => {
    if (window.puter) {
      setPuterLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.puter.com/v2/'
    script.async = true
    script.onload = () => {
      setPuterLoaded(true)
      console.log('Puter.js loaded successfully')
    }
    script.onerror = () => {
      toast.error("Impossible de charger l'API Puter.js. Veuillez vérifier votre connexion.")
    }
    document.body.appendChild(script)

    return () => {
      // Keep it loaded if other pages need it, but cleanup if necessary
    }
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Veuillez décrire le code à générer.')
      return
    }

    if (!window.puter) {
      toast.error("L'API Puter n'est pas encore chargée. Veuillez patienter.")
      return
    }

    setIsGenerating(true)
    setGeneratedCode('')
    setActiveTab('code')

    try {
      const response = await window.puter.ai.chat(
        `You are an expert coder. Write clean, functional code according to the request. Return ONLY the code, with no explanations, no markdown code blocks (like \`\`\`html or \`\`\`), just the raw code.
        
        Request: ${prompt}`,
        { model: model }
      )

      let codeText = ''
      if (typeof response === 'string') {
        codeText = response
      } else if (response && response.message && response.message.content) {
        codeText = response.message.content
      } else {
        codeText = JSON.stringify(response)
      }

      // Clean up markdown block if the model ignored the instructions
      if (codeText.includes('```')) {
        const lines = codeText.split('\n')
        const filteredLines = lines.filter(line => !line.trim().startsWith('```'))
        codeText = filteredLines.join('\n')
      }

      setGeneratedCode(codeText.trim())
      toast.success('Code généré avec succès !')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Une erreur est survenue lors de la génération.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    toast.success('Code copié dans le presse-papiers !')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([generatedCode], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'generated_code.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const suggestions = [
    {
      label: 'Bouton 3D Animé',
      text: 'Créez un bouton HTML/CSS 3D marocain de couleur or sabra avec un effet de survol moderne et des micro-animations en CSS pur.'
    },
    {
      label: 'Galerie Zellige',
      text: 'Faites une grille interactive responsive en HTML et CSS montrant des motifs de zellige avec des animations d\'entrée fluides au scroll.'
    },
    {
      label: 'Panier JS',
      text: 'Écrivez une classe JavaScript simple pour gérer un panier d\'achat (ajouter, retirer, calculer le total avec remise artisan).'
    }
  ]

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sabra/10 rounded-xl border border-sabra/30 text-sabra">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-white via-amber-200 to-sabra bg-clip-text text-transparent">
                Codex Unlimited Coder
              </h2>
              <p className="text-xs text-muted-foreground">
                Générez du code gratuitement et de manière illimitée grâce à Puter Codex.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {puterLoaded ? 'Puter.js Connecté' : 'Connexion Puter.js...'}
            </span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
          
          {/* Left panel: Prompt & Settings */}
          <div className="lg:col-span-5 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 p-6 flex flex-col space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sabra/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sabra" />
                  Que souhaitez-vous coder ?
                </label>
                <textarea
                  className="w-full h-48 p-4 bg-background/50 border border-white/10 rounded-xl focus:ring-1 focus:ring-sabra focus:border-sabra transition-all resize-none text-sm custom-scrollbar"
                  placeholder="Décrivez votre composant, script ou page..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Exemples rapides :</span>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(s.text)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-sabra/30 transition-all text-left truncate max-w-full"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model selection */}
              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium text-muted-foreground">Modèle Codex</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'openai/gpt-5.3-codex', name: 'GPT-5.3 Codex (Recommandé)', desc: 'Le plus puissant pour la génération complexe' },
                    { id: 'openai/gpt-5.2-codex', name: 'GPT-5.2 Codex', desc: 'Polyvalent et stable' },
                    { id: 'openai/gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max', desc: 'Performances maximales' },
                    { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', desc: 'Rapide et économique' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col space-y-0.5 ${
                        model === m.id
                          ? 'border-sabra bg-sabra/10 shadow-glow-gold'
                          : 'border-white/5 bg-black/20 hover:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-semibold text-white">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !puterLoaded}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-white bg-gradient-to-r from-amber-600 via-amber-500 to-sabra hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération du code...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Générer le code
                </>
              )}
            </button>
          </div>

          {/* Right panel: Output Code & Interactive Playground */}
          <div className="lg:col-span-7 rounded-3xl bg-card/40 backdrop-blur-2xl border border-white/5 p-6 flex flex-col space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <div className="flex border border-white/10 rounded-xl overflow-hidden p-0.5 bg-black/20">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'code' ? 'bg-sabra text-black shadow-glow-gold' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Code Source
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'preview' ? 'bg-sabra text-black shadow-glow-gold' : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Rendu Live
                </button>
              </div>

              {generatedCode && activeTab === 'code' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-background border border-white/10 hover:border-white/30 rounded-lg transition-all text-foreground text-xs flex items-center gap-1.5"
                    title="Copier le code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 bg-background border border-white/10 hover:border-white/30 rounded-lg transition-all text-foreground text-xs flex items-center gap-1.5"
                    title="Télécharger le fichier"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </button>
                </div>
              )}
            </div>

            {/* Display Area */}
            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col relative min-h-[400px]">
              {activeTab === 'code' ? (
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-xs text-slate-300 select-text whitespace-pre-wrap leading-relaxed">
                  {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                      <Loader2 className="w-8 h-8 text-sabra animate-spin" />
                      <p className="text-sm text-sabra font-medium animate-pulse">Codex écrit votre code...</p>
                    </div>
                  ) : generatedCode ? (
                    <code>{generatedCode}</code>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center opacity-30 pointer-events-none">
                      <Code2 className="w-12 h-12" />
                      <p className="text-sm">Le code généré s'affichera ici.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 bg-white relative">
                  {generatedCode ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={generatedCode}
                      title="Codex Live Preview"
                      sandbox="allow-scripts"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center gap-3 text-center opacity-30 pointer-events-none">
                      <Play className="w-12 h-12 text-white" />
                      <p className="text-sm text-white">Générez d'abord du code HTML/CSS/JS pour le voir ici.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
