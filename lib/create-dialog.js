const Dialog = require('./dialog');

module.exports = class CreateDialog extends Dialog {
    constructor(bemCreate) {
        super({
            prompt: "Enter BEM name",
            select: false
        });
        this._bemCreate = bemCreate;
    }

    onConfirm(bemName) {
        this._bemCreate(bemName)
            .then(this.close())
            .catch(e => this.showError(`😨 ${e}\nRead http://bit.ly/a-b-create for the reference!`))
    }
};
