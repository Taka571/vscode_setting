'use strict';
const vscode = require("vscode");
class TimePeriodController {
    constructor(timeCalculator) {
        this._timeCalculator = timeCalculator;
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
        // subscribe to selection change and editor activation events
        const subscriptions = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        // update the counter for the current file
        this.updateTimePeriod();
        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }
    dispose() {
        this._statusBarItem.dispose();
        this._disposable.dispose();
    }
    updateTimePeriod() {
        // Get the current text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }
        const doc = editor.document;
        // Only update status if an log file
        if (doc.languageId === 'log') {
            this._statusBarItem.text = '';
            // Get the selections first and last non empty line
            const firstLine = doc.lineAt(editor.selection.start.line);
            let lastLine;
            // If last line is not partially selected use last but first line
            if (editor.selection.end.character === 0) {
                lastLine = doc.lineAt(editor.selection.end.line - 1);
            }
            else {
                lastLine = doc.lineAt(editor.selection.end.line);
            }
            const timePeriod = firstLine.text !== lastLine.text ? this._timeCalculator.getTimePeriod(firstLine.text, lastLine.text) : undefined;
            if (timePeriod !== undefined) {
                // Update the status bar
                this._statusBarItem.text = this._timeCalculator.convertToDisplayString(timePeriod);
                this._statusBarItem.show();
            }
            else {
                this._statusBarItem.hide();
            }
        }
        else {
            this._statusBarItem.hide();
        }
    }
    _onEvent() {
        this.updateTimePeriod();
    }
}
module.exports = TimePeriodController;
//# sourceMappingURL=TimePeriodController.js.map