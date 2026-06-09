// Types.ts
// Shared enums / constants for Battle Ludo. Import these everywhere so the
// whole project agrees on player colors, progress model, and event names.

// 4 players. Values 0..3 are used as array indices throughout the project.
export enum PlayerColor {
    Red = 0,
    Blue = 1,
    Green = 2,
    Yellow = 3,
}

export const COLOR_COUNT = 4;
export const PIECES_PER_PLAYER = 4;

// ---- Progress model (read this once, the whole game depends on it) ----
// Each piece has a single number `progress`:
//   progress = 0           -> piece is in its BASE (yard). Needs a 6 to leave.
//   progress = 1 .. 51     -> on the shared 52-cell main RING.
//                            absolute ring cell = (entryOffset + progress - 1) % 52
//   progress = 52 .. 57    -> in this color's 6-cell HOME COLUMN (homeIdx = progress - 52)
//   progress = 57          -> FINAL home cell. Piece is DONE.
// A move of `n` is legal only if (progress + n) <= HOME_PROGRESS (no overshoot).
export const RING_SIZE = 52;
export const RING_LAST_PROGRESS = 51;     // last progress value still on the ring
export const HOME_PROGRESS = 57;          // progress value meaning "finished"
export const HOME_COLUMN_SIZE = 6;        // 52..57 inclusive = 6 cells

// Each color enters the ring at a different cell. Tune these to match your
// board art (these are the classic offsets for a standard board).
export const ENTRY_OFFSET: { [key in PlayerColor]: number } = {
    [PlayerColor.Red]: 0,
    [PlayerColor.Blue]: 13,
    [PlayerColor.Green]: 26,
    [PlayerColor.Yellow]: 39,
};

// Safe ring cells (absolute indices). A piece on a safe cell cannot be captured.
// Classic Ludo safe squares are the 4 entry cells + the 4 starred cells.
export const SAFE_RING_CELLS: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

// Global event names. We fire these on a shared EventTarget (GameManager.events)
// so UI / Audio / VFX can react without tight coupling.
export const GameEvent = {
    DICE_ROLLED: "dice-rolled",         // payload: number (1..6)
    PIECE_MOVED: "piece-moved",         // payload: Piece
    PIECE_CAPTURED: "piece-captured",   // payload: Piece (the one sent home)
    PIECE_HOME: "piece-home",           // payload: Piece (reached final cell)
    TURN_CHANGED: "turn-changed",       // payload: PlayerColor
    ABILITY_USED: "ability-used",       // payload: string (ability id)
    GAME_WON: "game-won",               // payload: PlayerColor
};
