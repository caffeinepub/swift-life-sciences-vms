import { useMemo } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

// Generate a visually convincing QR code pattern using SVG
export function QRCodeDisplay({ value, size = 120 }: QRCodeDisplayProps) {
  const modules = useMemo(() => {
    const gridSize = 21;
    const grid: boolean[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(false));

    const addFinderPattern = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (
            (isOuter || isInner) &&
            row + r < gridSize &&
            col + c < gridSize
          ) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };

    addFinderPattern(0, 0);
    addFinderPattern(0, gridSize - 7);
    addFinderPattern(gridSize - 7, 0);

    for (let i = 8; i < gridSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) & 0xffffffff;
    }

    const rng = (seed: number) => {
      let s = seed;
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return Math.abs(s);
    };

    let seed = hash;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isFinderZone =
          (r < 8 && c < 8) ||
          (r < 8 && c >= gridSize - 8) ||
          (r >= gridSize - 8 && c < 8);
        const isTimingRow = r === 6;
        const isTimingCol = c === 6;
        if (!isFinderZone && !isTimingRow && !isTimingCol) {
          seed = rng(seed + r * gridSize + c);
          grid[r][c] = seed % 3 !== 0;
        }
      }
    }

    return grid;
  }, [value]);

  const cellSize = size / 21;

  // Build a flat list of active cells to avoid index-key issues
  const activeCells = useMemo(() => {
    const cells: { row: number; col: number }[] = [];
    for (let r = 0; r < modules.length; r++) {
      for (let c = 0; c < modules[r].length; c++) {
        if (modules[r][c]) {
          cells.push({ row: r, col: c });
        }
      }
    }
    return cells;
  }, [modules]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated" }}
      aria-label={`QR code for ${value}`}
      role="img"
    >
      <rect width={size} height={size} fill="white" />
      {activeCells.map((cell) => (
        <rect
          key={`qr-${cell.row}-${cell.col}`}
          x={cell.col * cellSize}
          y={cell.row * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#111827"
        />
      ))}
    </svg>
  );
}
