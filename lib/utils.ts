export function isFloat(n: number | string): boolean {
	return Number(n) === n && n % 1 !== 0;
}
