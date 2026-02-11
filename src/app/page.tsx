'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Gamepad2, Smartphone, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause } from 'lucide-react'

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SPEED = 150

type Position = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }])
  const directionRef = useRef<Direction>('RIGHT')
  const foodRef = useRef<Position>({ x: 15, y: 10 })
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const speedRef = useRef(INITIAL_SPEED)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const generateFood = useCallback(() => {
    const snake = snakeRef.current
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    foodRef.current = newFood
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#16213e'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw food with glow effect
    const food = foodRef.current
    ctx.shadowBlur = 15
    ctx.shadowColor = '#ff6b6b'
    ctx.fillStyle = '#ff6b6b'
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    )
    ctx.shadowBlur = 0

    // Draw snake
    const snake = snakeRef.current
    snake.forEach((segment, index) => {
      const isHead = index === 0
      
      // Gradient color from head to tail
      const greenIntensity = Math.floor(255 - (index * 5))
      ctx.fillStyle = isHead ? '#4ade80' : `rgb(34, ${Math.max(greenIntensity, 100)}, 82)`
      
      if (isHead) {
        ctx.shadowBlur = 10
        ctx.shadowColor = '#4ade80'
      }
      
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )
      
      ctx.shadowBlur = 0

      // Draw eyes on head
      if (isHead) {
        ctx.fillStyle = '#1a1a2e'
        const eyeSize = 4
        const eyeOffset = 5
        
        switch (directionRef.current) {
          case 'RIGHT':
            ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, segment.y * CELL_SIZE + 4, eyeSize, eyeSize)
            ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, segment.y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize)
            break
          case 'LEFT':
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + 4, eyeSize, eyeSize)
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize)
            break
          case 'UP':
            ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize)
            ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize)
            break
          case 'DOWN':
            ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize)
            ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize)
            break
        }
      }
    })
  }, [])

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return

    const snake = snakeRef.current
    const head = { ...snake[0] }
    const direction = directionRef.current

    switch (direction) {
      case 'UP': head.y -= 1; break
      case 'DOWN': head.y += 1; break
      case 'LEFT': head.x -= 1; break
      case 'RIGHT': head.x += 1; break
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true)
      return
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true)
      return
    }

    // Add new head
    snakeRef.current = [head, ...snake]

    // Check food collision
    const food = foodRef.current
    if (head.x === food.x && head.y === food.y) {
      setScore(prev => {
        const newScore = prev + 10
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('snakeHighScore', newScore.toString())
        }
        // Increase speed every 50 points
        if (newScore % 50 === 0 && speedRef.current > 50) {
          speedRef.current -= 10
        }
        return newScore
      })
      generateFood()
    } else {
      // Remove tail if no food eaten
      snakeRef.current.pop()
    }

    draw()
  }, [gameOver, isPaused, highScore, generateFood, draw])

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }]
    directionRef.current = 'RIGHT'
    speedRef.current = INITIAL_SPEED
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
    setIsPaused(false)
    generateFood()
    draw()
  }, [generateFood, draw])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted) {
      if (e.key === ' ' || e.key === 'Enter') {
        startGame()
      }
      return
    }

    if (e.key === ' ') {
      setIsPaused(prev => !prev)
      return
    }

    if (gameOver) {
      if (e.key === ' ' || e.key === 'Enter') {
        startGame()
      }
      return
    }

    const currentDirection = directionRef.current

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (currentDirection !== 'DOWN') directionRef.current = 'UP'
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        if (currentDirection !== 'UP') directionRef.current = 'DOWN'
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (currentDirection !== 'RIGHT') directionRef.current = 'LEFT'
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (currentDirection !== 'LEFT') directionRef.current = 'RIGHT'
        break
    }
  }, [gameStarted, gameOver, startGame])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const dx = touchEnd.x - touchStartRef.current.x
    const dy = touchEnd.y - touchStartRef.current.y
    const minSwipeDistance = 30

    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
      // Tap - start game or toggle pause
      if (!gameStarted || gameOver) {
        startGame()
      } else {
        setIsPaused(prev => !prev)
      }
      return
    }

    const currentDirection = directionRef.current

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && currentDirection !== 'LEFT') {
        directionRef.current = 'RIGHT'
      } else if (dx < 0 && currentDirection !== 'RIGHT') {
        directionRef.current = 'LEFT'
      }
    } else {
      // Vertical swipe
      if (dy > 0 && currentDirection !== 'UP') {
        directionRef.current = 'DOWN'
      } else if (dy < 0 && currentDirection !== 'DOWN') {
        directionRef.current = 'UP'
      }
    }

    touchStartRef.current = null
  }, [gameStarted, gameOver, startGame])

  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10))
    }
    draw()
  }, [draw])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleKeyDown, handleTouchStart, handleTouchEnd])

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, speedRef.current)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, isPaused, moveSnake])

  return (
    <main className="min-h-screen bg-[#0f0f23] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-2 tracking-wider" style={{ fontFamily: 'monospace', textShadow: '0 0 20px #4ade80' }}>
          RETRO SNAKE
        </h1>
        <div className="flex justify-center gap-8 text-lg">
          <p className="text-green-300">
            Score: <span className="font-bold text-white">{score}</span>
          </p>
          <p className="text-yellow-400">
            High: <span className="font-bold text-white">{highScore}</span>
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-[400px]">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-green-500 rounded-lg shadow-[0_0_30px_rgba(74,222,128,0.3)] w-full h-auto"
        />

        {!gameStarted && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-2xl text-green-400 mb-4 font-mono">Press SPACE or Tap to Start</h2>
            <div className="text-gray-400 text-sm space-y-1">
              <p><Gamepad2 className="inline-block w-4 h-4 mr-1" /> Arrow keys or WASD to move</p>
              <p><Smartphone className="inline-block w-4 h-4 mr-1" /> Swipe on mobile</p>
              <p><Pause className="inline-block w-4 h-4 mr-1" /> Space to pause</p>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-3xl text-red-500 mb-2 font-mono">GAME OVER</h2>
            <p className="text-xl text-white mb-4">Final Score: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 mb-4 animate-pulse"><Trophy className="inline-block w-5 h-5 mr-1" /> New High Score!</p>
            )}
            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-3xl text-yellow-400 mb-4 font-mono">PAUSED</h2>
            <p className="text-gray-400">Press SPACE or Tap to continue</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 md:hidden">
        <button
          onClick={() => directionRef.current !== 'DOWN' && (directionRef.current = 'UP')}
          className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center active:bg-green-500"
        >
          <ArrowUp className="w-7 h-7 text-white" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => directionRef.current !== 'RIGHT' && (directionRef.current = 'LEFT')}
            className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center active:bg-green-500"
          >
            <ArrowLeft className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={() => directionRef.current !== 'UP' && (directionRef.current = 'DOWN')}
            className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center active:bg-green-500"
          >
            <ArrowDown className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={() => directionRef.current !== 'LEFT' && (directionRef.current = 'RIGHT')}
            className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center active:bg-green-500"
          >
            <ArrowRight className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>

      <footer className="mt-8 text-gray-500 text-sm">
        Made with love by Gaspi
      </footer>
    </main>
  )
}
