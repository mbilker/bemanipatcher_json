"use strict";

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsdom = require('jsdom');

const html_files = fs.readdirSync('bemanipatcher').filter((file) => {
  return file.endsWith(".html") && file !== "index.html";
});

const parent = [];

function parse_page(file) {
  const file_path = path.join('bemanipatcher', file);
  const contents = fs.readFileSync(file_path, "utf-8");
  const dom = new jsdom.JSDOM(contents);

  const versions = [];

  const sandbox = {
    window: {
      addEventListener(name, fn) {
        if (name === 'load') {
          fn();
        }
      }
    },
    DllPatcherContainer: function DllPatcherContainer() {},
    DllPatcher: function DllPatcher(dll_name, patches, description) {
      versions.push({ dll_name, description, patches });
    },
  };
  vm.createContext(sandbox);

  const document = dom.window.document.querySelectorAll('script');
  document.forEach((elem) => {
    const code = elem.innerHTML;
    if (code.length > 0) {
      vm.runInContext(code, sandbox);
    }
  });

  parent.push({
    file,
    versions,
  });
}

for (const file of html_files) {
  console.log(file);
  parse_page(file);
}

const json = JSON.stringify(parent, null, 2);
fs.writeFileSync('hex_edits.json', json);
console.log('Wrote hex edits to hex_edits.json');
