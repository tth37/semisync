const { Scheduler } = require("../lib/index.js")

const config = {
    global: {
        syncingWorkersLimit: 4,
        avgloadLimit: 2.0,
        tcpconnsLimit: 20,
        logdir: '/tmp/semi/log',
        refresh: 5,
        dbfile: '/tmp/semi/level.db'
    },
    workers: {
        bjlx: {
            upstream: 'rsync://rsync.anheng.com.cn/bjlx/',
            localdir: '/tmp/semi/root/bjlx',
            command: '/tmp/semi/scripts/bjlx.sh',
            timeout: 1800,
            interval: 300,
            priority: 2
        },
        elvish: {
            upstream: 'rsync://rsync.elv.sh/elvish/',
            localdir: '/tmp/semi/root/elvish',
            command: '/tmp/semi/scripts/elvish.sh',
            timeout: 1800,
            interval: 300,
            priority: 2
        }
    }
}

const scheduler = new Scheduler(config)
scheduler.start()

setInterval(() => {
    console.log(scheduler.getStatus());
}, 10000)