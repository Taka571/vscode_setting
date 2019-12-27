"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const types_1 = require("../../common/types");
const types_2 = require("../../ioc/types");
const types_3 = require("../../viewers/types");
const registration_1 = require("../registration");
const types_4 = require("../types");
let GitCommitCommandHandler = class GitCommitCommandHandler {
    constructor(serviceContainer, commitViewerFactory) {
        this.serviceContainer = serviceContainer;
        this.commitViewerFactory = commitViewerFactory;
    }
    doSomethingWithCommit(commit) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = yield this.serviceContainer.get(types_1.IUiService).selectCommitCommandAction(commit);
            if (cmd) {
                return cmd.execute();
            }
        });
    }
    doNewRef(commit) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = yield this.serviceContainer.get(types_1.IUiService).newRefCommitCommandAction(commit);
            if (cmd) {
                return cmd.execute();
            }
        });
    }
    onCommitSelected(commit) {
        const viewer = this.commitViewerFactory.getCommitViewer();
        viewer.showCommit(commit);
        viewer.showCommitTree(commit);
    }
};
__decorate([
    registration_1.command('git.commit.doSomething', types_4.IGitCommitCommandHandler),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.CommitDetails]),
    __metadata("design:returntype", Promise)
], GitCommitCommandHandler.prototype, "doSomethingWithCommit", null);
__decorate([
    registration_1.command('git.commit.doNewRef', types_4.IGitCommitCommandHandler),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.CommitDetails]),
    __metadata("design:returntype", Promise)
], GitCommitCommandHandler.prototype, "doNewRef", null);
__decorate([
    registration_1.command('git.commit.selected', types_4.IGitCommitCommandHandler),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.CommitDetails]),
    __metadata("design:returntype", void 0)
], GitCommitCommandHandler.prototype, "onCommitSelected", null);
GitCommitCommandHandler = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_2.IServiceContainer)),
    __param(1, inversify_1.inject(types_3.ICommitViewerFactory)),
    __metadata("design:paramtypes", [Object, Object])
], GitCommitCommandHandler);
exports.GitCommitCommandHandler = GitCommitCommandHandler;
//# sourceMappingURL=gitCommit.js.map