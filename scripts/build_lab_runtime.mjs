// npm install --prefix tmp/final-smoke --save-exact react@19.3.1 react-dom@19.3.1 esbuild@0.28.2
import {build} from '../tmp/final-smoke/node_modules/esbuild/lib/main.js';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('../assets/labs',import.meta.url),{recursive:true});
await build({
  entryPoints:['scripts/labs-react-runtime.jsx'],outfile:'assets/labs/react-runtime.js',
  bundle:true,format:'esm',platform:'browser',target:['es2020'],minify:true,
  nodePaths:['tmp/final-smoke/node_modules'],define:{'process.env.NODE_ENV':'"production"'},
  legalComments:'eof'
});
await copyFile('tmp/final-smoke/node_modules/react/LICENSE','assets/labs/REACT-LICENSE.txt');
await copyFile('tmp/final-smoke/node_modules/react-dom/LICENSE','assets/labs/REACT-DOM-LICENSE.txt');
console.log('Built local React lab runtime');
