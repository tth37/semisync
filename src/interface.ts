export enum SyncStatus {
    syncing = "syncing",
    success = "success",
    failed = "failed",
    timeout = "timeout",
    inqueue = "inqueue",
}

export interface GlobalConfig {
    syncingWorkersLimit: number;
    avgloadLimit: number;
    tcpconnsLimit: number;

    logdir: string;
    refresh: number;
    dbfile: string;
}

export interface WorkerConfig {
    upstream: string;
    localdir: string;
    command: string;
    timeout: number;
    interval: number;
    priority: number;
}

export interface Config {
    global: GlobalConfig;
    workers: { [key: string]: WorkerConfig };
}

export interface GlobalStatus {
    syncingWorkers: number;
    avgload: number;
    tcpconns: number;
}

export interface WorkerStatus {
    name: string;
    lastupdate: string;
    status: SyncStatus;
}

export interface Status {
    global: GlobalStatus;
    workers: { [key: string]: WorkerStatus };
}

export interface WorkerParams {
    name: string;
    command: string;
    envs: { [key: string]: string };
    logfile: string;
    timeout: number;
    interval: number;
    refresh: number;
}
