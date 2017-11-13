"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const node_svn_ultimate_1 = require("node-svn-ultimate");
class SVN {
    constructor(dir) {
        this.dir = dir;
        this.adds = [];
        this.missings = [];
        this.modifies = [];
    }
    resolve(items) {
        this.hasEntry = !!items;
        if (this.hasEntry) {
            let entries = items;
            ;
            if (!Array.isArray(items)) {
                entries = [items];
            }
            this.adds = entries.filter(item => item['wc-status'].$.item === 'unversioned').map(item => item.$.path);
            this.missings = entries.filter(item => item['wc-status'].$.item === 'missing').map(item => item.$.path);
            this.modifies = entries.filter(item => item['wc-status'].$.item === 'modified').map(item => item.$.path);
        }
    }
    async execute(msg) {
        if (this.hasEntry) {
            if (this.adds.length > 0) {
                await this.add();
            }
            if (this.missings.length > 0) {
                await this.del();
            }
            await this.commit(msg);
        }
    }
    status(dir = '.') {
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.status(dir, {
                silent: false,
                cwd: this.dir
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                this.resolve(result.target.entry);
                resolve();
            });
        });
    }
    del() {
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.del(this.missings, {
                silent: false
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    update() {
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.update(this.dir, {
                silent: false
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    add() {
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.add(this.adds, {
                silent: false,
                cwd: this.dir
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    commit(msg) {
        msg = msg || '~~~代码更新~~~';
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.commit(this.dir, {
                silent: false,
                params: [`-m string`]
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    info() {
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.info(this.dir, {
                silent: false,
                cwd: this.dir
            }, (err, info) => {
                if (err) {
                    return reject(err);
                }
                resolve(info.entry);
            });
        });
    }
    async merge(names) {
        var { url } = await this.info();
        var info = getInfo(url);
        names = names.map(name => info.branchesUrl + '/' + name);
        return new Promise((resolve, reject) => {
            node_svn_ultimate_1.commands.merge(names, {
                cwd: this.dir,
                silent: false
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}
exports.SVN = SVN;
function getBranches(url) {
    return new Promise((resolve, reject) => {
        node_svn_ultimate_1.util.getBranches(url, (err, tagsArray) => {
            if (err) {
                return reject(err);
            }
            var ret = tagsArray.map(item => {
                return {
                    name: item.name,
                    author: item.commit.author
                };
            });
            resolve(ret);
        });
    });
}
exports.getBranches = getBranches;
function getInfo(url) {
    return node_svn_ultimate_1.util.parseUrl(url);
}
exports.getInfo = getInfo;
;
