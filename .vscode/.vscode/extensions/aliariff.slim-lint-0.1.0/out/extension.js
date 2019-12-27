"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const linter_1 = require("./linter");
function activate(context) {
    const linter = new linter_1.default();
    context.subscriptions.push(linter);
    const updateDiagnostics = (document) => {
        linter.run(document);
    };
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(updateDiagnostics));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(updateDiagnostics));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
        linter.clear(document);
    }));
    vscode.workspace.textDocuments.forEach(updateDiagnostics);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map