import { ChildProcess, spawn, spawnSync } from "child_process";
import { SyncStatus, WorkerParams, WorkerStatus } from "./interface";
import { writeFileSync } from "fs";
import { getCurrentTime, getDiffSeconds } from "./utils";

class Worker {
    private params: WorkerParams;
    private status: WorkerStatus;
    private _timeout: NodeJS.Timeout;
    private _interval: NodeJS.Timeout;
    private _process: ChildProcess;

    constructor(params: WorkerParams, status: WorkerStatus) {
        this.params = params;
        this.status = status;
        this._interval = setInterval(() => {
            this.refresh();
        }, this.params.refresh * 1000);
        this.refresh();
    }

    async start() {
        this.status.status = SyncStatus.syncing;
        this._process = spawn(this.params.command, [], {
            env: this.params.envs,
        });
        this._process.stdout.on("data", (data) => {
            writeFileSync(this.params.logfile, data, { flag: "a" });
        });
        this._process.stderr.on("data", (data) => {
            writeFileSync(this.params.logfile, data, { flag: "a" });
        });
        this._process.on("exit", (code) => {
            if (code === null) {
                this.status.status = SyncStatus.timeout;
            } else if (code === 0) {
                this.status.status = SyncStatus.success;
                this.status.lastupdate = getCurrentTime();
            } else {
                this.status.status = SyncStatus.failed;
            }
            clearTimeout(this._timeout);
        });
        this._timeout = setTimeout(() => {
            this._process.kill();
        }, this.params.timeout * 1000);
    }

    private updateStatus() {
        if (this.status.status === SyncStatus.syncing) {
            return;
        }
        if (getDiffSeconds(this.status.lastupdate) >= this.params.interval) {
            this.status.status = SyncStatus.inqueue;
        }
    }

    private refresh() {
        this.updateStatus();
    }

    getName() {
        return this.params.name;
    }

    getStatus() {
        return this.status;
    }
}

export default Worker;
