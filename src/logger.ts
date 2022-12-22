import { existsSync, writeFileSync } from "fs";

class Logger {
    logfile: string;

    constructor(logfile: string) {
        this.logfile = logfile;
    }

    log(msg: string) {
        msg = "[SemiSync " + new Date().toLocaleString() + "] " + msg;
        writeFileSync(this.logfile, msg + "\n", { flag: "a" });
    }
}

export default Logger;
