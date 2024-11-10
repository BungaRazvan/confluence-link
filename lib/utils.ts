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

export const MardownLgToConfluenceLgMap: {
	[key: string]: string;
} = {
	js: "javascript",
	bash: "shell",
	abap: "abap",
	actionscript: "actionscript",
	ada: "ada",
	applescript: "applescript",
	arduino: "arduino",
	autoit: "autoit",
	c: "c",
	"c++": "cpp",
	clojure: "clojure",
	coffeescript: "coffeescript",
	coldfusion: "coldfusion",
	csharp: "csharp",
	css: "css",
	cuda: "cuda",
	d: "d",
	dart: "dart",
	diff: "diff",
	elixir: "elixir",
	erlang: "erlang",
	fortran: "fortran",
	foxpro: "foxpro",
	go: "go",
	graphql: "graphql",
	groovy: "groovy",
	haskell: "haskell",
	haxe: "haxe",
	html: "html",
	java: "java",
	javafx: "javafx",
	javascript: "javascript",
	json: "json",
	jsx: "jsx",
	julia: "julia",
	kotlin: "kotlin",
	livescript: "livescript",
	lua: "lua",
	mathematica: "mathematica",
	matlab: "matlab",
	"objective-c": "objective-c",
	"objective-j": "objective-j",
	ocaml: "ocaml",
	octave: "cctave",
	pascal: "pascal",
	perl: "perl",
	php: "php",
	plaintext: "text",
	powershell: "powershell",
	prolog: "prolog",
	puppet: "puppet",
	python: "python",
	qml: "qml",
	r: "r",
	racket: "racket",
	restructuredtext: "restructuredtext",
	ruby: "ruby",
	rust: "rust",
	sass: "sass",
	scala: "scala",
	scheme: "scheme",
	shell: "bash",
	smalltalk: "smalltalk",
	splunkspl: "splunkspl",
	sql: "sql",
	standardml: "standardml",
	swift: "swift",
	tcl: "tcl",
	tex: "tex",
	tsx: "tsx",
	typescript: "typescript",
	vala: "vala",
	vbnet: "vbnet",
	verilog: "verilog",
	vhdl: "vhdl",
	visualbasic: "visualbasic",
	xml: "xml",
	xquery: "xquery",
	yaml: "yaml",
};

export const wait = async (ms: number = 1000) => {
	await new Promise((resolve) => setTimeout(resolve, ms));
};

export const isRecentlyModified = (
	mtime: number,
	thresholdMs: number = 1000
): boolean => {
	return Date.now() - mtime <= thresholdMs;
};
