"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function buildSnippet(helper, params) {
    let snippet = `${helper}_\${1|path,url|}`;
    if (params.length > 0) {
        const args = params.map((param, index) => `\${${index + 2}:${param}}`);
        snippet = `${snippet}(${args.join(", ")})\${${params.length + 2}}`;
    }
    return new vscode_1.SnippetString(snippet);
}
exports.buildSnippet = buildSnippet;
//# sourceMappingURL=util.js.map