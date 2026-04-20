export async function fetchStacksInfo(stacksApi: string, stacksHiroKey?: string) {
	const path = `${stacksApi}/v2/info`;
	const response = await fetch(path, {
		headers: { ...(stacksHiroKey ? { 'x-api-key': stacksHiroKey } : {}) }
	});
	const res = await response.json();
	return res;
}
