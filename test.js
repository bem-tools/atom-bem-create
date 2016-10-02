#!/usr/bin/env node
const retrieveBemEntity = require('./lib/parse');
const assert = require('assert');
const color = require('chalk');
const parse = require('acorn');
const bemNaming = require('bem-naming')();
const _ = require('lodash');
const fs = require('fs');
const ls = require('ls');

function debug(message) {
  var log = console.log.bind(console, color.blue('debug> ') + message);
  log.apply(null, Array.from(arguments).splice(1))
}

function test(fileContent, cursor, expectedBemString) {
  retrieveBemEntity.underCursor(fileContent, cursor)
  .then(bn => {
    const bemString = bn && bemNaming.stringify(bn);
    expectedBemString && assert.equal(bemString, expectedBemString, 'bem entity string is changed');
    setTimeout(()=>console.log(color.green.bold('result>') + ' bem entity:', bn, ', bem class:', bn && bemNaming.stringify(bn)),0)
  })
  .catch(e=> setTimeout(()=>debug(color.red('err>'), e), 0))
}

test.error = e=>{setTimeout(()=>debug(color.red('err>'), e), 0)};

// run tests
if (module.id === '.') {
    console.log('Run all the tests...');

    delete require.cache[require.resolve('./test')];

    ls('./*')
    .filter(file => /\.test\.js$/.test(file.full))
    .map(file=>file.full)
    .forEach(file=>require(file));
}
// or provide lib for tests
else {
    console.log('Export test lib');
    module.exports = fileContent => {
        console.log(color.red('Run tests...'), 'for test file', '\n' + color.black.bold(fileContent))
        return test;
    }
}
