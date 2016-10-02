const CompositeDisposable = require('atom').CompositeDisposable;
const notifier = require('atom-notify')('');

const parse = require('./parse');
const path = require('path');

const bemToolsCreate = require('bem-tools-create');
const naming = require('bem-naming')();

module.exports = {
    subscriptions: null,
    activate: function () {
        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atom-bem-create:create': () => {
                return this.create();
            },
            'atom-bem-create:createModal': () => {
                return this.createModal();
            }
        }));

        atom.contextMenu.itemSets.push({
            items: [
                { type: 'separator' },
                { 'label': 'bem-create', 'command': 'atom-bem-create:createModal' },
                { type: 'separator' }
            ],
            selector: '.tree-view.full-menu .project-root'
        });

        return this.subscriptions;
    },
    deactivate: function () {
        return this.subscriptions.dispose();
    },
    create: function () {
        const editor = atom.workspace.getActiveTextEditor();
        const caretPos = editor.getCursorBufferPosition();
        const level = path.dirname(editor.getPath());
        const selection = editor.getSelectedText();

        if (selection) {
            parse.fromSelection(selection).then((entity) => {
                this.bemCreate(entity || selection, level);
            })
        } else {
            parse.underCursor(editor.getText(), caretPos).then((entity) => {
                this.bemCreate(
                    entity || editor.getWordUnderCursor({wordRegex: /[a-z0-9_-]+/i}),
                    level
                );
            })
        }
    },

    bemCreate: function (bemName, level) {
        const bemEntity = (typeof bemName == 'string') ? bemName : naming.stringify(bemName);

        const rx = /\.{.*}/;
        const nameEntity = bemEntity.replace(rx, '');

        let tech = (bemEntity.match(rx) || [])[0];

        const successMsg = 'Success: Block created\nBlock name: ' + nameEntity + '\nWith tech: '
            + (tech ? tech.match(/\.{(.+)}/)[1] : 'all tech');

        if (naming.validate(nameEntity)) {
            notifier.addSuccess(successMsg);

            console.log('bemEntity level', bemEntity, level, tech); // TODO: debug

            if (!tech) {
                // if not bem-config and user don't write tech
                tech = ['css', 'js', 'bemhtml.js', 'bemtree.js', 'deps.js'];

                return bemToolsCreate(bemEntity, [level], tech)
            }

            return bemToolsCreate(bemEntity, [level])
        }

        return null;
    },

    createModal: function () {
        const pathDialog = document.querySelector('.tree-view .selected').getPath();
        const CreateDialog = require('./create-dialog');
        new CreateDialog(pathDialog).attach();
    }
};
