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
const vscode_1 = require("vscode");
const path = require("path");
const PAIRS_BY_LANGUAGE = {
    haml: ["= ", ""],
    slim: ["== ", ""],
    erb: ["<%= ", " %>"]
};
class PartialCodeActionProvider {
    provideCodeActions(document, range) {
        if (range.isSingleLine) {
            return null;
        }
        const relativePath = vscode_1.workspace.asRelativePath(document.uri);
        if (!relativePath.startsWith(path.join("app", "views"))) {
            return null;
        }
        const action = new vscode_1.CodeAction("Create partial view", vscode_1.CodeActionKind.RefactorExtract);
        action.command = {
            command: "railsPartial.createFromSelection",
            title: "Create partial view"
        };
        return [action];
    }
}
exports.default = PartialCodeActionProvider;
function createPartialFromSelection() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            return;
        }
        const name = yield vscode_1.window.showInputBox({
            prompt: "Input partial name:"
        });
        if (!name) {
            return;
        }
        const language = editor.document.languageId;
        const filePath = path.join(path.dirname(editor.document.uri.path), `_${name}.html.${language}`);
        const relativePath = vscode_1.workspace.asRelativePath(editor.document.uri);
        const [, , ...parts] = path.dirname(relativePath).split(path.sep);
        const partialName = path.join(...parts, name);
        const uri = vscode_1.Uri.file(filePath);
        const text = editor.document.getText(editor.selection);
        const renderText = PAIRS_BY_LANGUAGE[language].join(`render '${partialName}'`);
        const edit = new vscode_1.WorkspaceEdit();
        edit.createFile(uri);
        edit.insert(uri, new vscode_1.Position(0, 0), text);
        edit.replace(editor.document.uri, editor.selection, renderText);
        vscode_1.workspace.applyEdit(edit);
    });
}
exports.createPartialFromSelection = createPartialFromSelection;
//# sourceMappingURL=PartialCodeActionProvider.js.map