const CompositeDisposable = require('atom').CompositeDisposable;
const notifier = require('atom-notify')('');

const parse = require('./parse');
const path = require('path');
const common = require('../common/common');

const dirpath = common.dirpath;
const normalizeDir = common.normalizeDir;

const bemToolsCreate = require('bem-tools-create');
const bemConfig = require('./bem-config'); // bem-config wrapper
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
                { label: 'bem-create: Create block', command: 'atom-bem-create:createModal' },
                { type: 'separator' }
            ],
            selector: '.tree-view.full-menu .project-root'
        });

        return this.subscriptions;
    },

    deactivate: function () {
        return this.subscriptions.dispose();
    },

    /**
     * Create bem files by bemjson or bemslug in the opened text file
     * @public
     */
    create: function () {
        const editor = atom.workspace.getActiveTextEditor();
        const caretPos = editor.getCursorBufferPosition();
        const levelPath = dirpath(editor.getPath());
        const selection = editor.getSelectedText();

        if (selection) {
            parse.fromSelection(selection).then((entity) => {
                this.bemCreate(entity || selection, levelPath);
            })
        } else {
            parse.underCursor(editor.getText(), caretPos).then((entity) => {
                this.bemCreate(
                    entity || editor.getWordUnderCursor({wordRegex: /[a-z0-9_-]+/i}),
                    levelPath
                );
            })
        }
    },

    /**
     * bem-tools-create sdk wrapper.
     * validate & indicate
     * @private
     */
    bemCreate: function (bemName, levelPath) {
        const bemEntity = (typeof bemName == 'string') ? bemName : naming.stringify(bemName);

        const rx = /\.{(.*)}/;
        const nameEntity = bemEntity.replace(rx, '');

        const techsStr = (bemEntity.match(rx) || [])[1] // user input techs
        const techsPresentation = techsStr || 'default techs';
        const techs = techsStr ? techsStr.split(/,\s*/)
            : ['js', 'css', 'deps.js']; // Default techs in case of bem-config is not exist

        const successMsg = `Success: Block created\nBlock name: ${nameEntity}\nWith techs: ${techsPresentation}`;

        if (!naming.validate(nameEntity)) {
            return Promise.reject('Not valid BEM name');
        }

        const cwd = normalizeDir(dirpath(levelPath))

        console.log('bem tools create', bemEntity, null, techs, {cwd:cwd}); // TODO: debug
        notifier.addSuccess(successMsg);
        return bemToolsCreate(bemEntity, null, techs, { cwd: cwd });
    },

    /**
     * @public
     */
    createModal: function () {
        const levelPath = document.querySelector('.tree-view .selected').getPath();
        const CreateDialog = require('./create-dialog');
        new CreateDialog((bemName) => this.bemCreate(bemName, levelPath)).attach();
    }
};
