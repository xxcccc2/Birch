import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Settings, X, Check, RefreshCw } from 'lucide-react';

interface TelegramSettingsProps {
  className?: string;
}

const BOT_USERNAME = 'takepromosales_bot'; // Без @ в начале
// В проде заменить на URL Render сервиса
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function TelegramSettings({ className = "" }: TelegramSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('telegram_token');
    if (savedToken) {
      setToken(savedToken);
      checkConnection(savedToken);
    }
  }, []);

  const checkConnection = async (tokenToCheck: string) => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_URL}/api/check-connection?token=${tokenToCheck}`);
      const data = await response.json();
      setIsConnected(data.connected);
    } catch {
      setIsConnected(false);
    }
    setIsChecking(false);
  };

  const handleConnect = () => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = generateToken();
      setToken(currentToken);
      localStorage.setItem('telegram_token', currentToken);
    }
    
    // Открываем бота с deep link
    window.open(`https://t.me/${BOT_USERNAME}?start=${currentToken}`, '_blank');
    setIsOpen(true);
  };

  const handleCheckStatus = () => {
    if (token) {
      checkConnection(token);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('telegram_token');
    setToken(null);
    setIsConnected(false);
    setIsOpen(false);
  };

  const handleNewToken = () => {
    const newToken = generateToken();
    setToken(newToken);
    localStorage.setItem('telegram_token', newToken);
    setIsConnected(false);
    window.open(`https://t.me/${BOT_USERNAME}?start=${newToken}`, '_blank');
  };

  return (
    <>
      <motion.button
        onClick={isConnected ? () => setIsOpen(true) : handleConnect}
        className={`py-2 px-4 rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm ${
          isConnected 
            ? 'bg-[#0088cc]/10 border border-[#0088cc]/50 text-[#0088cc]' 
            : 'bg-white/40 border border-[#D4AF7A]/50 text-[#5A4A4A] hover:bg-[#0088cc]/10 hover:border-[#0088cc]/50 hover:text-[#0088cc]'
        } ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isConnected ? <Check className="w-4 h-4 flex-shrink-0" /> : <Send className="w-4 h-4 flex-shrink-0" />}
        <span className="whitespace-nowrap">{isConnected ? 'TG подключён' : 'Подключить TG'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="relative bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#D4AF7A]/30"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-[#8B7B7B] hover:text-[#5A4A4A]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-[#0088cc]" />
                <h3 className="text-lg text-[#5A4A4A]">Telegram</h3>
              </div>

              {isConnected ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-[#0088cc]/10 rounded-xl mb-4">
                    <Check className="w-5 h-5 text-[#0088cc]" />
                    <span className="text-[#0088cc] text-sm">Telegram привязан</span>
                  </div>
                  <p className="text-sm text-[#8B7B7B] mb-4">
                    Результаты игры будут отправляться вам в Telegram
                  </p>
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2 px-4 rounded-xl border border-[#D4A5A5]/50 text-[#D4A5A5] hover:bg-[#D4A5A5]/10 transition-colors"
                  >
                    Отвязать
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#8B7B7B] mb-4">
                    Нажмите кнопку ниже, перейдите в бот и нажмите /start. Затем вернитесь сюда и проверьте статус.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={handleNewToken}
                      className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#00a8e8] text-white hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Открыть бота
                    </button>
                  </div>
                  <button
                    onClick={handleCheckStatus}
                    disabled={isChecking}
                    className="w-full py-2 px-4 rounded-xl border border-[#D4AF7A]/50 text-[#5A4A4A] hover:bg-[#D4AF7A]/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? 'Проверка...' : 'Проверить статус'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function getTelegramToken(): string | null {
  return localStorage.getItem('telegram_token');
}

export const TELEGRAM_API_URL = API_URL;
