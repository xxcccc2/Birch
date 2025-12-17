import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Copy, Check } from 'lucide-react';

interface WinModalProps {
  promoCode: string;
  onClose: () => void;
}

export function WinModal({ promoCode, onClose }: WinModalProps) {
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate confetti
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      delay: Math.random() * 0.5,
      color: ['#D4A5A5', '#D4AF7A', '#E8D5E8', '#FFE5D9'][Math.floor(Math.random() * 4)]
    }));
    setConfetti(particles);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${particle.x}%`,
                backgroundColor: particle.color,
              }}
              initial={{ y: particle.y, opacity: 1, scale: 1 }}
              animate={{
                y: ['0vh', '100vh'],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0.8, 0],
                scale: [1, 0.5]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: particle.delay,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>

        {/* Sparkles around modal */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((i * Math.PI * 2) / 8) * 200,
              y: Math.sin((i * Math.PI * 2) / 8) * 200,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            <Sparkles className="w-4 h-4 text-[#D4AF7A]" />
          </motion.div>
        ))}

        {/* Modal */}
        <motion.div
          className="relative bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-[#D4AF7A]/30"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Decorative corner elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#D4AF7A] rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#D4AF7A] rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#D4AF7A] rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#D4AF7A] rounded-br-xl" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              className="mb-4 flex justify-center"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A5A5] to-[#D4AF7A] flex items-center justify-center shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <h2 className="text-4xl mb-2 text-[#5A4A4A]">
              {promoCode ? 'Поздравляем!' : 'Победа!'}
            </h2>
            <p className="text-[#8B7B7B] mb-6">
              {promoCode 
                ? 'Вы одержали победу и получили промокод на скидку' 
                : 'Отличная игра! Вы снова победили'}
            </p>

            {/* Promo Code - только если есть */}
            {promoCode && (
              <motion.div
                className="relative mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-gradient-to-br from-[#FFF5EE] to-[#FFE5D9] rounded-2xl p-6 border-2 border-[#D4AF7A] shadow-inner">
                  <div className="text-sm text-[#8B7B7B] mb-2">Ваш промокод</div>
                  <div className="text-5xl tracking-[0.2em] text-[#5A4A4A] mb-4 font-mono uppercase">
                    {promoCode}
                  </div>
                  
                  <motion.button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-2 bg-white/80 rounded-xl border border-[#D4AF7A] text-[#5A4A4A] hover:bg-[#D4AF7A] hover:text-white transition-all duration-300 shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Скопировать
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#D4A5A5] to-[#D4AF7A] text-white hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Сыграть ещё раз
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
  );
}
