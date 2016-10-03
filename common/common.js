'use strict';

const color = require('chalk');
const _ = require('lodash');

// todo: extract into external npm package
function debug(message) {
    if(!process.env.DEBUG) return;
    var log = console.log.bind(console, color.blue('debug> ') + message);
    log.apply(null, Array.from(arguments).splice(1))
}

// todo: extract into external npm package
// input and output starts from 0
function cursorPositionToOffset(text, cursor) {
    const lines = text.split(/\n/);
    const prevLines = cursor.row;
    const prevOffset = lines.splice(0, prevLines).join('\n').length;

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

// ----

module.exports = {
    // path.dirname is not correct for our case. it maps /a/b/c/ --> /a/b/, but expected no changes
    dirpath: p => !(p.split(/\//).pop().match(/\./) || [])[0] ? p : require('path').dirname(p),
    normalizeDir: dir => dir.match(/\/$/) ? dir : `${dir}/`,
    debug: debug,
    cursorPositionToOffset: cursorPositionToOffset,
    pluralBemEntityToSingle: pluralBemEntityToSingle,
    isObject: isObject,
    isBemjson: isBemjson,
};
