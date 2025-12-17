import { motion } from 'motion/react';
import { Heart, RefreshCw } from 'lucide-react';

interface LoseModalProps {
  onPlayAgain: () => void;
  isDraw?: boolean;
}

export function LoseModal({ onPlayAgain, isDraw = false }: LoseModalProps) {
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
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-[#D4A5A5]/30"
          initial={{ scale: 0, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Decorative border */}
          <div className="absolute inset-0 rounded-3xl border-2 border-[#D4A5A5] opacity-20 pointer-events-none" style={{ margin: '8px' }} />

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
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A5A5] to-[#E8D5E8] flex items-center justify-center shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <h2 className="text-4xl mb-2 text-[#5A4A4A]">
              {isDraw ? 'Ничья!' : 'Почти получилось!'}
            </h2>
            <p className="text-[#8B7B7B] mb-6">
              {isDraw 
                ? 'Вы оба сыграли отлично, но победителя нет'
                : 'В следующий раз обязательно повезёт'
              }
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4A5A5]" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                ✨
              </motion.div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4A5A5]" />
            </div>

            {/* Encouragement */}
            <motion.div
              className="bg-gradient-to-br from-[#FFF5EE] to-[#FFE5D9] rounded-2xl p-4 mb-6 border border-[#D4A5A5]/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm text-[#8B7B7B] italic">
                "Каждая игра делает вас сильнее. Попробуйте ещё раз и победите!"
              </p>
            </motion.div>

            {/* Play Again button */}
            <motion.button
              onClick={onPlayAgain}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#D4A5A5] to-[#D4AF7A] text-white hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-5 h-5" />
              Сыграть ещё раз
            </motion.button>

            {/* Small decorative elements */}
            <div className="mt-6 flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#D4A5A5]"
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
  );
}
