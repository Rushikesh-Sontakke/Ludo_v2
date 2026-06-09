// AIController.ts
// OPTIONAL advanced feature (Enemy AI, 0~6% of the 20% advanced section).
// A simple but sensible bot: on its turn it rolls, then picks the move that
// best advances the bot, with a basic priority that captures when possible.
//
// EDITOR SETUP: assign `game` and list which turnOrder colors are AI-controlled.
// AIController listens for TURN_CHANGED and, if it's an AI player's turn, plays
// automatically using the same public GameManager API a human would.

import GameManager from "./GameManager";
import { GameEvent, PlayerColor, SAFE_RING_CELLS } from "./Types";
import Piece from "./Piece";
import BoardManager from "./BoardManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AIController extends cc.Component {

    @property({ type: GameManager }) game: GameManager = null;

    @property({ type: [cc.Integer], tooltip: "Colors controlled by AI, e.g. [1,3]" })
    aiColors: number[] = [PlayerColor.Green, PlayerColor.Yellow];

    @property({ tooltip: "Delay between AI actions (seconds) so moves are readable" })
    thinkTime = 0.6;

    onLoad() {
        this.game.events.on(GameEvent.TURN_CHANGED, this._onTurnChanged, this);
    }

    private _isAI(color: PlayerColor): boolean {
        return this.aiColors.indexOf(color) >= 0;
    }

    private _onTurnChanged(color: PlayerColor) {
        if (this._isAI(color)) {
            this.scheduleOnce(() => this._takeTurn(), this.thinkTime);
        }
    }

    private async _takeTurn() {
        await this.game.onRollPressed();          // roll + (if no move) auto-pass
        // If a move is pending selection, the state is WaitingSelect.
        const roll = this.game.currentRoll;
        const legal = this.game.getLegalMoves(this.game.currentColor, roll);
        if (legal.length === 0) return;            // GameManager already passed

        const best = this._chooseMove(legal, roll);
        this.scheduleOnce(() => this.game.onPieceClicked(best), this.thinkTime);
    }

    /** Heuristic: prefer a capturing move; else advance the furthest legal piece;
     *  prefer leaving base on a 6 to get more tokens in play. */
    private _chooseMove(legal: Piece[], roll: number): Piece {
        const board = BoardManager.instance;
        let capturing: Piece = null;
        let furthest: Piece = legal[0];
        let leaveBase: Piece = null;

        for (const p of legal) {
            if (p.isInBase()) { leaveBase = p; continue; }
            // Would landing capture an enemy?
            const landCell = board.getRingCell(p.color, p.progress + roll);
            if (landCell >= 0 && SAFE_RING_CELLS.indexOf(landCell) < 0) {
                for (const c of this.aiColors.length ? [0, 1, 2, 3] : []) {
                    if (c === p.color) continue;
                    for (const e of this.game.getPieces(c as PlayerColor)) {
                        if (e.isInBase() || e.isFinished() || e.isShielded) continue;
                        if (board.getRingCell(e.color, e.progress) === landCell) capturing = p;
                    }
                }
            }
            if (p.progress > furthest.progress) furthest = p;
        }
        if (capturing) return capturing;
        if (leaveBase && roll === 6) return leaveBase;
        return furthest;
    }
}
