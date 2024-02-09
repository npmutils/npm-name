import { request, NpmNameOptions } from "./request.js";

export async function npmName(name: string, options: NpmNameOptions = {}): Promise<boolean> {
	if (!(typeof name === 'string' && name.length > 0)) {
		throw new Error('Package name required');
	}

	if (options.registryUrl !== undefined && !isUrl(options.registryUrl)) {
		throw new Error('The `registryUrl` option must be a valid string URL');
	}

	return request(name, options);
}

function isUrl(address: string) {
	try {
		new URL(address || '');
		return true;
	}
	catch { return false; }
}