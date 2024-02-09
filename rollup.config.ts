import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

const libraryName = 'index';
const main = `dist/${libraryName}.umd.js`

const terser_options = {
	mangle: { reserved: ["exports"] }
};

export default {
	input: `src/${libraryName}.ts`,
	output: [
		{ file: main, name: libraryName, format: 'umd', exports: 'named', sourcemap: true },
		{ file: main.replace('umd.js', 'umd.min.js'), name: libraryName, format: 'umd', exports: 'named', sourcemap: true, plugins: [terser(terser_options)] }
	],
	// Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
	external: [],
	plugins: [
		// Allow json resolution
		json(),
		// Compile TypeScript files
		typescript({
			tsconfig: './tsconfig.json',
			useTsconfigDeclarationDir: true
		}),
		// Allow node_modules resolution, so you can use 'external' to control
		// which external modules to include in the bundle
		// https://github.com/rollup/rollup-plugin-node-resolve#usage
		resolve()
	]
}