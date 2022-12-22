import * as os from "os";
import * as fs from "fs";

export function getAvgload(): number {
    return os.loadavg()[1];
}

enum TCP_STATUS {
    TCP_ESTABLISHED = 1,
    TCP_SYN_SENT = 2,
    TCP_SYN_RECV = 3,
    TCP_FIN_WAIT1 = 4,
    TCP_FIN_WAIT2 = 5,
    TCP_TIME_WAIT = 6,
    TCP_CLOSE = 7,
    TCP_CLOSE_WAIT = 8,
    TCP_LAST_ACK = 9,
    TCP_LISTEN = 10,
    TCP_CLOSING = 11,
}

export function getTcpconns(): number {
    const tcpconns = fs.readFileSync("/proc/net/tcp", "utf8");
    const lines = tcpconns.split("\n");
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(/\s+/);
        const status = parseInt(parts[3], 16);
        if (status === TCP_STATUS.TCP_ESTABLISHED) {
            count++;
        }
    }
    return count;
}
