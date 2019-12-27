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
const fs_extra_1 = require("fs-extra");
const vscode_1 = require("vscode");
class PartialDefinitionProvider {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    provideDefinition(document, position) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = document.lineAt(position.line).text;
            if (!line.includes("render")) {
                return null;
            }
            const partialName = this.partialName(line);
            if (!partialName) {
                return null;
            }
            const range = document.getWordRangeAtPosition(position, /[\w/]+/);
            if (!range) {
                return null;
            }
            return this.partialLocation(document.fileName, partialName, range);
        });
    }
    partialName(line) {
        const regex = line.includes("partial")
            ? /render\s*\(?\s*\:?partial(?:\s*=>|:*)\s*["'](.+?)["']/
            : /render\s*\(?\s*["'](.+?)["']/;
        const result = line.match(regex);
        return result ? result[1] : null;
    }
    partialLocation(currentFileName, partialName, originSelectionRange) {
        const viewFileExtensions = vscode_1.workspace.getConfiguration("railsPartial").viewFileExtensions;
        const fileBase = partialName.includes("/")
            ? path.join(this.rootPath, "app", "views", path.dirname(partialName), `_${path.basename(partialName)}`)
            : path.join(path.dirname(currentFileName), `_${partialName}`);
        const targetExt = viewFileExtensions.find(ext => {
            return fs_extra_1.pathExistsSync(`${fileBase}.${ext}`);
        });
        if (!targetExt) {
            return null;
        }
        return [
            {
                originSelectionRange,
                targetUri: vscode_1.Uri.file(`${fileBase}.${targetExt}`),
                targetRange: new vscode_1.Range(new vscode_1.Position(0, 0), new vscode_1.Position(0, 0))
            }
        ];
    }
}
exports.default = PartialDefinitionProvider;
//# sourceMappingURL=PartialDefinitionProvider.js.map