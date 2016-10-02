const Test = require('./test');

var fileContent = "{ block: 'b1', elem: 'el1' }`\nvar i = `\"{block: 'block1'}\"`, q;";

const test = Test(fileContent);

Promise.resolve()
.then(()=>{test(fileContent, {row: 0, column: 0}, '')})
.then(()=>{test(fileContent, {row: 1, column: 8}, '')})
.then(()=>{test(fileContent, {row: 0, column: 27}, '')})
.then(()=>{test(fileContent, {row: 1, column: 16}, 'block1')})
.then(()=>{test(fileContent, {row: 0, column: 26}, 'b1__el1')})
.catch(test.error)
