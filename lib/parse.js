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
const common = require('../common/common');

const debug = common.debug;
const cursorPositionToOffset = common.cursorPositionToOffset;
const pluralBemEntityToSingle = common.pluralBemEntityToSingle;
const isObject = common.isObject;
const isBemjson = common.isBemjson;

let hasToEnlargeLocalTreeSize = false;
const bemKeys = ['block', 'elem', 'mods', 'elemMods', 'modName', 'modVal'];

function _onNode(node, parent) {
    if(isObject(node)) {
        if(isBemjson(node)) {
            const bemjson = JSON.parse(codegen.generate(node, {format: {realjson: true}}));
            const bemName = _(bemjson).pick(bemKeys);
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
                else {
                    return null;
                }
            }
            if (process.env.DEBUG) throw {message: 'hight level parser error', e: e};
            else return null;
        })
}

/**
 * @public api
 */
const retrieveBemEntity = {
    underCursor: (fileContent, cursor) => _retrieveBemEntityUnderCursor(fileContent, cursor),
    fromSelection: function retrieveBemEntityFromSelection(selection) {
        return retrieveBemEntityByOffset(selection, 0, {canEnlarge: false});
    }
};

function _retrieveBemEntityUnderCursor(fileContent, cursor) {
    const cursorOffset = cursorPositionToOffset(fileContent, cursor);
    debug('cursor:', cursor, ', cursor offset:', cursorOffset)
    const offset = findNearLeftCurlyOpenPos(fileContent, cursorOffset);
    debug('bem entity offset', offset)
    if(offset === -1) {
        debug('err> retrieveBemEntityUnderCursor', cursorOffset, fileContent);
        return Promise.resolve(null);
    }

    return retrieveBemEntityByOffset(fileContent, offset)
        .then(res => _onBemEntity(res, fileContent, offset))
        .catch((e) => {
            debugger;
            debug('err> retrieveBemEntityByOffset', e);
            if (process.env.DEBUG) throw e;
            else return null;
        })
}

/**
 * @param {BemJson|String} res - bemEntity or 'enlarge' derective
 * @todo rethink it
 */
function _onBemEntity (res, fileContent, offset) {
    debugger;
    // if BemJson not found, enlarge local tree up to next {} once
    if(res === 'enlarge') {
        // {block:'block1', elem:'elem1', content: {block:'b'}}
        // ^-- SECOND_CURL            FIRST_CURL --^    ^-- CURSOR
        // SECOND(FIRST(CURSOR) - 1)
        const nextOffset = findNearLeftCurlyOpenPos(fileContent, offset - 1);
        if(nextOffset === -1) {
            debug('err> have no next offset');
            return null;
        }
        return retrieveBemEntityByOffset(fileContent, nextOffset, {canEnlarge: false})
    } else {
        debug('retrieveBemEntityByOffset res', res);
        return res;
    }
}

function findNearLeftCurlyOpenPos(fileContent, offset) {
    let bracketStackSize = 0;
    debug('findNearLeftCurlyOpenPos last { pos', offset);

    // Если между текущей позицией и открывающей фигурной скобкой есть закрывающая
    // {block: 'block1'}, blahblahblah; var b = {block: 'block1'}
    // ^-- OPEN_CURL                 CURSOR --^
    // if(/}/.test(substr.substr(pos))) {
    //     return pos !== -1 ? findNearLeftCurlyOpenPos(fileContent, pos) : -1;
    // }

    // { block: 'b1', mix: [{ block:'b2' }] }, "block__elem"
    //                                    ^1      ^2
    // проходить с права на лево и пропускать все {} пока не встретится {
    // если не встретится вернуть -1
    for (let i = offset; i >= 0; --i) {
        switch(fileContent[i]) {
            case('}'):
                ++bracketStackSize; break;

            case('{'):
                if (!bracketStackSize) { // odd opening curly found
                    debugger;
                    return i;
                }
                --bracketStackSize; break;

            default: /* nothing to do */ break;
        }
    }

    return -1;
}

module.exports = retrieveBemEntity;
