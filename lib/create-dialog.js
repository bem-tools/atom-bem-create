const Dialog = require('./dialog');
const AtomBemCreate = require('./atom-bem-create');

module.exports = class CreateDialog extends Dialog {
    constructor(path) {
        super({
            prompt: "Enter BEM name",
            select: false
        });
        this._path = path;
    }

    onConfirm(bemName) {
        const result = AtomBemCreate.bemCreate(bemName, this._path);
        result ? this.close() : this.showError('Not valid BEM name! Input [a-z0-9_-{}] symbols, please!');
    }
};
