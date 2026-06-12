/** Carries the Firestore save document from LoginScene into the game scene. */
export default class SaveBridge {
    /** Set by LoginController after a successful loadSave(). Null = new game. */
    public static pendingSave: any | null = null;
}
