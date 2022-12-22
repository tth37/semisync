const { Scheduler } = require("../lib/index.js")

const config = {
    global: {
        syncingWorkersLimit: 4,
        avgloadLimit: 2.0,
        tcpconnsLimit: 20,
        logdir: '/var/semi/log',
        refresh: 5,
        dbfile: '/var/semi/level.db'
    },
    workers: {
        bjlx: {
            upstream: 'rsync://rsync.anheng.com.cn/bjlx/',
            localdir: '/var/semi/root/bjlx',
            command: '/var/semi/scripts/bjlx.sh',
            timeout: 1800,
            interval: 300,
            priority: 2
        },
        elvish: {
            upstream: 'rsync://rsync.elv.sh/elvish/',
            localdir: '/var/semi/root/elvish',
            command: '/var/semi/scripts/elvish.sh',
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