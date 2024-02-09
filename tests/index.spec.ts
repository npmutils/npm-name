import { expect, test } from 'vitest';
import { npmName } from '../src';

const scopeName = "scope-name-cb48d62b17944e008929a796338f590f"
const moduleName = "module-name-available-cb48d62b17944e008929a796338f590f"

const registryUrl = 'https://registry.yarnpkg.com/';
const options = { registryUrl };

test('returns true when package name is available', async () => {

	expect(await npmName(moduleName)).toBeTruthy();
	expect(await npmName(moduleName, options)).toBeTruthy();
	expect(await npmName(moduleName, { registryUrl: undefined })).toBeTruthy();
});


test('returns true when organization name is available', async () => {

	expect(await npmName(`@${moduleName}`)).toBeTruthy();
	expect(await npmName(`@${moduleName}/`)).toBeTruthy();
});

test('returns false when package name is taken', async () => {

	expect(await npmName('chalk')).toBeFalsy();
	expect(await npmName('recursive-readdir')).toBeFalsy();
	expect(await npmName('recursive-readdir')).toBeFalsy();
	expect(await npmName('np', options)).toBeFalsy();
});

test.fails('returns false when package name is taken, regardless of punctuation', async () => {
	expect(await npmName('ch-alk')).toBeFalsy();
	expect(await npmName('recursivereaddir')).toBeFalsy();
});

test('returns false when organization name is taken', async () => {

	expect(await npmName('@ava')).toBeFalsy();
	expect(await npmName('@ava/')).toBeFalsy();
	expect(await npmName('@angular/')).toBeFalsy();
});

test('registry url is normalized', async () => {

	expect(await npmName(moduleName, options)).toBeTruthy();
	expect(await npmName(moduleName, {
		// The `.slice()` removes the trailing `/` from the URL
		registryUrl: registryUrl.slice(0, -1)
	})).toBeTruthy();
});

test('returns true when scoped package name is not taken', async t => {
	expect(await npmName(`@${scopeName}/${moduleName}`)).toBeTruthy();
});

test('returns false when scoped package name is taken', async () => {
	expect(await npmName('@sindresorhus/is')).toBeFalsy();
});

test('throws when package name is invalid', async () => {
	await expect(() => npmName('_ABC')).rejects.toThrowError(`Invalid package name: _ABC
- name can no longer contain capital letters
- name cannot start with an underscore`);
});

//test('should return an iterable error capturing multiple errors when appropriate', async t => {
//	const name1 = 'chalk'; // False
//	const name2 = uniqueString(); // True
//	const name3 = '_ABC'; // Error
//	const name4 = 'CapitalsAreBad'; // Error
//
//	const aggregateError = await t.throwsAsync(npmNameMany([name1, name2, name3, name4]), {
//		instanceOf: AggregateError
//	});
//
//	const errors = [...aggregateError.errors];
//	t.is(errors.length, 2);
//	t.regex(errors[0].message, /Invalid package name: _ABC/);
//	t.regex(errors[1].message, /Invalid package name: CapitalsAreBad/);
//});
//