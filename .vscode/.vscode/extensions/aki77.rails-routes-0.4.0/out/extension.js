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
const path = require("path");
const vscode = require("vscode");
const routes_1 = require("./routes");
const RoutesDefinitionProvider_1 = require("./RoutesDefinitionProvider");
const RoutesCompletionProvider_1 = require("./RoutesCompletionProvider");
const util_1 = require("./util");
const debounce = require("lodash.debounce");
const GLOB_PATTERN = "config/routes.rb";
const refreshRoutes = (routes) => {
    const progressOptions = {
        location: vscode.ProgressLocation.Window,
        title: "Loading rails routes"
    };
    vscode.window.withProgress(progressOptions, () => routes.load());
};
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const routePaths = yield vscode.workspace.findFiles(GLOB_PATTERN);
        if (routePaths.length !== 1) {
            return;
        }
        const routePath = routePaths[0];
        const routes = new routes_1.default(path.resolve(routePath.fsPath, "../../"));
        context.subscriptions.push(routes);
        setImmediate(() => {
            refreshRoutes(routes);
        });
        const fileWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.getWorkspaceFolder(routePath), GLOB_PATTERN));
        const debouncedRefreshRoutes = debounce(() => refreshRoutes(routes), 3000);
        fileWatcher.onDidChange(debouncedRefreshRoutes);
        context.subscriptions.push(fileWatcher);
        context.subscriptions.push(vscode.languages.registerDefinitionProvider(["ruby", "erb", "haml", "slim"], new RoutesDefinitionProvider_1.default(routes)));
        context.subscriptions.push(vscode.languages.registerCompletionItemProvider(["ruby", "erb", "haml", "slim"], new RoutesCompletionProvider_1.default(routes)));
        context.subscriptions.push(vscode.commands.registerCommand("railsRoutes.insert", () => __awaiter(this, void 0, void 0, function* () {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const items = Array.from(routes.getAll()).map(([helper, { params }]) => {
                const snippet = util_1.buildSnippet(helper, params);
                return {
                    snippet,
                    label: `${helper}_path`,
                    description: snippet.value
                };
            });
            const item = yield vscode.window.showQuickPick(items);
            if (!item) {
                return;
            }
            yield editor.insertSnippet(item.snippet);
        })));
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map