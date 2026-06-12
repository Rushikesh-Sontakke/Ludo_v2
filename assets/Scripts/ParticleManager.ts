// ParticleManager.ts
// Handles spawning all the particle effects for the 5% VFX rubric line!
//
// EDITOR SETUP:
// 1. Create an Empty Node called "ParticleManager" (put it at the bottom of the board so it renders on top).
// 2. Attach this script to it and drag your GameManager into the 'game' slot.
// 3. Create 5 Prefabs containing cc.ParticleSystem components (using the built-in textures).
// 4. Drag those prefabs into the corresponding slots below.

import { GameEvent } from "./Types";
import GameManager from "./GameManager";
import Piece from "./Piece";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ParticleManager extends cc.Component {

    @property({ type: GameManager })
    game: GameManager = null;

    @property({ type: cc.Prefab, tooltip: "Spawned when a piece is captured" })
    captureBurstPrefab: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "Spawned when an ability is used" })
    abilitySparklePrefab: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "Spawned when the dice rolls" })
    diceDustPrefab: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "Spawned when a piece reaches home" })
    homeSparklePrefab: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "Spawned when a player wins" })
    winConfettiPrefab: cc.Prefab = null;

    start() {
        if (!this.game) return;
        
        // Ensure particles render on top of EVERYTHING else!
        this.node.zIndex = 999;

        const ev = this.game.events;
        
        // Listen to all the game events to spawn the correct particles!
        ev.on(GameEvent.PIECE_CAPTURED, this._onPieceCaptured, this);
        ev.on(GameEvent.PIECE_HOME, this._onPieceHome, this);
        ev.on(GameEvent.DICE_ROLLED, this._onDiceRolled, this);
        ev.on(GameEvent.ABILITY_USED, this._onAbilityUsed, this);
        ev.on(GameEvent.GAME_WON, this._onGameWon, this);
    }

    /** Spawns a particle prefab directly over an existing node on the board. */
    private _spawnAtNode(prefab: cc.Prefab, targetNode: cc.Node, duration: number = 2) {
        if (!prefab || !targetNode) return;
        const node = cc.instantiate(prefab);
        
        // Attach directly to the target's parent (e.g. the board or the pieces folder)
        // so it guaranteed renders on top of the board!
        targetNode.parent.addChild(node);
        node.zIndex = 999;
        
        node.setPosition(targetNode.position);
        
        // Reset the particle system just in case
        const ps = node.getComponent(cc.ParticleSystem);
        if (ps) ps.resetSystem();
        
        // Auto-destroy the particle node after the duration so they don't pile up in memory
        this.scheduleOnce(() => {
            if (cc.isValid(node)) node.destroy();
        }, duration);
    }

    /** Spawns a particle prefab at a specific local coordinate. */
    private _spawnAtPos(prefab: cc.Prefab, localPos: cc.Vec2, duration: number = 2) {
        if (!prefab) return;
        const node = cc.instantiate(prefab);
        
        // Attach directly to the board so it's not hidden!
        const board = cc.find("flat_board2") || this.node;
        board.addChild(node);
        node.zIndex = 999;
        
        node.setPosition(localPos);
        
        const ps = node.getComponent(cc.ParticleSystem);
        if (ps) ps.resetSystem();
        
        this.scheduleOnce(() => {
            if (cc.isValid(node)) node.destroy();
        }, duration);
    }

    private _onPieceCaptured(piece: Piece) {
        // Spawn burst exactly where the piece was captured
        this._spawnAtNode(this.captureBurstPrefab, piece.node, 2);
    }

    private _onPieceHome(piece: Piece) {
        // Spawn sparkle exactly where the piece landed
        this._spawnAtNode(this.homeSparklePrefab, piece.node, 2);
    }

    private _onDiceRolled(value: number) {
        if (this.game && this.game.dice) {
            // Spawn dust right where the dice is
            this._spawnAtNode(this.diceDustPrefab, this.game.dice.node, 2);
        }
    }

    private _onAbilityUsed(data: { id: string, piece?: Piece }) {
        if (!this.game) return;
        
        if (data.piece) {
            // Targetable ability (Shield) -> Spawn directly on the piece they clicked!
            this._spawnAtNode(this.abilitySparklePrefab, data.piece.node, 2);
        } else if (data.id === "double") {
            // Double Move applies to whatever piece they move NEXT.
            // Let's spawn it ONLY on pieces that can legally move with the current dice roll!
            const movablePieces = this.game.getLegalMoves(this.game.currentColor, this.game.currentRoll);
            for (const p of movablePieces) {
                this._spawnAtNode(this.abilitySparklePrefab, p.node, 2);
            }
        } else {
            // Re-Roll -> Just spawn in the middle of the board
            this._spawnAtPos(this.abilitySparklePrefab, cc.v2(0, 0), 2);
        }
    }

    private _onGameWon(color: number) {
        // Confetti rains down from near the top of the screen!
        this._spawnAtPos(this.winConfettiPrefab, cc.v2(0, 200), 5);
    }
}
