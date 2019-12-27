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
const path = require("path");
const vscode_1 = require("vscode");
const LINE_REGEXP = /[^a-z.]render(?:\s+|\()['"]([a-zA-Z0-9_/]*)$/;
const matchScore = (path1, path2) => {
    const parts1 = path1.split(path.sep).slice(0, -1);
    const parts2 = path2.split(path.sep).slice(0, -1);
    let score = 0;
    parts1.some((part, index) => {
        if (part === parts2[index]) {
            score += 1;
            return false;
        }
        return true;
    });
    return score;
};
const viewPathForRelativePath = (partialPath) => {
    const search = path.join("app", "views") + path.sep;
    return vscode_1.workspace.asRelativePath(partialPath).replace(search, "");
};
class PartialCompletionProvider {
    provideCompletionItems(document, position) {
        const line = document.getText(new vscode_1.Range(new vscode_1.Position(position.line, 0), new vscode_1.Position(position.line, position.character)));
        const matches = line.match(LINE_REGEXP);
        if (!matches) {
            return Promise.resolve(null);
        }
        return this.buildCompletionItems(document);
    }
    buildCompletionItems(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const partialPaths = yield vscode_1.workspace.findFiles("app/views/**/_*");
            const viewPaths = partialPaths.map(viewPathForRelativePath);
            const currentViewPath = viewPathForRelativePath(document.uri);
            const itemsWithScore = viewPaths.map(viewPath => {
                return {
                    item: this.buildCompletionItem(viewPath),
                    score: matchScore(currentViewPath, viewPath)
                };
            });
            const scores = itemsWithScore.map(({ score }) => score);
            const maxScore = Math.max(...scores);
            const maxScoreItemWithScore = itemsWithScore.find(({ score }) => score === maxScore);
            if (!maxScoreItemWithScore) {
                return null;
            }
            maxScoreItemWithScore.item.preselect = true;
            return itemsWithScore.map(({ item }) => item);
        });
    }
    buildCompletionItem(viewPath) {
        const parts = viewPath.split(path.sep);
        const fileName = parts[parts.length - 1];
        const [baseName] = fileName.split(".", 2);
        const partialPath = [...parts.slice(0, -1), baseName.slice(1)].join(path.sep);
        const item = new vscode_1.CompletionItem(partialPath, vscode_1.CompletionItemKind.File);
        item.detail = viewPath;
        return item;
    }
}
exports.default = PartialCompletionProvider;
//# sourceMappingURL=PartialCompletionProvider.js.map