// GameManager.ts
// The brain. Owns turn order, dice rolls, legal-move calculation, capture
// resolution, and the win check. Other systems (UI, Audio, VFX, AI) listen to
// the `events` EventTarget instead of calling into here directly.

import {
    PlayerColor, GameEvent, SAFE_RING_CELLS, HOME_PROGRESS,
} from "./Types";
import BoardManager from "./BoardManager";
import Piece from "./Piece";
import Dice from "./Dice";

const { ccclass, property } = cc._decorator;

enum TurnState { WaitingRoll, WaitingSelect, Moving, GameOver }

@ccclass
export default class GameManager extends cc.Component {

    @property({ type: Dice })
    dice: Dice = null;

    @property({ type: BoardManager })
    board: BoardManager = null;

    @property({ type: [cc.Node], tooltip: "All piece nodes in the scene (any order)" })
    pieceNodes: cc.Node[] = [];

    @property({ type: [cc.Integer], tooltip: "Active player colors this match, in turn order (e.g. [0,2] for Red vs Green)" })
    turnOrder: number[] = [PlayerColor.Red, PlayerColor.Blue, PlayerColor.Green, PlayerColor.Yellow];

    // Global event bus.
    public events: cc.EventTarget = new cc.EventTarget();
    public static instance: GameManager = null;

    // runtime
    private _piecesByColor: { [k: number]: Piece[] } = {};
    private _turnIndex = 0;
    private _state = TurnState.WaitingRoll;
    private _currentRoll = 0;

    // Ability hooks (set by AbilitySystem before a move resolves).
    public pendingDoubleMove = false;

    get currentColor(): PlayerColor { return this.turnOrder[this._turnIndex] as PlayerColor; }
    get currentRoll(): number { return this._currentRoll; }
    get state(): TurnState { return this._state; }

    onLoad() {
        GameManager.instance = this;

        // Enable BOTH engines (required for the 13% Physical Systems line).
        const phys = cc.director.getPhysicsManager();
        phys.enabled = true;
        phys.gravity = cc.v2(0, -640);            // gravity for the physical dice
        cc.director.getCollisionManager().enabled = true;
    }

    start() {
        // Index pieces by color and wire their click callback.
        for (const node of this.pieceNodes) {
            const p = node.getComponent(Piece);
            if (!p) continue;
            if (!this._piecesByColor[p.color]) this._piecesByColor[p.color] = [];
            this._piecesByColor[p.color].push(p);
            p.onClicked = (piece) => this.onPieceClicked(piece);
            p.snapToProgress();
        }
        this._beginTurn();
    }

    // ---------------------------------------------------------------- turn flow
    private _beginTurn() {
        this._state = TurnState.WaitingRoll;
        this._currentRoll = 0;
        this.events.emit(GameEvent.TURN_CHANGED, this.currentColor);
    }

    /** Hook the dice-roll UI button to this. */
    public async onRollPressed() {
        if (this._state !== TurnState.WaitingRoll) return;
        this._state = TurnState.Moving;

        const value = await this.dice.roll();
        this._currentRoll = value;
        this.events.emit(GameEvent.DICE_ROLLED, value);

        const legal = this.getLegalMoves(this.currentColor, value);
        if (legal.length === 0) {
            // No move possible — pass (unless a 6 with all pieces home, etc.)
            this._endTurn(value === 6);
            return;
        }
        // Highlight the movable pieces and wait for a click.
        this._state = TurnState.WaitingSelect;
        for (const p of legal) p.setHighlight(true);
    }

    private _clearHighlights() {
        const pieces = this._piecesByColor[this.currentColor] || [];
        for (const p of pieces) p.setHighlight(false);
    }

    public async onPieceClicked(piece: Piece) {
        if (this._state !== TurnState.WaitingSelect) return;
        if (piece.color !== this.currentColor) return;

        this._clearHighlights();
        this._state = TurnState.Moving;

        // Double Move ability doubles the dice value for THIS move only.
        let steps = this._currentRoll;
        if (this.pendingDoubleMove) {
            steps = this._currentRoll * 2;
            this.pendingDoubleMove = false;
        }

        await piece.moveStepByStep(steps);
        this.events.emit(GameEvent.PIECE_MOVED, piece);

        // Reaching the final home cell?
        if (piece.progress >= HOME_PROGRESS) {
            this.events.emit(GameEvent.PIECE_HOME, piece);
        } else {
            this.resolveCapture(piece);
        }

        // Shields last exactly one of the owner's turns: clear own shields now.
        // (Set fresh ones via AbilitySystem during the same turn if desired.)

        if (this._checkWin(this.currentColor)) {
            this._state = TurnState.GameOver;
            this.events.emit(GameEvent.GAME_WON, this.currentColor);
            return;
        }

        // Roll-again-on-6 rule.
        this._endTurn(this._currentRoll === 6);
    }

    private _endTurn(samePlayerAgain: boolean) {
        if (!samePlayerAgain) {
            this._turnIndex = (this._turnIndex + 1) % this.turnOrder.length;
            // Clear the new current player's expired shields at the start of their turn.
            const incoming = this._piecesByColor[this.currentColor] || [];
            for (const p of incoming) p.setShield(false);
        }
        this._beginTurn();
    }

    // ------------------------------------------------------------ rules helpers
    /** Pieces of `color` that can legally move with this roll. */
    public getLegalMoves(color: PlayerColor, roll: number): Piece[] {
        const pieces = this._piecesByColor[color] || [];
        const movable: Piece[] = [];
        for (const p of pieces) {
            if (p.isFinished()) continue;
            if (p.isInBase()) {
                if (roll === 6) movable.push(p);     // need a 6 to leave base
            } else if (p.progress + roll <= HOME_PROGRESS) {
                movable.push(p);                      // no overshoot past home
            }
        }
        return movable;
    }

    /** After a move settles, capture any unshielded enemy on the same ring cell. */
    public resolveCapture(mover: Piece) {
        const cell = this.board.getRingCell(mover.color, mover.progress);
        if (cell < 0) return;                         // in home column, no capture
        if (SAFE_RING_CELLS.indexOf(cell) >= 0) return; // safe square, no capture

        for (const colorKey of Object.keys(this._piecesByColor)) {
            const color = Number(colorKey) as PlayerColor;
            if (color === mover.color) continue;
            for (const enemy of this._piecesByColor[color]) {
                if (enemy.isInBase() || enemy.isFinished()) continue;
                if (enemy.isShielded) continue;
                const enemyCell = this.board.getRingCell(enemy.color, enemy.progress);
                if (enemyCell === cell) {
                    enemy.sendHomeToBase();
                    this.events.emit(GameEvent.PIECE_CAPTURED, enemy);
                }
            }
        }
    }

    private _checkWin(color: PlayerColor): boolean {
        const pieces = this._piecesByColor[color] || [];
        return pieces.length > 0 && pieces.every((p) => p.isFinished());
    }

    public getPieces(color: PlayerColor): Piece[] {
        return this._piecesByColor[color] || [];
    }
}
