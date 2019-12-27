"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const util_1 = require("./util");
const LINE_REGEXP = /(?:link_to|redirect_to|button_to|\Wvisit[(\s]|(?:url|path):\s+|(?:url|path)\s*=)/;
const matchScore = (path1, path2) => {
    const parts1 = path1.split(path.sep);
    const parts2 = path2.split(path.sep);
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
class RoutesCompletionProvider {
    constructor(routes) {
        this.routes = routes;
    }
    provideCompletionItems(document, position) {
        const line = document.getText(new vscode_1.Range(new vscode_1.Position(position.line, 0), new vscode_1.Position(position.line, position.character)));
        const matches = line.match(LINE_REGEXP);
        if (!matches) {
            return null;
        }
        return this.buildCompletinItems(document.uri);
    }
    buildCompletinItems(currentUri) {
        const currentController = vscode_1.workspace
            .asRelativePath(currentUri)
            .replace(/app\/(?:controllers|views)\//, "");
        const itemsWithScore = Array.from(this.routes.getAll()).map(([helper, { url, actions, params, controller }]) => {
            const item = new vscode_1.CompletionItem(`${helper}_path`, vscode_1.CompletionItemKind.Method);
            item.detail = Array.from(actions)
                .map(action => [controller, action].join("#"))
                .join(", ");
            item.insertText = util_1.buildSnippet(helper, params);
            return { item, score: matchScore(currentController, controller) };
        });
        const scores = itemsWithScore.map(({ score }) => score);
        const maxScore = Math.max(...scores);
        const maxScoreItemWithScore = itemsWithScore.find(({ score }) => score === maxScore);
        if (!maxScoreItemWithScore) {
            return null;
        }
        maxScoreItemWithScore.item.preselect = true;
        return itemsWithScore.map(({ item }) => item);
    }
}
exports.default = RoutesCompletionProvider;
//# sourceMappingURL=RoutesCompletionProvider.js.map