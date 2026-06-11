declare const firebase: any; // loaded via <script> tags in index.html

const { ccclass } = cc._decorator;

// Paste YOUR project's config here (Firebase console → Project settings → Your apps → Web app)
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
    private _googleProvider: any = null;

    onLoad() {
        if (FirebaseManager.instance) { this.node.destroy(); return; }
        FirebaseManager.instance = this;
        cc.game.addPersistRootNode(this.node);
        this.tryInit();
    }

    private tryInit(): boolean {
        if (this._auth) return true;
        if (typeof firebase === "undefined") return false;
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        this._auth = firebase.auth();
        this._googleProvider = new firebase.auth.GoogleAuthProvider();
        return true;
    }

    get auth(): any { return this._auth; }
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
}
