import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Sparkles, Image as ImageIcon, Wand2, LayoutTemplate } from 'lucide-react'

export const Route = createFileRoute('/ai-studio')({
  component: AIStudioLayout,
})

function AIStudioLayout() {
  const tools = [
    { name: 'Image Generator', icon: ImageIcon, path: '/ai-studio/image-generator' },
    { name: 'Background Remover', icon: Wand2, path: '/ai-studio/background-remover', disabled: true },
    { name: 'Upscaler', icon: Sparkles, path: '/ai-studio/upscaler', disabled: true },
    { name: 'Mockups', icon: LayoutTemplate, path: '/ai-studio/mockups', disabled: true },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8 text-primary">
          <Sparkles className="w-6 h-6" />
          <h1 className="text-xl font-bold">AI Studio</h1>
        </div>
        
        <nav className="space-y-2">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              to={tool.disabled ? '#' : tool.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                tool.disabled 
                  ? 'opacity-50 cursor-not-allowed text-gray-500' 
                  : 'hover:bg-primary/5 text-gray-700 hover:text-primary'
              }`}
              activeProps={{ className: 'bg-primary/10 text-primary font-medium' }}
            >
              <tool.icon className="w-5 h-5" />
              <span>{tool.name}</span>
              {tool.disabled && <span className="text-[10px] uppercase bg-gray-100 px-2 py-0.5 rounded-full ml-auto">Bientôt</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
