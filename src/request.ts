import { OutgoingHttpHeaders } from 'node:http';

import isScoped from 'is-scoped';
import orgRegex from 'org-regex';
import registryUrl from 'registry-url';
import registryAuthToken from 'registry-auth-token';
import validate from 'validate-npm-package-name';

const configuredRegistryUrl = registryUrl();
const organizationRegex = orgRegex({ exact: true });

// Ensure the URL always ends in a `/`
function normalizeUrl(url: string): string {
	return url.replace(/\/$/, '') + '/';
}

const npmOrganizationUrl = 'https://www.npmjs.com/org/';

export async function request(name: string, options?: NpmNameOptions): Promise<boolean> {
	options = options || {};

	const registryUrl = normalizeUrl(options.registryUrl || configuredRegistryUrl);

	const isOrganization = organizationRegex.test(name);
	if (isOrganization) {
		name = name.replace(/[@/]/g, '');
	}

	const isValid = validate(name);
	if (!isValid.validForNewPackages) {
		const notices = [...isValid.warnings || [], ...isValid.errors || []].map(v => `- ${v}`);
		notices.unshift(`Invalid package name: ${name}`);
		const error = new InvalidNameError(notices.join('\n'));
		error.warnings = isValid.warnings;
		error.errors = isValid.errors;
		throw error;
	}

	let urlName = name;
	const isScopedPackage = isScoped(name);
	if (isScopedPackage) {
		urlName = name.replace(/\//g, '%2f');
	}
	urlName = urlName.toLowerCase();

	try {
		let headers: OutgoingHttpHeaders = {}
		let requestUri: string = '';

		if (isOrganization) {
			const authInfo = registryAuthToken(registryUrl, { recursive: true });
			if (authInfo) {
				headers.authorization = `${authInfo.type} ${authInfo.token}`;
			}
			requestUri = npmOrganizationUrl + urlName;
		} else {
			requestUri = registryUrl + urlName;
		}

		const response = await fetch(requestUri);
		if (response.status === 404) {
			// Disabled as it's often way too slow
			// see https://github.com/sindresorhus/npm-name-cli/issues/30
			return true;
		}
		if (isScopedPackage && response.status === 401) {
			return true;
		}
		return false;
	}
	catch (error: unknown) {
		//if (error instanceof HTTPError) {
		//	const { status } = error.response || {};

		//	if (status === 404) {
		//		// Disabled as it's often way too slow
		//		// see https://github.com/sindresorhus/npm-name-cli/issues/30
		//		return true;
		//	}

		//	if (isScopedPackage && status === 401) {
		//		return true;
		//	}
		//}

		throw error;
	}
};

export class InvalidNameError extends Error {
	warnings?: string[];
	errors?: string[];
}

export class NpmNameOptions {
	registryUrl?: string = undefined;
}
