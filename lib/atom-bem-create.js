var CompositeDisposable = require('atom').CompositeDisposable;

module.exports = {
    subscriptions: null,
    activate: function(state) {
        var _this = this;

        this.subscriptions = new CompositeDisposable;
        return this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atom-bem-create:create': function() {
                return _this.create();
            }
        }));
    },
    deactivate: function() {
        return this.subscriptions.dispose();
    },
    create: function() {
        var editor = atom.workspace.getActiveTextEditor();

        if (!editor) return;

        var bemNaming = require('bem-naming'),
            naming = bemNaming(),
            bemCreate = require('bem-tools-create'),
            selection = editor.getSelectedText(),
            caretPos = editor.getCursorBufferPosition(),
            rangeBeforeCaret = [[0, 0], caretPos],
            textBeforeCaret = editor.getTextInBufferRange(rangeBeforeCaret);

        if (selection && !(new RegExp(selection + '$')).test(textBeforeCaret)) {
            rangeBeforeCaret = [[0, 0], [caretPos.row, caretPos.column + selection.length]];
            textBeforeCaret += selection;
        }

        if (!selection) {
            var textBeforeCaretNoSpaces = textBeforeCaret.replace(/\{(.*)\}/g, function(str) {
                return str.replace(/\ /g, 'S');
            });

            var lastSpaceSymbol = /\s/.exec(textBeforeCaretNoSpaces.split('').reverse().join('')),
                spaceNearCaretIdx = lastSpaceSymbol && textBeforeCaretNoSpaces.lastIndexOf(lastSpaceSymbol[0]);

            selection = ((typeof spaceNearCaretIdx !== null && spaceNearCaretIdx > -1) ? textBeforeCaret.substr(spaceNearCaretIdx) : textBeforeCaret).trim();
        }

        var parentBlock = /block['"\s]*:(?:\s)?['"]{1}(.*?)['"]{1}/.exec(textBeforeCaret.substr(textBeforeCaret.lastIndexOf('block')));
        parentBlock && parentBlock[1] && (parentBlock = parentBlock[1]);

        naming.validate(selection) && bemCreate([naming.parse(selection)], ['.'], ['css', 'js']);
    },
    getEntities: function(selection) {
        if (selection.indexOf(':') < 0) return naming.parse(selection);

        var bemjson;
        try {
            bemjson = require('vm').runInNewContext('(' + selection + ')');
        } catch(err) {}

        return bemjson && bemjson2decl.convert(bemjson);
    }
};
