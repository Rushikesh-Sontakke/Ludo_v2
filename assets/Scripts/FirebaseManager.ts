declare const firebase: any; // loaded via <script> tags in index.html

const { ccclass } = cc._decorator;

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyAIuBQZznYQPLWkrQHXLtixl1k1hK6wfsI",
    authDomain:        "battleludo-9bf7a.firebaseapp.com",
    projectId:         "battleludo-9bf7a",
    storageBucket:     "battleludo-9bf7a.firebasestorage.app",
    messagingSenderId: "883539620761",
    appId:             "1:883539620761:web:88c8bf6c6b41cf528b1908",
};

@ccclass
export default class FirebaseManager extends cc.Component {

    public static instance: FirebaseManager | null = null;
    private _auth: any = null;
    private _db: any = null;
    private _googleProvider: any = null;

    onLoad() {
        if (FirebaseManager.instance) { this.node.destroy(); return; }
        FirebaseManager.instance = this;
        cc.game.addPersistRootNode(this.node);
        this.tryInit();
    }

    private tryInit(): boolean {
        // BUG FIX: check both _auth AND _db, not just _auth.
        // If Firestore SDK wasn't loaded on the first try, _auth is set but _db
        // is null. The old guard (if _auth) returned true and skipped the db init.
        if (this._auth && this._db) return true;
        if (typeof firebase === "undefined") return false;
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        if (!this._auth) {
            this._auth = firebase.auth();
            this._googleProvider = new firebase.auth.GoogleAuthProvider();
        }
        if (!this._db) {
            if (typeof firebase.firestore !== "function") {
                console.error("[FirebaseManager] firebase-firestore-compat.js is NOT loaded. Firestore unavailable.");
                return false;
            }
            this._db = firebase.firestore();
            console.log("[FirebaseManager] Firestore initialized.");
        }
        return !!(this._auth && this._db);
    }

    get auth(): any { return this._auth; }
    get db(): any { return this._db; }
    get googleProvider(): any { return this._googleProvider; }

    get uid(): string | null {
        return this._auth?.currentUser?.uid ?? null;
    }

    // ------------------------------------------------------------------ auth
    public signUp(email: string, password: string): Promise<any> {
        if (!this._auth && !this.tryInit())
            return Promise.reject(new Error("[Firebase] SDK not loaded yet."));
        return this._auth.createUserWithEmailAndPassword(email, password);
    }

    public signIn(email: string, password: string): Promise<any> {
        if (!this._auth && !this.tryInit())
            return Promise.reject(new Error("[Firebase] SDK not loaded yet."));
        return this._auth.signInWithEmailAndPassword(email, password);
    }

    public signInWithGoogle(): Promise<any> {
        if (!this._auth && !this.tryInit())
            return Promise.reject(new Error("[Firebase] SDK not loaded yet."));
        return this._auth.signInWithPopup(this._googleProvider);
    }

    // --------------------------------------------------------------- Firestore
    /** Save current game state to users/{uid}. Overwrites any existing save. */
    public async saveGame(gameState: object): Promise<void> {
        const uid = this.uid;
        console.log("[saveGame] UID:", uid);
        if (!uid) throw new Error("[Firebase] Not signed in.");
        if (!this._db) this.tryInit();
        if (!this._db) throw new Error("[Firebase] Firestore not initialized — is firebase-firestore-compat.js loaded?");
        console.log("[saveGame] Writing to: users/" + uid);
        await this._db.collection("users").doc(uid).set({
            gameState,
            savedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        console.log("[saveGame] Firestore write SUCCESS.");
    }

    /** Returns the saved document for the current user, or null if none exists. */
    public async loadSave(): Promise<any | null> {
        const uid = this.uid;
        console.log("[loadSave] UID:", uid);
        if (!uid) return null;
        if (!this._db) this.tryInit();
        if (!this._db) return null;
        console.log("[loadSave] Reading from: users/" + uid);
        const snap = await this._db.collection("users").doc(uid).get();
        console.log("[loadSave] snap.exists:", snap.exists, "| data:", snap.exists ? JSON.stringify(snap.data()).slice(0, 120) : "NONE");
        return snap.exists ? snap.data() : null;
    }
}
