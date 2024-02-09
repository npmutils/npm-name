import { npmName } from '../dist/lib/index.js';
const packageName = process.argv[2];
const result = await npmName(packageName);
console.log(`${packageName} is ${result ? "" : "not "}available.`);