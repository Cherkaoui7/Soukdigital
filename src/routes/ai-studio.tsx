import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Sparkles, Image as ImageIcon, Wand2, LayoutTemplate } from 'lucide-react'

export const Route = createFileRoute('/ai-studio')({
  component: AIStudioLayout,
})

function AIStudioLayout() {
  const tools = [
    { name: 'Image Generator', icon: ImageIcon, path: '/ai-studio/image-generator' },
    { name: 'Background Remover', icon: Wand2, path: '/ai-studio/background-remover' },
    { name: 'Upscaler', icon: Sparkles, path: '/ai-studio/upscaler', disabled: true },
    { name: 'Mockups', icon: LayoutTemplate, path: '/ai-studio/mockups', disabled: true },
  ]

  return (
    <div className="dark flex min-h-screen bg-[#0a0a0f] text-foreground font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-majorelle/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sabra/10 blur-[120px] pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-card/40 backdrop-blur-xl border-r border-white/5 p-6 hidden md:flex flex-col z-10">
        <div className="flex items-center gap-3 mb-8 text-sabra">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-display">AI Studio</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              to={tool.disabled ? '#' : tool.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                tool.disabled 
                  ? 'opacity-40 cursor-not-allowed text-muted-foreground' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
              activeProps={{ className: 'bg-primary/20 text-white font-medium border border-primary/30 shadow-glow-gold' }}
            >
              <tool.icon className="w-5 h-5" />
              <span className="text-sm">{tool.name}</span>
              {tool.disabled && <span className="text-[9px] font-bold uppercase bg-white/10 text-white/60 px-2 py-0.5 rounded-full ml-auto">Bientôt</span>}
            </Link>
          ))}
        </nav>
        
        {/* Footer info in sidebar */}
        <div className="mt-auto pt-6 border-t border-border/50 text-xs text-muted-foreground">
          <p>Souk Digital AI © 2026</p>
          <p className="mt-1 opacity-50">Propulsé par Pollinations</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
