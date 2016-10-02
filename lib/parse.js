'use strict';

/**
 * @typedef {Object} PluralBemEntity
 * @property {String} block
 * @property {String} elem
 * @property {Object} mods
 * @property {Object} elemMods
 */

/**
 * @typedef {Object} SingleBemEntity
 * @property {String} block
 * @property {String} elem
 * @property {Object} modName
 * @property {Object} modVal
 */

const parse = require('acorn');
const traverse = require('estraverse');
const codegen = require('escodegen');
const bemNaming = require('bem-naming')();
const _ = require('lodash');
const color = require('chalk');

// todo: extract into external npm package
function debug(message) {
    if(!process.env.DEBUG) return;
    var log = console.log.bind(console, color.blue('debug> ') + message);
    log.apply(null, Array.from(arguments).splice(1))
}

// todo: extract into external npm package
function cursorPositionToOffset(text, cursor) {
    const lines = text.split(/\n/);
    const prelLines = cursor.row;
    const prevOffset = lines.splice(0, prelLines).join('\n').length;

    return prevOffset + cursor.column;
}

// todo: extract into external npm package
/**
 * @param {PluralBemEntity} pluralBemEntity
 * @returns {SingleBemEntity}
 */
function pluralBemEntityToSingle(pluralBemEntity) {
    var singleBemEntity = _.cloneDeep(pluralBemEntity);
    debug('pluralBemEntity', pluralBemEntity);
    if(singleBemEntity.modName) return singleBemEntity;

    ['mods', 'elemMods'].forEach((i)=> {
        if(!singleBemEntity.hasOwnProperty(i)) return;
        for(let j in singleBemEntity[i]) {
            singleBemEntity.modName = j;
            singleBemEntity.modVal = singleBemEntity[i][j];
            break;
        }
        delete singleBemEntity[i];
    });
    return singleBemEntity;
}

function isObject(node) {
    return node.type === 'ObjectExpression';
}

function isBemjson(node) {
    const bemKeys = ['block', 'elem'];
    return !!_(node.properties).map('key.name').intersection(bemKeys).size();
}

var hasToEnlargeLocalTreeSize = false;

function _onNode(node, parent) {
    var bemjson, bemName;
    const bemKeys = ['block', 'elem', 'mods', 'elemMods', 'modName', 'modVal'];
    if(isObject(node)) {
        if(isBemjson(node)) {
            bemjson = JSON.parse(codegen.generate(node, {format: {realjson: true}}));
            bemName = _(bemjson).pick(bemKeys);
            return bemName.size() && pluralBemEntityToSingle(bemName.value())
        } else {
            if(!parent) {
                hasToEnlargeLocalTreeSize = true;
            } else {
                return _onNode(parent, null);
            }
        }
    }
}

function retrieveBemEntityByOffset(fileContent, offset, options) {
    const canEnlarge = options && options.canEnlarge !== false || !options;

    return new Promise(function(res, err) {
        const ast = parse.parseExpressionAt(fileContent, offset);
        traverse.traverse(ast, {
            enter: function(node, parent) {
                const bemEntity = _onNode(node, parent);
                if(bemEntity) res(bemEntity), this.break();
            },
            onEnd: function() {
                hasToEnlargeLocalTreeSize && canEnlarge ? res('enlarge') : rej(null);
            }
        });
    })
        .catch(e => {
            if(e instanceof SyntaxError) {
                debug('fix> fileContent %d: «%s» (%s)', e.pos, fileContent[e.pos], e.message)
                if(fileContent.length > e.pos) {
                    const newFileContent = fileContent.substr(0, e.pos);
                    debug('fix> newFileContent', newFileContent.substr(offset))
                    return retrieveBemEntityByOffset(newFileContent, offset)
                }
            }
            debug('err> retrieveBemEntityByOffset', e)
            return null;
        })
}

const retrieveBemEntity = {
    underCursor: function retrieveBemEntityUnderCursor(fileContent, cursor) {
        debugger;
        const cursorOffset = cursorPositionToOffset(fileContent, cursor);
        debug('cursor:', cursor, ', cursor offset:', cursorOffset)
        const offset = findNearLeftCurlyOpenPos(fileContent, cursorOffset);
        debug('bem entity offset', offset)
        if(offset === -1) {
            debug('err> retrieveBemEntityUnderCursor', cursorOffset, fileContent);
            return Promise.resolve(null);
        }

        return retrieveBemEntityByOffset(fileContent, offset)
            .then((res) => {
                // if BemJson not found, enlarge local tree up to next {} once
                if(res === 'enlarge') {
                    // {block:'block1', elem:'elem1', content: {block:'b'}}
                    // ^-- SECOND_CURL            FIRST_CURL --^    ^-- CURSOR
                    // SECOND(FIRST(CURSOR) - 1)
                    const nextOffset = findNearLeftCurlyOpenPos(fileContent, offset - 1);
                    console.log('retrieveBemEntityByOffset nextOffset', nextOffset);
                    if(nextOffset === -1) {
                        debug('err> have no next offset');
                        return null;
                    }
                    return retrieveBemEntityByOffset(fileContent, nextOffset, {canEnlarge: false})
                } else {
                    debug('retrieveBemEntityByOffset res', res);
                    return res;
                }
            })
            .catch((e) => {
                debug('err> retrieveBemEntityByOffset', e);
                return null;
            })
    },
    fromSelection: function retrieveBemEntityFromSelection(selection) {
        return retrieveBemEntityByOffset(selection, 0, {canEnlarge: false});
    }
};

function findNearLeftCurlyOpenPos(fileContent, offset) {
    const substr = fileContent.substr(0, offset);
    const pos = substr.lastIndexOf('{');
    debug('findNearLeftCurlyOpenPos last { pos', pos);

    // Если между текущей позицией и открывающей фигурной скобкой есть закрывающая
    // {block: 'block1'}, blahblahblah; var b = {block: 'block1'}
    // ^-- OPEN_CURL                 CURSOR --^
    if(/}/.test(substr.substr(pos))) {
        return pos !== -1 ? findNearLeftCurlyOpenPos(fileContent, pos) : -1;
    }

    return pos;
}

module.exports = retrieveBemEntity;
