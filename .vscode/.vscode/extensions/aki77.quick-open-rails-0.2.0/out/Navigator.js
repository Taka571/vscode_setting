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
const sortOn = require("sort-on");
const capitalize = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};
class Navigator {
    constructor(config) {
        this.config = config;
        this.accept = () => {
            const selectedItem = this.quickPick.selectedItems[0];
            if (this.quickPick.step === 1) {
                this.showFiles(selectedItem);
            }
            else {
                this.openFile(selectedItem);
            }
        };
        this.quickPick = vscode_1.window.createQuickPick();
        this.quickPick.onDidAccept(this.accept);
        this.quickPick.totalSteps = 2;
    }
    dispose() {
        this.quickPick.dispose();
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            this.quickPick.busy = true;
            this.quickPick.value = "";
            this.quickPick.placeholder = "Select a Category";
            this.quickPick.step = 1;
            this.quickPick.show();
            this.quickPick.items = sortOn(yield this.getCategories(), "label");
            this.quickPick.busy = false;
        });
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const appCategories = this.config.autoDetectAppDirectories
                ? yield this.getAppCategories()
                : [];
            return [...appCategories, ...this.config.customCategories];
        });
    }
    getAppCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const folders = vscode_1.workspace.workspaceFolders;
            if (!folders) {
                return [];
            }
            const promises = folders.map(folder => {
                const uri = vscode_1.Uri.file(path.join(folder.uri.fsPath, "app"));
                return vscode_1.workspace.fs.readDirectory(uri);
            });
            const files = yield Promise.all(promises);
            return files.flat()
                .filter(([name, fileType]) => fileType === vscode_1.FileType.Directory &&
                !this.config.excludeAppDirectories.includes(name))
                .map(([name]) => {
                return {
                    label: capitalize(name),
                    pattern: `app/${name}/**/*`
                };
            });
        });
    }
    getFileItems(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const { pattern, reverse, exclude } = category;
            const files = yield vscode_1.workspace.findFiles(pattern, exclude).then(_files => {
                _files.sort();
                return reverse ? _files.reverse() : _files;
            });
            return files.map(file => {
                return {
                    label: vscode_1.workspace
                        .asRelativePath(file)
                        .replace(pattern.split("**", 2)[0], ""),
                    uri: file
                };
            });
        });
    }
    showFiles(category) {
        return __awaiter(this, void 0, void 0, function* () {
            this.quickPick.busy = true;
            this.quickPick.value = "";
            this.quickPick.step = 2;
            this.quickPick.placeholder = "Select a File";
            this.quickPick.items = yield this.getFileItems(category);
            this.quickPick.busy = false;
        });
    }
    openFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            this.quickPick.hide();
            yield vscode_1.window.showTextDocument(file.uri);
        });
    }
}
exports.default = Navigator;
//# sourceMappingURL=Navigator.js.map