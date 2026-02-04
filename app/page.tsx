"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CELL_SIZE = 20;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const CANVAS_WIDTH = CELL_SIZE * GRID_WIDTH;
const CANVAS_HEIGHT = CELL_SIZE * GRID_HEIGHT;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 50;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef<Direction>("RIGHT");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
    } while (snakeBody.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameStarted(true);
  }, [generateFood]);

  const startGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && !gameOver) {
        startGame();
        return;
      }

      const keyDirectionMap: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        s: "DOWN",
        a: "LEFT",
        d: "RIGHT",
      };

      const newDirection = keyDirectionMap[e.key];
      if (!newDirection) return;

      e.preventDefault();

      const opposites: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };

      if (opposites[newDirection] !== directionRef.current) {
        directionRef.current = newDirection;
        setDirection(newDirection);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver, startGame]);

  // Handle touch controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        if (!gameStarted && !gameOver) {
          startGame();
        }
        return;
      }

      let newDirection: Direction;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDirection = deltaX > 0 ? "RIGHT" : "LEFT";
      } else {
        newDirection = deltaY > 0 ? "DOWN" : "UP";
      }

      const opposites: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };

      if (opposites[newDirection] !== directionRef.current) {
        directionRef.current = newDirection;
        setDirection(newDirection);
      }

      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gameStarted, gameOver, startGame]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const directionDeltas: Record<Direction, Position> = {
          UP: { x: 0, y: -1 },
          DOWN: { x: 0, y: 1 },
          LEFT: { x: -1, y: 0 },
          RIGHT: { x: 1, y: 0 },
        };

        const delta = directionDeltas[directionRef.current];
        const newHead: Position = {
          x: head.x + delta.x,
          y: head.y + delta.y,
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_WIDTH ||
          newHead.y < 0 ||
          newHead.y >= GRID_HEIGHT
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => {
            const newScore = prev + 10;
            // Increase speed every 50 points
            if (newScore % 50 === 0) {
              setSpeed((prevSpeed) => Math.max(MIN_SPEED, prevSpeed - SPEED_INCREMENT));
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [gameStarted, gameOver, food, generateFood, speed]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with dark gray background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid pattern (subtle)
    ctx.strokeStyle = "#252540";
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food (red pixel square)
    ctx.fillStyle = "#ff0040";
    ctx.shadowColor = "#ff0040";
    ctx.shadowBlur = 10;
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? "#00ff41" : "#00cc33";
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = isHead ? 8 : 4;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
    ctx.shadowBlur = 0;

    // Draw border
    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);
  }, [snake, food]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] font-mono">
      {/* Title */}
      <h1
        className="mb-4 text-4xl font-bold tracking-wider text-[#00ff41] md:text-5xl"
        style={{
          textShadow: "0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 30px #00ff41",
        }}
      >
        RETROSNAKE
      </h1>

      {/* Score Display */}
      <div
        className="mb-4 text-2xl font-bold text-[#00ff41]"
        style={{ textShadow: "0 0 5px #00ff41" }}
      >
        SCORE: {score.toString().padStart(4, "0")}
      </div>

      {/* Game Canvas Container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-[#00ff41] shadow-[0_0_20px_#00ff41]"
        />

        {/* Start Screen */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <p
              className="mb-4 text-xl text-[#00ff41]"
              style={{ textShadow: "0 0 5px #00ff41" }}
            >
              PRESS ANY KEY OR TAP TO START
            </p>
            <p className="text-sm text-[#00cc33]">Use arrow keys or swipe to move</p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <p
              className="mb-2 text-3xl font-bold text-[#ff0040]"
              style={{ textShadow: "0 0 10px #ff0040" }}
            >
              GAME OVER
            </p>
            <p
              className="mb-4 text-xl text-[#00ff41]"
              style={{ textShadow: "0 0 5px #00ff41" }}
            >
              FINAL SCORE: {score}
            </p>
            <button
              onClick={resetGame}
              className="border-2 border-[#00ff41] bg-transparent px-6 py-2 text-lg font-bold text-[#00ff41] transition-all hover:bg-[#00ff41] hover:text-[#0f0f1a] hover:shadow-[0_0_20px_#00ff41]"
              style={{ textShadow: "0 0 5px #00ff41" }}
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Controls Info */}
      <div className="mt-6 text-center text-sm text-[#666]">
        <p>Arrow keys / WASD to move</p>
        <p>Swipe on mobile</p>
      </div>

      {/* Speed Indicator */}
      <div className="mt-2 text-xs text-[#00cc33]">
        SPEED: {Math.round(((INITIAL_SPEED - speed) / (INITIAL_SPEED - MIN_SPEED)) * 100)}%
      </div>
    </div>
  );
}
