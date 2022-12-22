const level_1 = require("level");
class Store {
    constructor(db_file) {
        this.db = new level_1.Level(db_file, { valueEncoding: "json" });
    }
    async setState(key, state) {
        await this.db.put(key, JSON.stringify(state));
    }
    async getState(key) {
        const value = await this.db.get(key);
        return JSON.parse(value);
    }
}

const store = new Store("level.db");

async function main() {
    await store.setState("key", { name: "ubuntu" });
    const state = await store.getState("key");
    console.log(state);
}

main();