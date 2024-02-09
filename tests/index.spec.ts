import { hello } from '../src';

describe('hello', () => {
	it('should say \'hello\'', () => {
		const said = hello();
		expect(said).toEqual('hello');
	})
});