const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('lib/browser-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
vm.runInNewContext(source,{module:mod,exports:mod.exports});
assert.equal(mod.exports.useFullMotion(),true);
assert.ok(!fs.readFileSync('components/home-content.tsx','utf8').includes('MotionPreference'));
console.log('PASS: full effects enabled without browser storage or device preference; obsolete setting removed');
