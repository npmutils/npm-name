import getAuthToken from 'registry-auth-token';
import getRegistryUrl from 'registry-auth-token/registry-url';
import validate from 'validate-npm-package-name';

namespace npmUtils {

	export class NpmInfo {
		// absolute url to the registry
		registryUrl: string;
		// relative url to the package or organization
		relativeUrl: string;
		// npm organization, if any
		organization?: string;
		// package name, if any
		packageName?: string;
		isOrganization: boolean;
	}

	const npmjsRegexPattern = '(@(?<org>[a-z\\d][\\w-.]+))?/?(?<pkg>[a-z\\d][\\w-.]*)?';

	export function getPackageInfo(name: string, registryUrl?: string): NpmInfo {

		const scopedRegex = getPackageRegex({ exact: true });
		const matched = name.match(scopedRegex);

		let organization: string | undefined = undefined;
		let packageName: string | undefined = name;

		if (matched !== null && matched.groups !== null) {
			organization = matched.groups['org'];
			packageName = matched.groups['pkg'];
		}

		const isOrganization = organization !== undefined && packageName === undefined;

		registryUrl = normalizeUrl(registryUrl || getRegistryUrl(undefined));

		let relativeUrl = packageName;
		if (organization !== undefined)
			relativeUrl = `@${organization}%2f${packageName}`;
		relativeUrl = relativeUrl.toLowerCase();

		if (isOrganization) {
			registryUrl = getRegistryUrl(`@${organization}`);
			relativeUrl = organization.toLowerCase();
		}

		return {
			registryUrl: registryUrl,
			relativeUrl: relativeUrl,
			organization: organization,
			packageName: packageName,
			isOrganization: isOrganization,
		};
	}

	function getPackageRegex(options: { exact: boolean }): RegExp {
		return options && options.exact ?
			new RegExp(`^${npmjsRegexPattern}$`, 'i') :
			new RegExp(npmjsRegexPattern, 'gi');
	}

	// Ensure the URL always ends in a `/`
	function normalizeUrl(url: string): string {
		return url.replace(/\/$/, '') + '/';
	}
}

export async function request(name: string, options: NpmNameOptions = {}): Promise<boolean> {

	const { registryUrl, relativeUrl, organization, packageName, isOrganization } = npmUtils.getPackageInfo(name, options.registryUrl);

	const requestedName = isOrganization ? organization : name;

	// check name is valid

	const isValid = validate(requestedName);
	if (!isValid.validForNewPackages) {
		const notices = [
			...(isValid.warnings || []),
			...(isValid.errors || []),
		].map((v) => `- ${v}`);
		notices.unshift(`Invalid package name: ${name}`);
		const error = new InvalidNameError(notices.join("\n"));
		error.warnings = isValid.warnings;
		error.errors = isValid.errors;
		throw error;
	}

	// check name is available

	let headers: HeadersInit = {};
	if (isOrganization) {
		const credentials = getAuthToken(registryUrl, { recursive: true });
		if (credentials)
			headers['Authorization'] = `${credentials.type} ${credentials.token}`;
	}

	const response = await fetch(registryUrl + relativeUrl, {
		method: 'HEAD',
		headers: headers,
	});

	if (response.status === 404) {
		// Disabled as it's often way too slow
		// see https://github.com/sindresorhus/npm-name-cli/issues/30
		return true;
	}

	if (isOrganization && response.status === 401) {
		return true;
	}

	return false;
}

export class InvalidNameError extends Error {
	warnings?: string[];
	errors?: string[];
}

export class NpmNameOptions {
	registryUrl?: string = undefined;
}
