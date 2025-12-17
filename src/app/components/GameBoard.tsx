import { motion } from 'motion/react';

type Player = 'X' | 'O' | null;

interface GameBoardProps {
  board: Player[];
  onCellClick: (index: number) => void;
  isPlayerTurn: boolean;
  winner: 'player' | 'computer' | 'draw' | null;
}

export function GameBoard({ board, onCellClick, isPlayerTurn, winner }: GameBoardProps) {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Decorative frame */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[#D4AF7A]/10 to-[#E8D5E8]/10 rounded-3xl blur-xl" />
      
      <div className="relative bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-[#D4A5A5]/20">
        <div className="grid grid-cols-3 gap-3 [&>*]:w-20 [&>*]:h-20 sm:[&>*]:w-24 sm:[&>*]:h-24">
          {board.map((cell, index) => (
            <Cell
              key={index}
              value={cell}
              onClick={() => onCellClick(index)}
              disabled={!isPlayerTurn || cell !== null || winner !== null}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Status indicator */}
      {!winner && (
        <motion.div 
          className="mt-4 text-center text-[#8B7B7B]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={isPlayerTurn ? 'player' : 'computer'}
        >
          {isPlayerTurn ? '✨ Ваш ход' : '💫 Ход компьютера...'}
        </motion.div>
      )}
    </motion.div>
  );
}

interface CellProps {
  value: Player;
  onClick: () => void;
  disabled: boolean;
  index: number;
}

function Cell({ value, onClick, disabled, index }: CellProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        aspect-square rounded-2xl flex items-center justify-center
        transition-all duration-300 relative overflow-hidden
        ${!disabled && !value ? 'hover:bg-[#D4AF7A]/10 hover:scale-105 cursor-pointer' : ''}
        ${disabled && !value ? 'cursor-not-allowed' : ''}
        bg-white/80 border-2 border-[#D4A5A5]/20
        shadow-lg hover:shadow-xl
      `}
      whileHover={!disabled && !value ? { scale: 1.05 } : {}}
      whileTap={!disabled && !value ? { scale: 0.95 } : {}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
      
      {value === 'X' && <XMark />}
      {value === 'O' && <OMark />}
    </motion.button>
  );
}

function XMark() {
  return (
    <motion.svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      className="text-[#D4A5A5]"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <defs>
        <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A5A5" />
          <stop offset="100%" stopColor="#D4AF7A" />
        </linearGradient>
      </defs>
      <motion.path
        d="M 15 15 L 45 45 M 45 15 L 15 45"
        stroke="url(#xGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(212, 165, 165, 0.3))' }}
      />
    </motion.svg>
  );
}

function OMark() {
  return (
    <motion.svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      className="text-[#D4AF7A]"
      initial={{ scale: 0, rotate: 180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <defs>
        <linearGradient id="oGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8D5E8" />
          <stop offset="100%" stopColor="#D4AF7A" />
        </linearGradient>
      </defs>
      <motion.circle
        cx="30"
        cy="30"
        r="18"
        stroke="url(#oGradient)"
        strokeWidth="6"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(212, 175, 122, 0.3))' }}
      />
    </motion.svg>
  );
}
