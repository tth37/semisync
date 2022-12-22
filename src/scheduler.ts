import {
    Config,
    Status,
    SyncStatus,
    WorkerConfig,
    WorkerParams,
    WorkerStatus,
} from "./interface";
import { Level } from "level";
import { getDefaultTime } from "./utils";
import Logger from "./logger";
import Worker from "./worker";
import { getAvgload, getTcpconns } from "./sysinfo";

class Scheduler {
    private config: Config;
    private status: Status;
    private logger: Logger;
    private workers: { [key: string]: Worker };
    private _interval: NodeJS.Timeout;
    private _db: Level;

    constructor(config: Config) {
        this.config = config;
        this.status = {
            global: {
                syncingWorkers: 0,
                avgload: 0.0,
                tcpconns: 0,
            },
            workers: {},
        };
        this.logger = new Logger(this.config.global.logdir + "semisync.log");
        this.workers = {};
        this._interval = setInterval(() => {
            this.refresh();
        }, this.config.global.refresh * 1000);
        this._db = new Level(this.config.global.dbfile, {
            valueEncoding: "json",
        });
    }

    async start() {
        this.logger.log("Fire Scheduler.start()");
        await this.loadWorkerStatus();
        this.createWorkers();
        this.updateWorkerStatus();
        await this.saveWorkerStatus();
        this.updateGlobalStatus();
    }

    private async loadWorkerStatus() {
        this.status.workers = {};
        for (const key in this.config.workers) {
            const config = this.config.workers[key];
            try {
                const savedWorkerStatus = JSON.parse(
                    await this._db.get(config.name)
                ) as WorkerStatus;
                if (savedWorkerStatus.status === SyncStatus.syncing) {
                    savedWorkerStatus.status = SyncStatus.failed;
                }
                this.status.workers[config.name] = savedWorkerStatus;
            } catch (e) {
                const newWorkerStatus = {
                    name: config.name,
                    lastupdate: getDefaultTime(),
                    status: SyncStatus.success,
                } as WorkerStatus;
                this.status.workers[config.name] = newWorkerStatus;
            }
        }
    }

    private createWorkers() {
        for (const key in this.config.workers) {
            const config = this.config.workers[key];
            const params = {
                name: config.name,
                command: config.command,
                envs: {
                    SEMISYNC_UPSTREAM: config.upstream,
                    SEMISYNC_LOCALDIR: config.localdir,
                },
                logfile: this.config.global.logdir + config.name + ".out",
                timeout: config.timeout,
                interval: config.interval,
                refresh: this.config.global.refresh,
            } as WorkerParams;
            const status = this.status.workers[config.name];
            const newWorker = new Worker(params, status);
            this.workers[config.name] = newWorker;
        }
    }

    private updateWorkerStatus() {
        for (const key in this.workers) {
            const worker = this.workers[key];
            const name = worker.getName();
            const status = worker.getStatus();
            this.status.workers[name] = status;
        }
    }

    private async saveWorkerStatus() {
        for (const key in this.status.workers) {
            const status = this.status.workers[key];
            await this._db.put(status.name, JSON.stringify(status));
        }
    }

    private updateGlobalStatus() {
        let syncingWorkers = 0;
        for (const key in this.status.workers) {
            const status = this.status.workers[key];
            if (status.status === SyncStatus.syncing) {
                syncingWorkers++;
            }
        }
        this.status.global.syncingWorkers = syncingWorkers;
        this.status.global.avgload = getAvgload();
        this.status.global.tcpconns = getTcpconns();
    }

    private startWorkers() {
        for (const key in this.workers) {
            this.updateWorkerStatus();
            this.updateGlobalStatus();
            if (this.judgeWorkerRunnable(key)) {
                this.logger.log(">> Start worker: " + key);
                this.workers[key].start();
            }
        }
    }

    private judgeWorkerRunnable(key: string) {
        let syncingWorkers = false,
            avgload = false,
            tcpconns = false;
        const config = this.config.workers[key];
        const status = this.status.workers[key];

        if (status.status !== SyncStatus.inqueue) {
            return false;
        }

        if (this.config.global.syncingWorkersLimit === 0) {
            syncingWorkers = true;
        } else {
            if (
                this.status.global.syncingWorkers <=
                this.config.global.syncingWorkersLimit
            ) {
                syncingWorkers = true;
            } else {
                if (config.priority < 2) {
                    syncingWorkers = true;
                }
            }
        }

        if (this.config.global.avgloadLimit === 0) {
            avgload = true;
        } else {
            if (this.status.global.avgload <= this.config.global.avgloadLimit) {
                avgload = true;
            } else {
                if (
                    config.priority <=
                    -4.55 *
                        (this.status.global.avgload /
                            this.config.global.avgloadLimit) +
                        14.55
                ) {
                    avgload = true;
                }
            }
        }

        if (this.config.global.tcpconnsLimit === 0) {
            tcpconns = true;
        } else {
            if (
                this.status.global.tcpconns <= this.config.global.tcpconnsLimit
            ) {
                tcpconns = true;
            } else {
                if (
                    config.priority <=
                    -4.55 *
                        (this.status.global.tcpconns /
                            this.config.global.tcpconnsLimit) +
                        14.55
                ) {
                    tcpconns = true;
                }
            }
        }

        return syncingWorkers && avgload && tcpconns;
    }

    private async refresh() {
        this.logger.log("Fire Scheduler.refresh()");
        this.updateWorkerStatus();
        this.updateGlobalStatus();
        this.logger.log(
            "Scheduler.status.workers: " + JSON.stringify(this.status.workers)
        );
        this.logger.log(
            "Scheduler.status.global: " + JSON.stringify(this.status.global)
        );
        this.startWorkers();
        this.updateWorkerStatus();
        this.updateGlobalStatus();
        await this.saveWorkerStatus();
    }
}

export default Scheduler;
