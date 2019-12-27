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
const vscode = require("vscode");
const Navigator_1 = require("./Navigator");
const isRailsWorkspace = () => __awaiter(this, void 0, void 0, function* () {
    const files = yield vscode.workspace.findFiles("bin/rails");
    return files.length > 0;
});
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield !isRailsWorkspace()) {
            return;
        }
        const config = vscode.workspace.getConfiguration("quickOpenRails");
        const navigator = new Navigator_1.default(config);
        const command = vscode.commands.registerCommand("quickOpenRails.open", () => __awaiter(this, void 0, void 0, function* () {
            navigator.show();
        }));
        context.subscriptions.push(command, navigator);
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map