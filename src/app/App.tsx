import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { WinModal } from './components/WinModal';
import { LoseModal } from './components/LoseModal';
import { TelegramSettings } from './components/TelegramSettings';
import { Sparkles, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

type Player = 'X' | 'O' | null;
type Board = Player[];

interface GameStats {
  wins: number;
  losses: number;
  lossStreak: number; // Серия проигрышей подряд
  promoCodeUsed: boolean; // Промокод уже выдан в этой сессии
}

export default function App() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'player' | 'computer' | 'draw' | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, lossStreak: 0, promoCodeUsed: false });
  const [pendingPromoCode, setPendingPromoCode] = useState<string | null>(null); // Код ожидающий отправки в TG

  // Check for winner
  const checkWinner = (currentBoard: Board): 'X' | 'O' | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a] as 'X' | 'O';
      }
    }

    if (currentBoard.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  // Generate promo code
  const generatePromoCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Send game result to Telegram bot
  const sendToTelegram = async (result: 'win' | 'lose' | 'draw', code?: string) => {
    const token = localStorage.getItem('telegram_token');
    if (!token) {
      // Если TG не привязан и есть промокод — сохраняем для отправки позже
      if (result === 'win' && code) {
        setPendingPromoCode(code);
        localStorage.setItem('pending_promo_code', code);
      }
      return;
    }

    try {
      // Отправляем результат напрямую, без проверки connected
      const response = await fetch(`${API_URL}/api/game-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, result, promoCode: code }),
      });
      
      const data = await response.json();
      
      // Если токен не найден — сохраняем код для отправки позже
      if (!response.ok && data.connected === false) {
        if (result === 'win' && code) {
          setPendingPromoCode(code);
          localStorage.setItem('pending_promo_code', code);
        }
        return;
      }
      
      // Очищаем pending если отправили
      if (result === 'win') {
        setPendingPromoCode(null);
        localStorage.removeItem('pending_promo_code');
      }
    } catch (error) {
      console.error('Ошибка отправки в Telegram:', error);
      // Сохраняем код если не удалось отправить
      if (result === 'win' && code) {
        setPendingPromoCode(code);
        localStorage.setItem('pending_promo_code', code);
      }
    }
  };

  // Отправить отложенный промокод после привязки TG
  const sendPendingPromoCode = async () => {
    const token = localStorage.getItem('telegram_token');
    const pending = localStorage.getItem('pending_promo_code');
    if (!token || !pending) return;

    try {
      const response = await fetch(`${API_URL}/api/game-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, result: 'win', promoCode: pending }),
      });
      
      if (response.ok) {
        setPendingPromoCode(null);
        localStorage.removeItem('pending_promo_code');
      }
    } catch (error) {
      console.error('Ошибка отправки отложенного промокода:', error);
    }
  };

  // Проверяем отложенный промокод при загрузке и периодически
  useEffect(() => {
    const pending = localStorage.getItem('pending_promo_code');
    if (pending) {
      setPendingPromoCode(pending);
    }

    // Проверяем каждые 3 секунды если есть отложенный код
    const interval = setInterval(() => {
      if (localStorage.getItem('pending_promo_code')) {
        sendPendingPromoCode();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // AI move with smart logic (с подкруткой для маркетинга)
  const makeComputerMove = (currentBoard: Board): number => {
    const availableMoves = currentBoard
      .map((cell, index) => (cell === null ? index : null))
      .filter((index) => index !== null) as number[];

    // После 1-2 проигрышей — бот играет слабо (даёт выиграть)
    const shouldLetWin = stats.lossStreak >= 1 && stats.wins === 0;

    if (shouldLetWin) {
      // Слабая игра: НЕ блокируем игрока, делаем случайный ход
      // Но если можем выиграть — не выигрываем (пропускаем)
      const playerWinningMove = findWinningMove(currentBoard, 'X');

      // Выбираем случайную клетку, избегая блокировки игрока
      const weakMoves = availableMoves.filter((m) => m !== playerWinningMove);
      if (weakMoves.length > 0) {
        return weakMoves[Math.floor(Math.random() * weakMoves.length)];
      }
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Обычная умная игра
    // Check if computer can win
    const winningMove = findWinningMove(currentBoard, 'O');
    if (winningMove !== -1) return winningMove;

    // Block player from winning
    const blockingMove = findWinningMove(currentBoard, 'X');
    if (blockingMove !== -1) return blockingMove;

    // Take center if available
    if (currentBoard[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter((i) => currentBoard[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const findWinningMove = (currentBoard: Board, player: Player): number => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      const cells = [currentBoard[a], currentBoard[b], currentBoard[c]];
      const indices = [a, b, c];
      
      if (cells.filter(cell => cell === player).length === 2 && cells.includes(null)) {
        return indices[cells.indexOf(null)];
      }
    }

    return -1;
  };

  // Handle player move
  const handleCellClick = (index: number) => {
    if (board[index] !== null || !isPlayerTurn || winner !== null) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      handleGameEnd(gameWinner);
    }
  };

  // Computer turn
  useEffect(() => {
    if (!isPlayerTurn && winner === null) {
      const timer = setTimeout(() => {
        const move = makeComputerMove(board);
        const newBoard = [...board];
        newBoard[move] = 'O';
        setBoard(newBoard);
        setIsPlayerTurn(true);

        const gameWinner = checkWinner(newBoard);
        if (gameWinner) {
          handleGameEnd(gameWinner);
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const handleGameEnd = (gameWinner: 'X' | 'O' | 'draw') => {
    if (gameWinner === 'X') {
      setWinner('player');
      
      // Промокод только на первую победу в сессии
      if (!stats.promoCodeUsed) {
        const code = generatePromoCode();
        setPromoCode(code);
        setStats((prev) => ({ ...prev, wins: prev.wins + 1, lossStreak: 0, promoCodeUsed: true }));
        sendToTelegram('win', code);
      } else {
        setPromoCode('');
        setStats((prev) => ({ ...prev, wins: prev.wins + 1, lossStreak: 0 }));
      }
    } else if (gameWinner === 'O') {
      setWinner('computer');
      setStats((prev) => ({
        ...prev,
        losses: prev.losses + 1,
        lossStreak: prev.lossStreak + 1,
      }));
      sendToTelegram('lose');
    } else {
      setWinner('draw');
      setStats((prev) => ({ ...prev, lossStreak: prev.lossStreak + 1 }));
      sendToTelegram('draw');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setPromoCode('');
  };

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-between p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #D4AF7A 0%, transparent 70%)' }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #E8D5E8 0%, transparent 70%)' }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <motion.div 
        className="max-w-md w-full relative z-10 flex flex-col h-full justify-between py-2 sm:py-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="space-y-4">
          {/* Header */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#D4AF7A]" />
              <h1 className="text-3xl sm:text-4xl text-[#5A4A4A]">Крестики-нолики</h1>
              <Sparkles className="w-5 h-5 text-[#D4AF7A]" />
            </div>
            <p className="text-[#8B7B7B] font-light text-sm mb-2">Изысканная игра для победительниц</p>
            <p className="text-xs text-[#D4AF7A] font-medium px-4">
              После победы получите промокод на скидку в личные сообщения!
            </p>
          </motion.div>

          {/* Controls Row */}
          <div className="flex gap-3 justify-center items-stretch h-10">
            <motion.button
              onClick={resetGame}
              className="flex-1 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-[#D4AF7A] text-[#5A4A4A] hover:bg-[#D4AF7A] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm whitespace-nowrap px-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw className="w-4 h-4" />
              Новая игра
            </motion.button>
            <div className="flex-1">
               <TelegramSettings className="w-full h-full border-2 border-[#D4AF7A]/50 bg-white/40" />
            </div>
          </div>

          {/* Stats */}
          <motion.div 
            className="flex justify-center gap-8 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="text-center">
              <div className="text-xl text-[#D4AF7A]">{stats.wins}</div>
              <div className="text-xs text-[#8B7B7B]">Побед</div>
            </div>
            <div className="w-px bg-[#D4A5A5] opacity-30" />
            <div className="text-center">
              <div className="text-xl text-[#D4A5A5]">{stats.losses}</div>
              <div className="text-xs text-[#8B7B7B]">Проигрышей</div>
            </div>
          </motion.div>
        </div>

        {/* Game Board */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
             <GameBoard 
              board={board} 
              onCellClick={handleCellClick}
              isPlayerTurn={isPlayerTurn}
              winner={winner}
            />
        </div>

      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {winner === 'player' && (
          <WinModal 
            key="win-modal"
            promoCode={promoCode} 
            onClose={resetGame}
          />
        )}

        {winner === 'computer' && (
          <LoseModal key="lose-modal" onPlayAgain={resetGame} />
        )}

        {winner === 'draw' && (
          <LoseModal key="draw-modal" onPlayAgain={resetGame} isDraw />
        )}
      </AnimatePresence>
    </div>
  );
}
