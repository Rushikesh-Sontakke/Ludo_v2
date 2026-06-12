# Battle Ludo

A polished take on classic Ludo, built with **Cocos Creator 2.4.8** and **TypeScript**. Roll a physics-driven dice, race your four pieces around the board, capture enemies, and turn the tide with special abilities — locally against friends or against an AI opponent.

## Features

- **Classic Ludo rules** — roll a 6 to leave base, move tile-by-tile around the 52-cell ring, bring all 4 pieces home to win. Safe tiles protect against capture.
- **Physics dice** — the die drops, bounces, and settles using the Cocos physics engine (rigidbody + colliders), then snaps to the rolled face.
- **Capture system** — land on an enemy piece (off a safe tile) and it's sent back to base, with a particle burst.
- **Abilities** — beyond moving, players can use:
  - **Shield** — make a piece immune to capture for a turn
  - **Double Move** — move a piece twice the dice value
  - **Re-Roll** — discard the current roll and roll the dice again
- **Local multiplayer** — 2–4 players, hot-seat on a single screen.
- **AI opponent** — optional bot players that capture when possible, otherwise advance their best piece (`AIController`).
- **Firebase integration** — email/password accounts (sign up / login) and a per-account cloud save slot.
- **Audio & VFX** — per-scene background music, distinct sound effects (dice roll, move, capture, ability, win), and particle effects for captures, abilities, dice landings, home arrivals, and victory.
- **Animated, juicy presentation** — tweened piece hops, character idle/walk animations, scene fade transitions, opening and win/lose animations.

## Game Flow

```
LoginScene → RegisterScene (new accounts)
     ↓
MainScene  — title, play, settings (volume)
     ↓
game       — the board: roll, move, capture, abilities
     ↓
Win/Fail overlay → play again or return home
```

Scenes live in [assets/scenes/](assets/scenes/): `LoginScene.fire`, `RegisterScene.fire`, `MainScene.fire`, and `game.fire`.

## Project Structure

```
assets/
  scenes/        Login, Register, Main menu, and Game scenes
  Scripts/       All game logic (TypeScript)
  prefabs/       Piece, UI, and particle prefabs
  audio/         BGM and SFX
  fonts/         UI fonts
  ...            Art packs (dice, characters, GUI, boards)
build/           Web builds (output)
```

### Key scripts ([assets/Scripts/](assets/Scripts/))

| Script | Responsibility |
| --- | --- |
| `GameManager.ts` | Turn order, roll handling, move validation, win condition; enables physics + collision managers |
| `BoardManager.ts` | The 52-cell main ring, home columns, and base slots; tile lookups |
| `Piece.ts` | Piece state and tweened tile-by-tile movement |
| `Dice.ts` | Physical dice roll and face resolution |
| `AbilitySystem.ts` | Shield, Double Move, and Re-Roll abilities |
| `AIController.ts` | Bot opponent decision-making |
| `UIManager.ts` | HUD, pause/resume, win/fail overlays, scene transitions |
| `FirebaseManager.ts` | Auth (sign up / sign in) and per-user cloud save (Firestore) |
| `AudioManager.ts` | Persistent BGM + SFX playback |
| `ParticleManager.ts` | Particle effects |
| `Types.ts` | Shared enums/constants (colors, entry offsets, safe tiles) |

## Getting Started

### Prerequisites

- [Cocos Creator **2.4.x**](https://www.cocos.com/en/creator-download) (project was built with 2.4.8)
- A [Firebase](https://console.firebase.google.com) project (for accounts and cloud saves)
- Node.js (for the Firebase hosting CLI)

### Run in the editor

1. Clone the repo and open the project folder in Cocos Creator 2.4.x.
2. Set up Firebase:
   - Create a Firebase project, enable **Email/Password Authentication** and **Cloud Firestore**.
   - Update the `FIREBASE_CONFIG` object in `FirebaseManager.ts` with your web app config. The Firebase SDK is loaded via `<script>` tags in `index.html`.
3. Open `assets/scenes/LoginScene.fire` (or `MainScene.fire`) and press **Play**.

### Build & deploy

1. In Cocos Creator: **Project → Build** → choose **Web Mobile** (outputs to `build/web-mobile`).
2. Deploy to Firebase Hosting (configured in [firebase.json](firebase.json)):
   ```
   firebase deploy
   ```

## How to Play

1. **Sign up or log in**, then hit **Play** from the main menu.
2. On your turn, press **Roll** — the dice physically tumbles and settles.
3. Movable pieces light up; **tap a highlighted piece** to move it.
   - You need a **6** to bring a piece out of base. Rolling a 6 grants another roll.
4. Land on an enemy piece (off a safe tile) to **capture** it and send it home.
5. Spend abilities (**Shield**, **Double Move**, **Re-Roll**) at the right moment to swing the game.
6. First player to get **all 4 pieces home** wins.

## Credits

Art and audio from free asset packs, including [Kenney](https://kenney.nl) (shape characters), CuteDice, and other CC0/free packs bundled under `assets/`.
