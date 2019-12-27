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
const execa = require("execa");
const vscode_1 = require("vscode");
const REGEX = /.+?:(\d+) \[(W|E)] (\w+): (.+)/g;
class Linter {
    constructor() {
        this.collection = vscode_1.languages.createDiagnosticCollection("slim-lint");
        this.processes = new WeakMap();
    }
    /**
     * dispose
     */
    dispose() {
        this.collection.dispose();
    }
    /**
     * run
     */
    run(document) {
        if (document.languageId !== "slim") {
            return;
        }
        this.lint(document);
    }
    /**
     * clear
     */
    clear(document) {
        if (document.uri.scheme === "file") {
            this.collection.delete(document.uri);
        }
    }
    lint(document) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = document.getText();
            const oldProcess = this.processes.get(document);
            if (oldProcess) {
                oldProcess.kill();
            }
            const executablePath = vscode_1.workspace.getConfiguration("slimLint")
                .executablePath;
            let configurationPath = vscode_1.workspace.getConfiguration("slimLint")
                .configurationPath;
            const [command, ...args] = executablePath.split(/\s+/);
            if (configurationPath === ".slim-lint.yml" && vscode_1.workspace.workspaceFolders) {
                configurationPath =
                    vscode_1.workspace.workspaceFolders[0].uri.fsPath + "/" + configurationPath;
            }
            args.push("--config", configurationPath);
            const process = execa(command, [...args, document.uri.fsPath], {
                reject: false
            });
            this.processes.set(document, process);
            const { code, stdout } = yield process;
            this.processes.delete(document);
            if (text !== document.getText()) {
                return;
            }
            this.collection.delete(document.uri);
            if (code === 0) {
                return;
            }
            this.collection.set(document.uri, this.parse(stdout, document));
        });
    }
    parse(output, document) {
        const diagnostics = [];
        let match = REGEX.exec(output);
        while (match !== null) {
            const severity = match[2] === "W"
                ? vscode_1.DiagnosticSeverity.Warning
                : vscode_1.DiagnosticSeverity.Error;
            const line = Math.max(Number.parseInt(match[1], 10) - 1, 0);
            const ruleName = match[3];
            const message = match[4];
            const lineText = document.lineAt(line);
            const lineTextRange = lineText.range;
            const range = new vscode_1.Range(new vscode_1.Position(lineTextRange.start.line, lineText.firstNonWhitespaceCharacterIndex), lineTextRange.end);
            diagnostics.push(new vscode_1.Diagnostic(range, `${ruleName}: ${message}`, severity));
            match = REGEX.exec(output);
        }
        return diagnostics;
    }
}
exports.default = Linter;
//# sourceMappingURL=linter.js.map