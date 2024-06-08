import { pickBy } from "lodash";

export function isFloat(n: number | string): boolean {
	return Number(n) === n && n % 1 !== 0;
}

export function removeUndefinedProperties(
	obj: Record<string, any>
): Record<string, any> {
	return pickBy(obj, (value) => typeof value !== "undefined");
}

export function concatenateUint8Arrays(arrays: any[]): Uint8Array {
	const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
	const result = new Uint8Array(totalLength);

	let offset = 0;

	for (const array of arrays) {
		result.set(array, offset);
		offset += array.length;
	}

	return result;
}
