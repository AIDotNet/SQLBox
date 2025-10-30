import { Link, useLocation } from 'react-router-dom';
import { Database, MessageSquare, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { useConnectionStore } from '@/stores/connectionStore';

export function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { selectedConnectionId, connections } = useConnectionStore();

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Database className="w-6 h-6" />
            SQLBox
          </Link>

          <nav className="flex gap-1">
            <Link to="/">
              <Button
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                对话
              </Button>
            </Link>
            <Link to="/connections">
              <Button
                variant={location.pathname === '/connections' ? 'default' : 'ghost'}
                size="sm"
              >
                <Database className="w-4 h-4 mr-2" />
                连接管理
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {selectedConnection && (
            <div className="text-sm text-muted-foreground">
              当前连接: <span className="font-medium text-foreground">{selectedConnection.name}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
