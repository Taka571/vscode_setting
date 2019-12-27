"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const vscode = require("vscode");
const PartialDefinitionProvider_1 = require("./PartialDefinitionProvider");
const PartialCompletionProvider_1 = require("./PartialCompletionProvider");
const PartialCodeActionProvider_1 = require("./PartialCodeActionProvider");
const isRailsWorkSpace = (rootPath) => __awaiter(this, void 0, void 0, function* () {
    return yield fs.pathExists(path.join(rootPath, "config", "environment.rb"));
});
const SELECTOR = ["erb", "haml", "slim"];
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const rootPath = vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : null;
        if (!rootPath || (yield !isRailsWorkSpace(rootPath))) {
            return;
        }
        context.subscriptions.push(vscode.languages.registerDefinitionProvider(SELECTOR, new PartialDefinitionProvider_1.default(rootPath)));
        context.subscriptions.push(vscode.languages.registerCompletionItemProvider(SELECTOR, new PartialCompletionProvider_1.default(), '"', "'"));
        context.subscriptions.push(vscode.commands.registerCommand("railsPartial.createFromSelection", PartialCodeActionProvider_1.createPartialFromSelection));
        context.subscriptions.push(vscode.languages.registerCodeActionsProvider(SELECTOR, new PartialCodeActionProvider_1.default(), {
            providedCodeActionKinds: [vscode.CodeActionKind.RefactorExtract]
        }));
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map