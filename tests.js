#!/usr/bin/env node
if(typeof it === 'undefined') {
    console.log('run: mocha ' + require('path').basename(process.argv[1]));
    process.exit();
}

const retrieveBemEntity = require('./lib/parse');
const assert = require('assert');
const common = require('./common/common');

const cursorPositionToOffset = (text, cursor) => common.cursorPositionToOffset(text, cursor);

const test = (fileContent, cursor, expectedBemString) => {
  retrieveBemEntity.underCursor(fileContent, cursor)
  .then(bemjsonName => {
    const bemSlug = bemjsonName && bemNaming.stringify(bemjsonName);
    const pos = cursorPositionToOffset(fileContent, cursor);
    const debugData = {
        cursor: cursor,
        place: `... ${fileContent.substr(pos-20, pos)} >|< ${fileContent.substr(pos, pos+20)} ...`
    }
    assert.equal(bemSlug, expectedBemString, debugData);
    return `bem entity: ${bemjsonName} bem class: ${bemSlug}`
  })
}

const fileContent1 = `function foo (){
  const i = 0;
  const o = {block:'block1', elem:'elem1', content: {block:'b'}, mix:[{elem:'mix1'}]},
      q;
  console.log(({block: 'block2'}).block);
  console.log(({block: 'block3', // multiline bemjson
    elem: 'elem3'}).block);
    // { block: 'b', elem: "foobar", elemMods: {foo:'bar'} }
    // '{ block: "bb", elem: "baz", modName: "qux" }' // <-- working snippet
    { block: 'block42', mix: [{elem:'mix'}] };
    // block__elem
    // incorr^ct |{omment [[#$]] --
        "block_100500"
}`;

const fileContent2 = "{ block: 'b1', elem: 'el1' }`\nvar i = `\"{block: 'block1'}\"`, q;";

describe('parser', () => {
    describe('#retrieveBemEntity#underCursor()', () => {
        it('block1__elem1', () => {test(fileContent1, {row: 2, column: 22}, 'block1__elem1')});
        it('block3__elem3', () => {test(fileContent1, {row: 5, column: 32}, 'block3__elem3')});
        it('b__foobar_foo_bar 1', () => {test(fileContent1, {row: 7, column: 52}, 'b__foobar_foo_bar')});
        it('b__foobar_foo_bar 2', () => {test(fileContent1, {row: 7, column: 42}, 'b__foobar_foo_bar')});
        it('bb__baz_qux', () => {test(fileContent1, {row: 8, column: 42}, 'bb__baz_qux')});
        it('nothing 1', () => {test(fileContent1, {row: 1, column: 1}, '')});
        it('block42 1', () => {test(fileContent1, {row: 9, column: 42}, 'block42')});
        it('block42 2', () => {test(fileContent1, {row: 9, column: 43}, 'block42')});
        it('nothing 3', () => {test(fileContent1, {row: 9, column: 44}, '')});
        it('nothing 4', () => {test(fileContent1, {row: 9, column: 45}, '')});
        // parser findes only bemjsons. string interpretation proceeds in the up levels
        it('nothing 5', () => {test(fileContent1, {row: 10, column: 10}, '')});
        it('nothing 6', () => {test(fileContent1, {row: 12, column: 12}, '')});

        it('nothing 7', () => {test(fileContent2, {row: 0, column: 0}, '')});
        it('nothing 8', () => {test(fileContent2, {row: 1, column: 8}, '')});
        it('nothing 9', () => {test(fileContent2, {row: 0, column: 27}, '')});
        it('block1', () => {test(fileContent2, {row: 1, column: 16}, 'block1')});
        it('b1__el1', () => {test(fileContent2, {row: 0, column: 26}, 'b1__el1')});
    });
});
