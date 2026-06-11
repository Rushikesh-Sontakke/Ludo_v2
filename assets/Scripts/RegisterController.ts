const { ccclass, property } = cc._decorator;

@ccclass
export default class RegisterController extends cc.Component {

    @property(cc.EditBox)
    usernameEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    passwordEditBox: cc.EditBox = null;

    onEnterClick(): void {
        cc.director.loadScene("game");
    }
}
