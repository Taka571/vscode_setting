"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const METHOD_REGEXP = /\w+_(?:path|url)/;
const getActionPosition = (controllerPath, action) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield vscode_1.workspace.openTextDocument(controllerPath);
    const regex = new RegExp(`^ *def\\s+${action}\\s*$`);
    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        if (regex.test(line.text)) {
            return new vscode_1.Position(index, 0);
        }
    }
    return new vscode_1.Position(0, 0);
});
class RoutesDefinitionProvider {
    constructor(routes) {
        this.routes = routes;
    }
    provideDefinition(document, position) {
        return __awaiter(this, void 0, void 0, function* () {
            const range = document.getWordRangeAtPosition(position, METHOD_REGEXP);
            if (!range) {
                return;
            }
            const helper = document.getText(range).replace(/_(?:path|url)$/, "");
            const route = this.routes.get(helper);
            if (!route) {
                return;
            }
            const controllerPaths = yield vscode_1.workspace.findFiles(`app/controllers/${route.controller}_controller.rb`);
            if (controllerPaths.length < 1) {
                return;
            }
            const promises = Array.from(route.actions).map((action) => __awaiter(this, void 0, void 0, function* () {
                const uri = controllerPaths[0];
                const position = yield getActionPosition(uri, action);
                return new vscode_1.Location(controllerPaths[0], position);
            }));
            return Promise.all(promises);
        });
    }
}
exports.default = RoutesDefinitionProvider;
//# sourceMappingURL=RoutesDefinitionProvider.js.map