// @ts-ignore
import { commands, util } from 'node-svn-ultimate'

interface $S {
  path: string
  kind: string //dir
  item: string //modified
  props: string //none 
}

interface Entry {
  'wc-status': {
    $: {
      item: string
    }
  }
  $: $S
  commit: {
    $: {
      revision: string
    }
    author: string
    date: string
  }
  name: string
  url: string
}
interface $Target {
  $: $S
  entry?: Entry[]
}
interface $Status {
  target: $Target
}

export class SVN {
  hasEntry: boolean
  adds: string[] = []
  missings: string[] = []
  modifies: string[] = []
  constructor(public dir: string) { }
  resolve(items: any) {
    this.hasEntry = !!items;
    if (this.hasEntry) {
      let entries: Entry[] = items;;
      if (!Array.isArray(items)) {
        entries = [items];
      }
      this.adds = entries.filter(item => item['wc-status'].$.item === 'unversioned').map(item => item.$.path)
      this.missings = entries.filter(item => item['wc-status'].$.item === 'missing').map(item => item.$.path)
      this.modifies = entries.filter(item => item['wc-status'].$.item === 'modified').map(item => item.$.path)
    }
  }
  async execute(msg: string) {
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
      commands.status(dir, {
        silent: false,
        cwd: this.dir
      }, (err: any, result: $Status) => {
        if (err) {
          return reject(err);
        }
        this.resolve(result.target.entry);
        resolve();
      });
    })
  }
  del() {
    return new Promise((resolve, reject) => {
      commands.del(this.missings, {
        silent: false
      }, (err: any) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
  }
  update() {
    return new Promise((resolve, reject) => {
      commands.update(this.dir, {
        silent: false
      }, (err: any) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
  }
  add() {
    return new Promise((resolve, reject) => {
      commands.add(this.adds, {
        silent: false,
        cwd: this.dir
      }, (err: any) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
  }
  commit(msg: string) {
    msg = msg || '~~~代码更新~~~';
    return new Promise((resolve, reject) => {
      commands.commit(this.dir, {
        silent: false,
        params: [`-m string`]
      }, (err: any) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    })
  }
  info(): Promise<Entry> {
    return new Promise((resolve, reject) => {
      commands.info(this.dir, {
        silent: false,
        cwd: this.dir
      }, (err: any, info: any) => {
        if (err) {
          return reject(err);
        }
        resolve(info.entry);
      })
    })
  }
  async merge(names: string[]) {
    var { url } = await this.info();
    var info = getInfo(url);
    names = names.map(name => info.branchesUrl + '/' + name);
    return new Promise((resolve, reject) => {
      commands.merge(names, {
        cwd: this.dir,
        silent: false
      }, (err: any) => {
        if (err) {
          return reject(err);
        }
        resolve();
      })
    })
  }
}

export function getBranches(url: string) {
  return new Promise((resolve, reject) => {
    util.getBranches(url, (err: any, tagsArray: Entry[]) => {
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
  })
}

interface Info {
  branchesUrl: string
  projectName: string
  rootUrl: string
  tagsUrl: string
  trunkUrl: string
  type: string
  typeName: string
}
export function getInfo(url: string): Info {
  return util.parseUrl(url);
};