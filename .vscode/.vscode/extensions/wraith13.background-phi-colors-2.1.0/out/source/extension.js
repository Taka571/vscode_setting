"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const phi_colors_1 = require("phi-colors");
const package_nls_json_1 = __importDefault(require("../package.nls.json"));
const package_nls_ja_json_1 = __importDefault(require("../package.nls.ja.json"));
const localeTableKey = JSON.parse(process.env.VSCODE_NLS_CONFIG).locale;
const localeTable = Object.assign(package_nls_json_1.default, ({
    ja: package_nls_ja_json_1.default
}[localeTableKey] || {}));
const localeString = (key) => localeTable[key] || key;
const getTicks = () => new Date().getTime();
const roundCenti = (value) => Math.round(value * 100) / 100;
const percentToDisplayString = (value, locales) => `${roundCenti(value).toLocaleString(locales, { style: "percent" })}`;
const isCompatibleArray = (a, b) => !a.some(i => b.indexOf(i) < 0) &&
    !b.some(i => a.indexOf(i) < 0);
const objctToMap = (object) => new Map(Object.keys(object).map(key => [key, object[key]]));
var Profiler;
(function (Profiler) {
    let profileScore = {};
    let entryStack = [];
    let isProfiling = false;
    let startAt = 0;
    let endAt = 0;
    class ProfileEntry {
        constructor(name) {
            this.name = name;
            this.childrenTicks = 0;
            if (isProfiling) {
                this.startTicks = getTicks();
                entryStack.push(this);
                //console.log(`${"*".repeat(entryStack.length)} ${this.name} begin`);
            }
            else {
                this.startTicks = 0;
            }
        }
        end() {
            if (0 !== this.startTicks) {
                //console.log(`${"*".repeat(entryStack.length)} ${this.name} end`);
                const wholeTicks = getTicks() - this.startTicks;
                if (undefined === profileScore[this.name]) {
                    profileScore[this.name] = 0;
                }
                profileScore[this.name] += wholeTicks - this.childrenTicks;
                entryStack.pop();
                if (0 < entryStack.length) {
                    entryStack[entryStack.length - 1].childrenTicks += wholeTicks;
                }
            }
        }
    }
    Profiler.ProfileEntry = ProfileEntry;
    Profiler.profile = (name, target) => {
        const entry = new ProfileEntry(name);
        try {
            return target();
        }
        catch (error) // 現状(VS Code v1.32.3)、こうしておかないとデバッグコンソールに例外情報が出力されない為の処置。
         {
            console.error(`Exception at: ${name}`);
            console.error(error);
            throw error; // ※この再送出により外側のこの関数で再び catch し重複してエラーが出力されることに注意。
        }
        finally {
            entry.end();
        }
    };
    Profiler.getIsProfiling = () => isProfiling;
    Profiler.start = () => {
        isProfiling = true;
        profileScore = {};
        entryStack = [];
        startAt = getTicks();
    };
    Profiler.stop = () => {
        isProfiling = false;
        endAt = getTicks();
    };
    Profiler.getOverall = () => (isProfiling ? getTicks() : endAt) - startAt;
    Profiler.getReport = () => Object.keys(profileScore)
        .map(name => ({
        name,
        ticks: profileScore[name]
    }))
        .sort((a, b) => b.ticks - a.ticks);
})(Profiler = exports.Profiler || (exports.Profiler = {}));
var BackgroundPhiColors;
(function (BackgroundPhiColors) {
    const applicationKey = "backgroundPhiColors";
    class Cache {
        constructor(loader) {
            this.loader = loader;
            this.cache = {};
            this.get = (key) => this.getCore(key, JSON.stringify(key));
            this.getCore = (key, keyJson) => undefined === this.cache[keyJson] ?
                (this.cache[keyJson] = this.loader(key)) :
                this.cache[keyJson];
            this.clear = () => this.cache = {};
        }
    }
    class Config {
        constructor(name, defaultValue, validator, minValue, maxValue) {
            this.name = name;
            this.defaultValue = defaultValue;
            this.validator = validator;
            this.minValue = minValue;
            this.maxValue = maxValue;
            this.regulate = (rawKey, value) => {
                let result = value;
                if (this.validator && !this.validator(result)) {
                    // settings.json をテキストとして直接編集してる時はともかく GUI での編集時に無駄にエラー表示が行われてしまうので、エンドユーザーに対するエラー表示は行わない。
                    //vscode.window.showErrorMessage(`${rawKey} setting value is invalid! Please check your settings.`);
                    console.error(`${rawKey} setting value is invalid! Please check your settings.`);
                    result = this.defaultValue;
                }
                else {
                    if (undefined !== this.minValue && result < this.minValue) {
                        result = this.minValue;
                    }
                    else if (undefined !== this.maxValue && this.maxValue < result) {
                        result = this.maxValue;
                    }
                }
                return result;
            };
            this.cache = new Cache((lang) => {
                let result;
                if (undefined === lang || null === lang || 0 === lang.length) {
                    result = vscode.workspace.getConfiguration(applicationKey)[this.name];
                    if (undefined === result) {
                        result = this.defaultValue;
                    }
                    else {
                        result = this.regulate(`${applicationKey}.${this.name}`, result);
                    }
                }
                else {
                    const langSection = vscode.workspace.getConfiguration(`[${lang}]`, null);
                    result = langSection[`${applicationKey}.${this.name}`];
                    if (undefined === result) {
                        result = this.get("");
                    }
                    else {
                        result = this.regulate(`[${lang}].${applicationKey}.${this.name}`, result);
                    }
                }
                return result;
            });
            this.get = this.cache.get;
            this.clear = this.cache.clear;
        }
    }
    const colorValidator = (value) => /^#[0-9A-Fa-f]{6}$/.test(value);
    const colorOrNullValidator = (value) => null === value || colorValidator(value);
    const colorMapValidator = (value) => undefined !== value &&
        null !== value &&
        !Object.keys(value).some(key => !colorOrNullValidator(value[key]));
    const makeEnumValidator = (valueList) => (value) => 0 <= valueList.indexOf(value);
    const indentModeObject = Object.freeze({ "none": null, "light": null, "smart": null, "full": null, });
    const tokenModeObject = Object.freeze({ "none": null, "light": null, "smart": null, "full": null, });
    const activeScopeObject = Object.freeze({ "editor": null, "document": null, "window": null, });
    const laneObject = Object.freeze({
        "none": undefined,
        "left": vscode.OverviewRulerLane.Left,
        "center": vscode.OverviewRulerLane.Center,
        "right": vscode.OverviewRulerLane.Right,
        "full": vscode.OverviewRulerLane.Full,
    });
    const indentObject = Object.freeze({
        "auto": null,
        "tab": "\t",
        "1 space": " ",
        "2 spaces": "  ",
        "3 spaces": "   ",
        "4 spaces": "    ",
        "5 spaces": "     ",
        "6 spaces": "      ",
        "7 spaces": "       ",
        "8 spaces": "        ",
    });
    const overTheLimitMessageShowModeObject = Object.freeze({
        "none": (rate) => false,
        "until 16x": (rate) => rate <= 16,
        "until 256x": (rate) => rate <= 256,
        "always": (rate) => true,
    });
    const enabled = new Config("enabled", true);
    const enabledPanels = new Config("enabledPanels", false);
    const fileSizeLimit = new Config("fileSizeLimit", 100 * 1024, undefined, 10 * 1024, 10 * 1024 * 1024);
    const basicDelay = new Config("basicDelay", 10, undefined, 1, 1500);
    const additionalDelay = new Config("additionalDelay", 200, undefined, 50, 1500);
    const baseColor = new Config("baseColor", "#5679C9", colorValidator);
    const spaceBaseColor = new Config("spaceBaseColor", null, colorOrNullValidator);
    const spaceErrorColor = new Config("spaceErrorColor", "#DD4444", colorValidator);
    const symbolBaseColor = new Config("symbolBaseColor", null, colorOrNullValidator);
    const symbolColorMap = new Config("symbolColorMap", {}, colorMapValidator);
    const tokenBaseColor = new Config("tokenBaseColor", null, colorOrNullValidator);
    const tokenColorMap = new Config("tokenColorMap", {}, colorMapValidator);
    const indentMode = new Config("indentMode", "full", makeEnumValidator(Object.keys(indentModeObject)));
    const lineEnabled = new Config("lineEnabled", true);
    const tokenMode = new Config("tokenMode", "smart", makeEnumValidator(Object.keys(tokenModeObject)));
    const activeScope = new Config("activeScope", "window", makeEnumValidator(Object.keys(activeScopeObject)));
    const indentErrorEnabled = new Config("indentErrorEnabled", true);
    const trailingSpacesErrorEnabled = new Config("trailingSpacesErrorEnabled", true);
    const bodySpacesEnabled = new Config("bodySpacesEnabled", true);
    const trailingSpacesEnabled = new Config("trailingSpacesEnabled", true);
    const symbolEnabled = new Config("symbolEnabled", false);
    const indentErrorInOverviewRulerLane = new Config("indentErrorInOverviewRulerLane", "left", makeEnumValidator(Object.keys(laneObject)));
    const activeTokenInOverviewRulerLane = new Config("activeTokenInOverviewRulerLane", "center", makeEnumValidator(Object.keys(laneObject)));
    const trailingSpacesErrorInOverviewRulerLane = new Config("trailingSpacesErrorInOverviewRulerLane", "right", makeEnumValidator(Object.keys(laneObject)));
    const spacesAlpha = new Config("spacesAlpha", 0x11, undefined, 0x00, 0xFF);
    const spacesActiveAlpha = new Config("spacesActiveAlpha", 0x33, undefined, 0x00, 0xFF);
    const spacesErrorAlpha = new Config("spacesErrorAlpha", 0x88, undefined, 0x00, 0xFF);
    const symbolAlpha = new Config("symbolAlpha", 0x44, undefined, 0x00, 0xFF);
    const tokenAlpha = new Config("tokenAlpha", 0x33, undefined, 0x00, 0xFF);
    const tokenActiveAlpha = new Config("tokenActiveAlpha", 0x66, undefined, 0x00, 0xFF);
    const indentConfig = new Config("indent", "auto", makeEnumValidator(Object.keys(indentObject)));
    const enabledProfile = new Config("enabledProfile", true);
    const overTheLimitMessageShowMode = new Config("overTheLimitMessageShowMode", "until 256x", makeEnumValidator(Object.keys(overTheLimitMessageShowModeObject)));
    const isDecorated = {};
    const isOverTheLimit = {};
    const isLimitNoticed = {};
    let isMutedAll = undefined;
    let isPausedAll = false;
    let profilerOutputChannel = undefined;
    const getProfilerOutputChannel = () => profilerOutputChannel ?
        profilerOutputChannel :
        (profilerOutputChannel = vscode.window.createOutputChannel("Background Phi Colors Profiler"));
    let mapCache = new Cache((object) => object ? objctToMap(object) : new Map());
    let lastActiveTextEditor = undefined;
    let hslaCache = new Cache((color) => phi_colors_1.phiColors.rgbaToHsla(phi_colors_1.phiColors.rgbaFromStyle(color)));
    BackgroundPhiColors.makeHueDecoration = (name, lang, color, hue, alpha, overviewRulerLane, isWholeLine) => ({
        name,
        base: hslaCache.get("number" === typeof hue ?
            color.get(lang) || baseColor.get(lang) :
            hue),
        hue: "number" === typeof hue ? hue : 0,
        alpha: alpha.get(lang),
        overviewRulerLane: overviewRulerLane,
        isWholeLine,
    });
    const makeIndentErrorDecorationParam = (lang) => ({
        name: "indenet:error",
        base: hslaCache.get(spaceErrorColor.get(lang)),
        hue: 0,
        alpha: spacesErrorAlpha.get(lang),
        overviewRulerLane: laneObject[indentErrorInOverviewRulerLane.get(lang)],
    });
    const makeTrailingSpacesErrorDecorationParam = (lang) => ({
        name: "trailing-spaces",
        base: hslaCache.get(spaceErrorColor.get(lang)),
        hue: 0,
        alpha: spacesErrorAlpha.get(lang),
        overviewRulerLane: laneObject[trailingSpacesErrorInOverviewRulerLane.get(lang)],
    });
    let decorations = {};
    BackgroundPhiColors.initialize = (context) => {
        context.subscriptions.push(
        //  コマンドの登録
        vscode.commands.registerCommand(`${applicationKey}.activeScopeEditor`, () => vscode.workspace.getConfiguration(applicationKey).update("activeScope", "editor", true)), vscode.commands.registerCommand(`${applicationKey}.activeScopeDocument`, () => vscode.workspace.getConfiguration(applicationKey).update("activeScope", "document", true)), vscode.commands.registerCommand(`${applicationKey}.activeScopeWindow`, () => vscode.workspace.getConfiguration(applicationKey).update("activeScope", "window", true)), vscode.commands.registerCommand(`${applicationKey}.toggleMute`, () => activeTextEditor(BackgroundPhiColors.toggleMute)), vscode.commands.registerCommand(`${applicationKey}.toggleMuteAll`, () => {
            isMutedAll = !isMutedAll;
            editorDecorationCache.forEach(i => i.isMuted = undefined);
            isPausedAll = false;
            editorDecorationCache.forEach(i => i.isPaused = undefined);
            BackgroundPhiColors.updateAllDecoration();
        }), vscode.commands.registerCommand(`${applicationKey}.togglePause`, () => activeTextEditor(BackgroundPhiColors.togglePause)), vscode.commands.registerCommand(`${applicationKey}.togglePauseAll`, () => {
            isPausedAll = !isPausedAll;
            editorDecorationCache.forEach(i => i.isPaused = undefined);
            BackgroundPhiColors.updateAllDecoration();
        }), vscode.commands.registerCommand(`${applicationKey}.overTheLimig`, () => activeTextEditor(BackgroundPhiColors.overTheLimit)), vscode.commands.registerCommand(`${applicationKey}.startProfile`, () => {
            const outputChannel = getProfilerOutputChannel();
            outputChannel.show();
            if (Profiler.getIsProfiling()) {
                outputChannel.appendLine(localeString("🚫 You have already started the profile."));
            }
            else {
                outputChannel.appendLine(`${localeString("⏱ Start Profile!")} - ${new Date()}`);
                Profiler.start();
            }
        }), vscode.commands.registerCommand(`${applicationKey}.stopProfile`, () => {
            const outputChannel = getProfilerOutputChannel();
            outputChannel.show();
            if (Profiler.getIsProfiling()) {
                Profiler.stop();
                outputChannel.appendLine(`${localeString("🏁 Stop Profile!")} - ${new Date()}`);
                outputChannel.appendLine(localeString("📊 Profile Report"));
                const total = Profiler.getReport().map(i => i.ticks).reduce((p, c) => p + c);
                outputChannel.appendLine(`- Total: ${total.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                Profiler.getReport().forEach(i => outputChannel.appendLine(`- ${i.name}: ${i.ticks.toLocaleString()}ms ( ${percentToDisplayString(i.ticks / total)} )`));
            }
            else {
                outputChannel.appendLine(localeString("🚫 Profile has not been started."));
            }
        }), vscode.commands.registerCommand(`${applicationKey}.reportProfile`, () => {
            const outputChannel = getProfilerOutputChannel();
            outputChannel.show();
            if (Profiler.getIsProfiling()) {
                outputChannel.appendLine(`${localeString("📊 Profile Report")} - ${new Date()}`);
                const overall = Profiler.getOverall();
                const total = Profiler.getReport().map(i => i.ticks).reduce((p, c) => p + c);
                outputChannel.appendLine(localeString("⚖ Overview"));
                outputChannel.appendLine(`- Overall: ${overall.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                outputChannel.appendLine(`- Busy: ${total.toLocaleString()}ms ( ${percentToDisplayString(total / overall)} )`);
                outputChannel.appendLine(localeString("🔬 Busy Details"));
                outputChannel.appendLine(`- Total: ${total.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                Profiler.getReport().forEach(i => outputChannel.appendLine(`- ${i.name}: ${i.ticks.toLocaleString()}ms ( ${percentToDisplayString(i.ticks / total)} )`));
                outputChannel.appendLine("");
            }
            else {
                outputChannel.appendLine(localeString("🚫 Profile has not been started."));
            }
        }), 
        //  イベントリスナーの登録
        vscode.workspace.onDidChangeConfiguration(() => BackgroundPhiColors.onDidChangeConfiguration()), vscode.workspace.onDidChangeWorkspaceFolders(() => BackgroundPhiColors.onDidChangeWorkspaceFolders()), vscode.workspace.onDidChangeTextDocument(event => BackgroundPhiColors.onDidChangeTextDocument(event.document)), vscode.workspace.onDidCloseTextDocument((document) => BackgroundPhiColors.onDidCloseTextDocument(document)), vscode.window.onDidChangeActiveTextEditor(() => BackgroundPhiColors.onDidChangeActiveTextEditor()), vscode.window.onDidChangeTextEditorSelection(() => BackgroundPhiColors.onDidChangeTextEditorSelection()));
        startOrStopProfile();
        BackgroundPhiColors.updateAllDecoration();
    };
    const startOrStopProfile = () => {
        if (Profiler.getIsProfiling() !== enabledProfile.get("")) {
            if (enabledProfile.get("")) {
                Profiler.start();
            }
            else {
                Profiler.stop();
            }
        }
    };
    const valueThen = (value, f) => {
        if (value) {
            f(value);
        }
    };
    const activeTextEditor = (f) => valueThen(vscode.window.activeTextEditor, f);
    BackgroundPhiColors.toggleMute = (textEditor) => {
        const currentEditorDecorationCache = editorDecorationCache.get(textEditor);
        if (currentEditorDecorationCache) {
            currentEditorDecorationCache.isMuted =
                undefined === currentEditorDecorationCache.isMuted ?
                    !isMutedAll :
                    !currentEditorDecorationCache.isMuted;
            currentEditorDecorationCache.isPaused = undefined;
            BackgroundPhiColors.delayUpdateDecoration(textEditor);
        }
    };
    BackgroundPhiColors.togglePause = (textEditor) => {
        const currentEditorDecorationCache = editorDecorationCache.get(textEditor);
        if (currentEditorDecorationCache) {
            currentEditorDecorationCache.isPaused =
                undefined === currentEditorDecorationCache.isPaused ?
                    !isPausedAll :
                    !currentEditorDecorationCache.isPaused;
            if (!currentEditorDecorationCache.isPaused) {
                BackgroundPhiColors.delayUpdateDecoration(textEditor);
            }
        }
    };
    BackgroundPhiColors.overTheLimit = (textEditor) => {
        isOverTheLimit[textEditor.document.fileName] = true;
        vscode.window.visibleTextEditors.filter(i => i.document === textEditor.document).forEach(i => BackgroundPhiColors.delayUpdateDecoration(i));
    };
    const isIndentInfoNeed = (lang) => {
        const showActive = 0 <= ["smart", "full"].indexOf(indentMode.get(lang));
        const showRegular = 0 <= ["light", "full"].indexOf(indentMode.get(lang));
        return showActive || showRegular || lineEnabled.get(lang);
    };
    const windowDecorationCache = {
        strongTokens: [],
    };
    class DocumentDecorationCacheEntry {
        constructor(lang, text, tabSize) {
            this.isDefaultIndentCharactorSpace = false;
            this.indentUnit = "";
            this.indentUnitSize = 0;
            this.indentLevelMap = [[]];
            this.indents = []; // これをここに持っておくのはメモリの消費量的には避けたいところだが、どうせタブ切り替えの度に必要になり、削ったところであまり意味のあるメモリ節約にならないのでキャッシュしておく。
            this.strongTokens = [];
            Profiler.profile("DocumentDecorationCacheEntry.constructor", () => {
                if (isIndentInfoNeed(lang)) {
                    const indentSizeDistribution = {};
                    this.indents = BackgroundPhiColors.getIndents(text);
                    const indentUnitConfig = indentObject[indentConfig.get(lang)];
                    if (null === indentUnitConfig) {
                        let totalSpaces = 0;
                        let totalTabs = 0;
                        this.indents.forEach(indent => {
                            const length = indent.text.length;
                            const tabs = indent.text.replace(/ /g, "").length;
                            const spaces = length - tabs;
                            totalSpaces += spaces;
                            totalTabs += tabs;
                            const indentSize = BackgroundPhiColors.getIndentSize(indent.text, tabSize);
                            if (indentSizeDistribution[indentSize]) {
                                ++indentSizeDistribution[indentSize];
                            }
                            else {
                                indentSizeDistribution[indentSize] = 1;
                            }
                        });
                        this.isDefaultIndentCharactorSpace = totalTabs * tabSize <= totalSpaces;
                        this.indentUnit = BackgroundPhiColors.getIndentUnit(indentSizeDistribution, tabSize, this.isDefaultIndentCharactorSpace);
                    }
                    else {
                        this.indentUnit = indentUnitConfig;
                        this.isDefaultIndentCharactorSpace = /^ +$/.test(indentUnitConfig);
                    }
                    this.indentUnitSize = BackgroundPhiColors.getIndentSize(this.indentUnit, tabSize);
                }
            });
        }
    }
    const documentDecorationCache = new Map();
    class EditorDecorationCacheEntry {
        constructor(textEditor, tabSize, currentDocumentDecorationCache, previousEditorDecorationCache) {
            this.tabSize = 0;
            this.indentIndex = 0;
            this.strongTokens = [];
            this.isCleared = false;
            this.getLineNumber = () => undefined !== this.line ? this.line.lineNumber : undefined;
            this.selection = textEditor.selection;
            this.line = textEditor.document.lineAt(textEditor.selection.active.line);
            this.tabSize = tabSize;
            const isActiveTextEditor = lastActiveTextEditor === textEditor;
            if (isIndentInfoNeed(textEditor.document.languageId) && (isActiveTextEditor || "editor" === activeScope.get(""))) {
                const currentIndentSize = BackgroundPhiColors.getIndentSize(this.line
                    .text
                    .substr(0, textEditor.selection.active.character)
                    .replace(/[^ \t]+.*$/, ""), tabSize);
                this.indentIndex = Math.floor(currentIndentSize / currentDocumentDecorationCache.indentUnitSize);
            }
            else {
                this.indentIndex = undefined;
                this.line = undefined;
            }
            if (previousEditorDecorationCache) {
                this.isMuted = previousEditorDecorationCache.isMuted;
                this.isPaused = previousEditorDecorationCache.isPaused;
                //this.isCleared = previousEditorDecorationCache.isCleared; このフラグをリセットするべきタイミングがちょうどこの constructor が呼ばれるタイミングなので、これは引き継がない。
            }
        }
    }
    const editorDecorationCache = new Map();
    BackgroundPhiColors.clearAllDecorationCache = () => {
        windowDecorationCache.strongTokens = [];
        documentDecorationCache.clear();
        editorDecorationCache.clear();
    };
    BackgroundPhiColors.clearDecorationCache = (document) => {
        if (document) {
            documentDecorationCache.delete(document);
            for (const textEditor of editorDecorationCache.keys()) {
                if (document === textEditor.document) {
                    editorDecorationCache.delete(textEditor);
                }
            }
        }
        else {
            for (const textEditor of editorDecorationCache.keys()) {
                if (vscode.window.visibleTextEditors.indexOf(textEditor) < 0) {
                    editorDecorationCache.delete(textEditor);
                }
            }
        }
    };
    BackgroundPhiColors.onDidChangeConfiguration = () => {
        [
            enabled,
            enabledPanels,
            fileSizeLimit,
            basicDelay,
            additionalDelay,
            baseColor,
            spaceBaseColor,
            spaceErrorColor,
            symbolBaseColor,
            symbolColorMap,
            tokenBaseColor,
            tokenColorMap,
            indentMode,
            lineEnabled,
            tokenMode,
            activeScope,
            indentErrorEnabled,
            trailingSpacesErrorEnabled,
            bodySpacesEnabled,
            trailingSpacesEnabled,
            symbolEnabled,
            indentErrorInOverviewRulerLane,
            activeTokenInOverviewRulerLane,
            trailingSpacesErrorInOverviewRulerLane,
            spacesAlpha,
            spacesActiveAlpha,
            spacesErrorAlpha,
            symbolAlpha,
            tokenAlpha,
            tokenActiveAlpha,
            indentConfig,
            enabledProfile,
            overTheLimitMessageShowMode,
        ]
            .forEach(i => i.clear());
        mapCache.clear();
        Object.keys(decorations).forEach(i => decorations[i].decorator.dispose());
        decorations = {};
        BackgroundPhiColors.clearAllDecorationCache();
        startOrStopProfile();
        BackgroundPhiColors.updateAllDecoration();
    };
    const lastUpdateStamp = new Map();
    BackgroundPhiColors.delayUpdateDecoration = (textEditor) => {
        const updateStamp = getTicks();
        lastUpdateStamp.set(textEditor, updateStamp);
        setTimeout(() => {
            if (lastUpdateStamp.get(textEditor) === updateStamp) {
                lastUpdateStamp.delete(textEditor);
                updateDecoration(textEditor);
            }
        }, basicDelay.get(textEditor.document.languageId) +
            (undefined === documentDecorationCache.get(textEditor.document) ?
                additionalDelay.get(textEditor.document.languageId) :
                0));
    };
    BackgroundPhiColors.updateAllDecoration = () => vscode.window.visibleTextEditors.forEach(i => BackgroundPhiColors.delayUpdateDecoration(i));
    BackgroundPhiColors.onDidChangeWorkspaceFolders = BackgroundPhiColors.onDidChangeConfiguration;
    BackgroundPhiColors.onDidChangeActiveTextEditor = () => {
        BackgroundPhiColors.clearDecorationCache();
        activeTextEditor(BackgroundPhiColors.delayUpdateDecoration);
    };
    BackgroundPhiColors.onDidCloseTextDocument = BackgroundPhiColors.clearDecorationCache;
    BackgroundPhiColors.onDidChangeTextDocument = (document) => {
        BackgroundPhiColors.clearDecorationCache(document);
        vscode.window.visibleTextEditors
            .filter(i => i.document === document)
            .forEach(i => BackgroundPhiColors.delayUpdateDecoration(i));
    };
    BackgroundPhiColors.onDidChangeTextEditorSelection = () => activeTextEditor(textEditor => {
        const lang = textEditor.document.languageId;
        if ([
            indentMode,
            tokenMode
        ]
            .map(i => i.get(lang))
            .some(i => 0 <= ["smart", "full"].indexOf(i)) ||
            lineEnabled.get(lang)) {
            BackgroundPhiColors.delayUpdateDecoration(textEditor);
        }
    });
    BackgroundPhiColors.gcd = (a, b) => b ? BackgroundPhiColors.gcd(b, a % b) : a;
    BackgroundPhiColors.getIndentSize = (text, tabSize) => {
        let delta = 0;
        return text.replace(/\t/g, (s, offset) => {
            const length = tabSize - ((offset + delta) % tabSize);
            delta += (length - 1);
            return s.repeat(length);
        }).length;
    };
    BackgroundPhiColors.getIndentUnit = (indentSizeDistribution, tabSize, isDefaultIndentCharactorSpace) => Profiler.profile("getIndentUnit", () => {
        if (isDefaultIndentCharactorSpace) {
            let indentUnitSize = tabSize;
            if (0 < Object.keys(indentSizeDistribution).length) {
                const sortedIndentSizeDistribution = Object.keys(indentSizeDistribution)
                    .map(key => parseInt(key))
                    .map(key => ({ indentSize: key, Count: indentSizeDistribution[key], }))
                    .sort((a, b) => b.Count - a.Count);
                if (1 < sortedIndentSizeDistribution.length) {
                    const failingLine = sortedIndentSizeDistribution[0].Count / 10;
                    const topIndentSizeDistribution = sortedIndentSizeDistribution.filter((i, index) => failingLine < i.Count && index < 10);
                    indentUnitSize = topIndentSizeDistribution.map(i => i.indentSize).reduce((a, b) => BackgroundPhiColors.gcd(a, b));
                }
                else {
                    indentUnitSize = sortedIndentSizeDistribution[0].indentSize;
                }
            }
            return " ".repeat(indentUnitSize);
        }
        return "\t";
    });
    const makeRange = (textEditor, startPosition, length) => new vscode.Range(textEditor.document.positionAt(startPosition), textEditor.document.positionAt(startPosition + length));
    const updateDecoration = (textEditor) => Profiler.profile("updateDecoration", () => {
        const lang = textEditor.document.languageId;
        const text = textEditor.document.getText();
        const previousEditorDecorationCache = editorDecorationCache.get(textEditor);
        const isMuted = previousEditorDecorationCache && undefined !== previousEditorDecorationCache.isMuted ?
            previousEditorDecorationCache.isMuted :
            isMutedAll;
        const isPaused = previousEditorDecorationCache &&
            (undefined === previousEditorDecorationCache.isPaused ? isPausedAll : previousEditorDecorationCache.isPaused);
        const isCleared = previousEditorDecorationCache && previousEditorDecorationCache.isCleared;
        const isEnabled = undefined !== isMuted ?
            !isMuted :
            (enabled.get(lang) && (textEditor.viewColumn || enabledPanels.get(lang)));
        if (isEnabled && vscode.window.activeTextEditor === textEditor) {
            lastActiveTextEditor = vscode.window.activeTextEditor;
        }
        const isActiveTextEditor = lastActiveTextEditor === textEditor;
        //  clear
        Profiler.profile("updateDecoration.clear", () => Object.keys(decorations).forEach(i => decorations[i].rangesOrOptions = []));
        if (isEnabled && (!isPaused || isCleared)) {
            if (text.length <= fileSizeLimit.get(lang) || isOverTheLimit[textEditor.document.fileName]) {
                const tabSize = undefined !== previousEditorDecorationCache ?
                    previousEditorDecorationCache.tabSize :
                    (undefined === textEditor.options.tabSize ?
                        4 :
                        ("number" === typeof textEditor.options.tabSize ?
                            textEditor.options.tabSize :
                            parseInt(textEditor.options.tabSize)));
                const currentDocumentDecorationCache = documentDecorationCache.get(textEditor.document) || new DocumentDecorationCacheEntry(lang, text, tabSize);
                const currentEditorDecorationCache = new EditorDecorationCacheEntry(textEditor, tabSize, currentDocumentDecorationCache, previousEditorDecorationCache);
                const validPreviousEditorDecorationCache = isCleared ? undefined : previousEditorDecorationCache;
                let entry = [];
                //  update
                entry = entry.concat(BackgroundPhiColors.updateIndentDecoration(lang, text, textEditor, currentDocumentDecorationCache, currentEditorDecorationCache, validPreviousEditorDecorationCache));
                if (lineEnabled.get(lang)) {
                    entry = entry.concat(BackgroundPhiColors.updateLineDecoration(lang, text, textEditor, currentDocumentDecorationCache, currentEditorDecorationCache, validPreviousEditorDecorationCache));
                }
                if ("none" !== tokenMode.get(lang)) {
                    const showActive = 0 <= ["smart", "full"].indexOf(tokenMode.get(lang));
                    const showRegular = 0 <= ["light", "full"].indexOf(tokenMode.get(lang));
                    if (showActive) {
                        if (isActiveTextEditor || "editor" === activeScope.get("")) {
                            currentEditorDecorationCache.strongTokens = BackgroundPhiColors.regExpExecToArray(/\w+/gm, textEditor.document
                                .lineAt(textEditor.selection.active.line).text)
                                .map(i => i[0]);
                            switch (activeScope.get("")) {
                                case "editor":
                                    //currentEditorDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                    break;
                                case "document":
                                    if (!isCompatibleArray(currentEditorDecorationCache.strongTokens, currentDocumentDecorationCache.strongTokens)) {
                                        currentDocumentDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                        vscode.window.visibleTextEditors.filter(i => textEditor !== i && textEditor.document === i.document).forEach(i => BackgroundPhiColors.delayUpdateDecoration(i));
                                    }
                                    break;
                                case "window":
                                    if (!isCompatibleArray(currentEditorDecorationCache.strongTokens, windowDecorationCache.strongTokens)) {
                                        windowDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                        vscode.window.visibleTextEditors.filter(i => textEditor !== i).forEach(i => BackgroundPhiColors.delayUpdateDecoration(i));
                                    }
                                    break;
                            }
                        }
                        else {
                            switch (activeScope.get("")) {
                                case "editor":
                                    //currentEditorDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                    break;
                                case "document":
                                    currentEditorDecorationCache.strongTokens = currentDocumentDecorationCache.strongTokens;
                                    break;
                                case "window":
                                    currentEditorDecorationCache.strongTokens = windowDecorationCache.strongTokens;
                                    break;
                            }
                        }
                    }
                    else {
                        currentEditorDecorationCache.strongTokens = [];
                    }
                    if (!validPreviousEditorDecorationCache ||
                        (showActive &&
                            !isCompatibleArray(currentEditorDecorationCache.strongTokens, validPreviousEditorDecorationCache.strongTokens))) {
                        entry = entry.concat(BackgroundPhiColors.updateTokesDecoration(lang, text, textEditor, tabSize, showRegular, currentEditorDecorationCache.strongTokens, mapCache.get(tokenColorMap.get(lang)), undefined !== validPreviousEditorDecorationCache ? validPreviousEditorDecorationCache.strongTokens : undefined));
                        if (validPreviousEditorDecorationCache) {
                            entry = entry.concat(validPreviousEditorDecorationCache.strongTokens
                                .filter(i => currentEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                .map(i => ({
                                startPosition: -1,
                                length: -1,
                                decorationParam: BackgroundPhiColors.makeHueDecoration(`token:${i}`, lang, tokenBaseColor, BackgroundPhiColors.hash(i), tokenActiveAlpha, laneObject[activeTokenInOverviewRulerLane.get(lang)])
                            })));
                            if (showRegular) {
                                entry = entry.concat(currentEditorDecorationCache.strongTokens
                                    .filter(i => validPreviousEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                    .map(i => ({
                                    startPosition: -1,
                                    length: -1,
                                    decorationParam: BackgroundPhiColors.makeHueDecoration(`token:${i}`, lang, tokenBaseColor, BackgroundPhiColors.hash(i), tokenAlpha)
                                })));
                            }
                        }
                    }
                }
                if (!validPreviousEditorDecorationCache && symbolEnabled.get(lang)) {
                    entry = entry.concat(BackgroundPhiColors.updateSymbolsDecoration(lang, text, textEditor, tabSize, mapCache.get(symbolColorMap.get(lang))));
                }
                if (!validPreviousEditorDecorationCache && bodySpacesEnabled.get(lang)) {
                    entry = entry.concat(BackgroundPhiColors.updateBodySpacesDecoration(lang, text, textEditor, tabSize));
                }
                if (!validPreviousEditorDecorationCache && trailingSpacesEnabled.get(lang)) {
                    entry = entry.concat(BackgroundPhiColors.updateTrailSpacesDecoration(lang, text, textEditor, tabSize, trailingSpacesErrorEnabled.get(lang)));
                }
                //  apply
                Profiler.profile("updateDecoration.apply(regular)", () => {
                    entry.forEach(i => BackgroundPhiColors.addDecoration(textEditor, i));
                    const isToDecorate = 0 < entry.length; //Object.keys(decorations).some(i => 0 < decorations[i].rangesOrOptions.length);
                    if (isDecorated[textEditor.document.fileName] || isToDecorate) {
                        const currentDecorations = entry.map(i => JSON.stringify(i.decorationParam));
                        Object.keys(decorations)
                            .filter(i => !validPreviousEditorDecorationCache || 0 <= currentDecorations.indexOf(i))
                            .map(i => decorations[i])
                            .forEach(i => textEditor.setDecorations(i.decorator, i.rangesOrOptions));
                        isDecorated[textEditor.document.fileName] = isToDecorate;
                    }
                });
                documentDecorationCache.set(textEditor.document, currentDocumentDecorationCache);
                editorDecorationCache.set(textEditor, currentEditorDecorationCache);
            }
            else {
                BackgroundPhiColors.clearDecorationCache(textEditor.document);
                if (overTheLimitMessageShowModeObject[overTheLimitMessageShowMode.get(lang)](text.length / Math.min(fileSizeLimit.get(lang), 1024)) && // ここの Math.min は基本的に要らないんだけど、万が一にも fileSizeLimit が 0 になってゼロ除算を発生させない為の保険
                    !isLimitNoticed[textEditor.document.fileName]) {
                    isLimitNoticed[textEditor.document.fileName] = true;
                    vscode.window.showWarningMessage(localeString("%1 is too large! Background Phi Colors has been disabled. But you can over the limit!").replace("%1", textEditor.document.fileName), localeString("Close"), localeString("Over the limit")).then(i => {
                        if (localeString("Over the limit") === i) {
                            BackgroundPhiColors.overTheLimit(textEditor);
                        }
                    });
                }
            }
        }
        if (!isEnabled) {
            //  apply(for clear)
            Profiler.profile("updateDecoration.apply(clear)", () => {
                const isToDecorate = Object.keys(decorations).some(i => 0 < decorations[i].rangesOrOptions.length);
                if (isDecorated[textEditor.document.fileName] || isToDecorate) {
                    Object.keys(decorations).map(i => decorations[i]).forEach(i => textEditor.setDecorations(i.decorator, i.rangesOrOptions));
                    isDecorated[textEditor.document.fileName] = isToDecorate;
                }
            });
            if (previousEditorDecorationCache) {
                previousEditorDecorationCache.isCleared = true;
            }
        }
    });
    BackgroundPhiColors.addDecoration = (textEditor, entry) => {
        const key = JSON.stringify(entry.decorationParam);
        if (!decorations[key]) {
            decorations[key] =
                {
                    decorator: BackgroundPhiColors.createTextEditorDecorationType(phi_colors_1.phiColors.rgbForStyle(phi_colors_1.phiColors.hslaToRgba(phi_colors_1.phiColors.generate(entry.decorationParam.base, entry.decorationParam.hue, 0, 0, 0)))
                        + ((0x100 + entry.decorationParam.alpha).toString(16)).substr(1), entry.decorationParam.overviewRulerLane, entry.decorationParam.isWholeLine),
                    rangesOrOptions: []
                };
        }
        if (0 <= entry.length) {
            decorations[key].rangesOrOptions.push(entry.range ||
                makeRange(textEditor, entry.startPosition, entry.length));
        }
    };
    BackgroundPhiColors.getIndents = (text) => Profiler.profile("getIndents", () => BackgroundPhiColors.regExpExecToArray(/^([ \t]+)([^\r\n]*)$/gm, text)
        .map(match => ({
        index: match.index,
        text: match[1]
    })));
    BackgroundPhiColors.updateIndentDecoration = (lang, text, textEditor, currentDocumentDecorationCache, currentEditorDecorationCache, previousEditorDecorationCache) => Profiler.profile("updateIndentDecoration", () => {
        let result = [];
        const showActive = 0 <= ["smart", "full"].indexOf(indentMode.get(lang));
        const showRegular = 0 <= ["light", "full"].indexOf(indentMode.get(lang));
        if (showActive || showRegular) {
            const addIndentDecoration = (cursor, length, indent) => {
                return {
                    startPosition: cursor,
                    length,
                    decorationParam: BackgroundPhiColors.makeHueDecoration(`indent:${indent}`, lang, spaceBaseColor, indent, (showActive && currentEditorDecorationCache.indentIndex === indent) ? spacesActiveAlpha : spacesAlpha)
                };
            };
            if (previousEditorDecorationCache) {
                if (showActive && previousEditorDecorationCache.indentIndex !== currentEditorDecorationCache.indentIndex) {
                    if (undefined !== previousEditorDecorationCache.indentIndex) {
                        result.push({
                            startPosition: -1,
                            length: -1,
                            decorationParam: BackgroundPhiColors.makeHueDecoration(`indent:${previousEditorDecorationCache.indentIndex}`, lang, spaceBaseColor, previousEditorDecorationCache.indentIndex, spacesActiveAlpha)
                        });
                    }
                    if (undefined !== currentEditorDecorationCache.indentIndex && currentDocumentDecorationCache.indentLevelMap[currentEditorDecorationCache.indentIndex]) {
                        const indentIndex = currentEditorDecorationCache.indentIndex;
                        result = result.concat(currentDocumentDecorationCache.indentLevelMap[currentEditorDecorationCache.indentIndex]
                            .map(i => addIndentDecoration(i.cursor, i.length, indentIndex)));
                    }
                    if (showRegular) {
                        if (undefined !== previousEditorDecorationCache.indentIndex && currentDocumentDecorationCache.indentLevelMap[previousEditorDecorationCache.indentIndex]) {
                            const indentIndex = previousEditorDecorationCache.indentIndex;
                            result = result.concat(currentDocumentDecorationCache.indentLevelMap[previousEditorDecorationCache.indentIndex]
                                .map(i => addIndentDecoration(i.cursor, i.length, indentIndex)));
                        }
                        if (undefined !== currentEditorDecorationCache.indentIndex) {
                            result.push({
                                startPosition: -1,
                                length: -1,
                                decorationParam: BackgroundPhiColors.makeHueDecoration(`indent:${currentEditorDecorationCache.indentIndex}`, lang, spaceBaseColor, currentEditorDecorationCache.indentIndex, spacesAlpha)
                            });
                        }
                    }
                }
            }
            else {
                Profiler.profile("updateIndentDecoration.addDecoration", () => {
                    const showIndentError = indentErrorEnabled.get(lang);
                    const addErrorIndentDecoration = (cursor, length, indent) => ({
                        startPosition: cursor,
                        length,
                        decorationParam: makeIndentErrorDecorationParam(lang)
                    });
                    const addIndentLevelMap = (cursor, length, indent) => {
                        if (undefined === currentDocumentDecorationCache.indentLevelMap[indent]) {
                            currentDocumentDecorationCache.indentLevelMap[indent] = [];
                        }
                        currentDocumentDecorationCache.indentLevelMap[indent].push({ cursor, length });
                    };
                    currentDocumentDecorationCache.indents.forEach(indent => {
                        let text = indent.text;
                        let cursor = indent.index;
                        let length = 0;
                        for (let i = 0; 0 < text.length; ++i) {
                            cursor += length;
                            if (text.startsWith(currentDocumentDecorationCache.indentUnit)) {
                                length = currentDocumentDecorationCache.indentUnit.length;
                                addIndentLevelMap(cursor, length, i);
                                text = text.substr(currentDocumentDecorationCache.indentUnit.length);
                            }
                            else {
                                if (BackgroundPhiColors.getIndentSize(text, currentEditorDecorationCache.tabSize) < currentDocumentDecorationCache.indentUnitSize) {
                                    length = text.length;
                                    if (showIndentError) {
                                        result.push(addErrorIndentDecoration(cursor, length, i));
                                    }
                                    else {
                                        addIndentLevelMap(cursor, length, i);
                                    }
                                    text = "";
                                }
                                else {
                                    if (currentDocumentDecorationCache.isDefaultIndentCharactorSpace) {
                                        const spaces = text.length - text.replace(/^ +/, "").length;
                                        if (0 < spaces) {
                                            length = spaces;
                                            addIndentLevelMap(cursor, length, i);
                                            cursor += length;
                                        }
                                        length = 1;
                                        if (showIndentError) {
                                            result.push(addErrorIndentDecoration(cursor, length, i));
                                        }
                                        else {
                                            addIndentLevelMap(cursor, length, i);
                                        }
                                        const indentCount = Math.ceil(BackgroundPhiColors.getIndentSize(text.substr(0, spaces + 1), currentEditorDecorationCache.tabSize) / currentDocumentDecorationCache.indentUnitSize) - 1;
                                        i += indentCount;
                                        text = text.substr(spaces + 1);
                                    }
                                    else {
                                        const spaces = Math.min(text.length - text.replace(/^ +/, "").length, currentDocumentDecorationCache.indentUnitSize);
                                        length = spaces;
                                        if (showIndentError) {
                                            result.push(addErrorIndentDecoration(cursor, length, i));
                                        }
                                        else {
                                            addIndentLevelMap(cursor, length, i);
                                        }
                                        text = text.substr(spaces);
                                    }
                                }
                            }
                        }
                    });
                    result = result.concat(currentDocumentDecorationCache.indentLevelMap
                        .map((level, index) => showRegular || currentEditorDecorationCache.indentIndex === index ?
                        level.map(i => addIndentDecoration(i.cursor, i.length, index)) :
                        [])
                        .reduce((a, b) => a.concat(b)));
                });
            }
        }
        return result;
    });
    BackgroundPhiColors.updateLineDecoration = (lang, text, textEditor, currentDocumentDecorationCache, currentEditorDecorationCache, previousEditorDecorationCache) => Profiler.profile("updateLineDecoration", () => {
        let result = [];
        if (!previousEditorDecorationCache ||
            previousEditorDecorationCache.getLineNumber() !== currentEditorDecorationCache.getLineNumber() ||
            currentEditorDecorationCache.indentIndex !== previousEditorDecorationCache.indentIndex) {
            if (undefined !== currentEditorDecorationCache.line && undefined !== currentEditorDecorationCache.indentIndex) {
                result.push({
                    range: currentEditorDecorationCache.line.range,
                    startPosition: 0,
                    length: 0,
                    decorationParam: BackgroundPhiColors.makeHueDecoration(`line`, lang, spaceBaseColor, currentEditorDecorationCache.indentIndex, spacesActiveAlpha, undefined, true)
                });
            }
            if (previousEditorDecorationCache && currentEditorDecorationCache.indentIndex !== previousEditorDecorationCache.indentIndex && undefined !== previousEditorDecorationCache.indentIndex) {
                result.push({
                    startPosition: -1,
                    length: -1,
                    decorationParam: BackgroundPhiColors.makeHueDecoration(`line`, lang, spaceBaseColor, previousEditorDecorationCache.indentIndex, spacesActiveAlpha, undefined, true)
                });
            }
        }
        return result;
    });
    BackgroundPhiColors.regExpExecToArray = (regexp, text) => Profiler.profile(`regExpExecToArray(/${regexp.source}/${regexp.flags})`, () => {
        const result = [];
        while (true) {
            const match = regexp.exec(text);
            if (null === match) {
                break;
            }
            result.push(match);
        }
        return result;
    });
    BackgroundPhiColors.updateSymbolsDecoration = (lang, text, textEditor, tabSize, symbolColorMap) => Profiler.profile("updateSymbolsDecoration", () => BackgroundPhiColors.regExpExecToArray(/[\!\.\,\:\;\(\)\[\]\{\}\<\>\"\'\`\#\$\%\&\=\-\+\*\@\\\/\|\?\^\~"]/gm, text)
        .map(match => ({
        index: match.index,
        token: match[0],
        specificColor: symbolColorMap.get(match[0])
    }))
        .filter(i => null !== i.specificColor)
        .map(i => ({
        startPosition: i.index,
        length: i.token.length,
        decorationParam: BackgroundPhiColors.makeHueDecoration("symbols", lang, symbolBaseColor, i.specificColor ||
            {
                "!": 1,
                ".": 2,
                ",": 3,
                ":": 4,
                ";": 5,
                "(": 6,
                ")": 6,
                "[": 7,
                "]": 7,
                "{": 8,
                "}": 8,
                "<": 9,
                ">": 9,
                "\"": 10,
                "\'": 11,
                "\`": 12,
                "\#": 13,
                "\$": 14,
                "\%": 15,
                "\&": 16,
                "\=": 17,
                "\-": 18,
                "\+": 19,
                "\*": 20,
                "\@": 21,
                "\\": 22,
                "\/": 23,
                "\|": 24,
                "\?": 25,
                "\^": 26,
                "\~": 27,
            }[i.token], symbolAlpha)
    })));
    BackgroundPhiColors.hash = (source) => source.split("").map(i => i.codePointAt(0) || 0).reduce((a, b) => (a * 173 + b + ((a & 0x5555) >>> 5)) & 8191)
        % 34; // ← 通常、こういうところの数字は素数にすることが望ましいがここについては https://wraith13.github.io/phi-ratio-coloring/phi-ratio-coloring.htm で類似色の出てくる周期をベース(8,13,21,...)に調整すること。
    BackgroundPhiColors.updateTokesDecoration = (lang, text, textEditor, tabSize, showRegular, strongTokens, tokenColorMap, previousStrongTokens) => Profiler.profile("updateTokesDecoration", () => BackgroundPhiColors.regExpExecToArray(/\w+/gm, text)
        .filter(match => undefined === previousStrongTokens ||
        ((0 <= previousStrongTokens.indexOf(match[0])) !== (0 <= strongTokens.indexOf(match[0]))))
        .map(match => ({
        index: match.index,
        token: match[0],
        isActive: 0 <= strongTokens.indexOf(match[0]),
        specificColor: tokenColorMap.get(match[0])
    }))
        .filter(i => (showRegular || i.isActive) && null !== i.specificColor)
        .map(i => ({
        startPosition: i.index,
        length: i.token.length,
        decorationParam: BackgroundPhiColors.makeHueDecoration(`token:${i.token}`, lang, tokenBaseColor, i.specificColor || BackgroundPhiColors.hash(i.token), i.isActive ? tokenActiveAlpha : tokenAlpha, i.isActive ? laneObject[activeTokenInOverviewRulerLane.get(lang)] : undefined)
    })));
    BackgroundPhiColors.updateBodySpacesDecoration = (lang, text, textEditor, tabSize) => Profiler.profile("updateBodySpacesDecoration", () => BackgroundPhiColors.regExpExecToArray(/^([ \t]*)([^ \t\r\n]+)([^\r\n]+)([^ \t\r\n]+)([ \t]*)$/gm, text)
        .map(prematch => BackgroundPhiColors.regExpExecToArray(/ {2,}|\t+/gm, prematch[3])
        .map(match => ({
        startPosition: prematch.index + prematch[1].length + prematch[2].length + match.index,
        length: match[0].length,
        decorationParam: BackgroundPhiColors.makeHueDecoration("body-spaces", lang, spaceBaseColor, match[0].startsWith("\t") ?
            //  tabs
            ((match[0].length * tabSize) - ((prematch[1].length + prematch[2].length + match.index) % tabSize)) - 1 :
            //  spaces
            match[0].length - 1, spacesActiveAlpha)
    })))
        .reduce((a, b) => a.concat(b), []));
    BackgroundPhiColors.updateTrailSpacesDecoration = (lang, text, textEditor, tabSize, showError) => Profiler.profile("updateTrailSpacesDecoration", () => BackgroundPhiColors.regExpExecToArray(/^([^\r\n]*[^ \t\r\n]+)([ \t]+)$/gm, text)
        .map(match => ({
        startPosition: match.index + match[1].length,
        length: match[2].length,
        decorationParam: showError ?
            makeTrailingSpacesErrorDecorationParam(lang) :
            BackgroundPhiColors.makeHueDecoration("trailing-spaces", lang, spaceBaseColor, match[2].length, spacesAlpha)
    })));
    BackgroundPhiColors.createTextEditorDecorationType = (backgroundColor, overviewRulerLane, isWholeLine) => vscode.window.createTextEditorDecorationType({
        backgroundColor: backgroundColor,
        overviewRulerColor: undefined !== overviewRulerLane ? backgroundColor : undefined,
        overviewRulerLane: overviewRulerLane,
        isWholeLine,
    });
})(BackgroundPhiColors = exports.BackgroundPhiColors || (exports.BackgroundPhiColors = {}));
function activate(context) {
    BackgroundPhiColors.initialize(context);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//  for sample
/*
 *
 * EXACTLY WRONG INDENT
 *
 */
// spaces indent
// tab indent
// spaces and tab indent
//    body spaces
// trailing spaces        
//# sourceMappingURL=extension.js.map