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
const execa = require("execa");
const inflection = require("inflection");
const vscode_1 = require("vscode");
const LINE_REGEXP = /(\w+)?\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+?)(?:\(\.:format\))?\s+([^#]+)#(\w+)/;
const PARAM_REGEXP = /:\w+/;
// TODO: refactor
const parse = (output) => {
    const matchesArray = output
        .split("\n")
        .map(line => line.match(LINE_REGEXP))
        .filter(matches => matches !== null);
    const routesArray = matchesArray
        .map(([, helper, method, url, controller, action]) => ({
        helper,
        method,
        url,
        controller,
        action
    }))
        .reduce((arr, { helper, method, url, controller, action }) => {
        const prevRoute = arr[arr.length - 1];
        // NOTE: PATCH, PUT, DELETE
        if (prevRoute &&
            prevRoute.controller === controller &&
            prevRoute.actions.has(action)) {
            return arr;
        }
        if (!helper) {
            if (!prevRoute) {
                return arr;
            }
            prevRoute.actions.add(action);
            prevRoute.methods.add(method);
            return arr.slice(0, -1).concat(prevRoute);
        }
        const lastController = controller.split("/").pop();
        const route = {
            methods: new Set([method]),
            actions: new Set([action]),
            params: url
                // NOTE: scope params
                .replace(/[()]/g, "")
                .split("/")
                .filter(part => part.match(PARAM_REGEXP))
                .map(part => part
                .replace(":", "")
                .replace(/_id$/g, "")
                .replace(/^id$/g, inflection.singularize(lastController))),
            helper,
            url,
            controller
        };
        return [...arr, route];
    }, [])
        .map(({ helper, methods, actions, url, params, controller }) => [
        helper,
        { methods, actions, url, params, controller }
    ]);
    return new Map(routesArray);
};
class Routes {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.routes = new Map();
    }
    /**
     * dispose
     */
    dispose() {
        this.routes.clear();
    }
    /**
     * load
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const output = yield this.exec();
            if (!output) {
                return;
            }
            this.routes.clear();
            this.routes = parse(output);
        });
    }
    /**
     * getAll
     */
    getAll() {
        return this.routes;
    }
    /**
     * get
     */
    get(helper) {
        return this.routes.get(helper);
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.process) {
                this.process.kill();
            }
            const rakeCommand = vscode_1.workspace
                .getConfiguration("railsRoutes")
                .get("rakeCommand", "bin/rake");
            this.process = execa.command(`${rakeCommand} routes`, {
                cwd: this.rootPath
            });
            try {
                const { stdout } = yield this.process;
                this.process = null;
                return stdout;
            }
            catch (error) {
                this.process = null;
                console.error(error.stderr);
            }
        });
    }
}
exports.default = Routes;
//# sourceMappingURL=routes.js.map