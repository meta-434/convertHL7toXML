const EventEmitter = require("events");
const { log } = require("./logger");

class BatchQueue extends EventEmitter {
  // extending EventEmitter allows for async
  constructor() {
    super();
    this.orderQueue = [];
    this.batchTimer = null;
    this.BATCH_DELAY_MS = 1000;
  }

  queueFile(filename) {
    // node gc'es stale Timeout so no need to re-initialize to null
    try {
      if (!filename.endsWith(".txt")) {
        throw new Error(`Unsupported file type received: ${filename}`);
      }

      this.orderQueue.push(filename);
      log(`Queued file: ${filename}`);

      if (this.batchTimer) clearTimeout(this.batchTimer);

      this.batchTimer = setTimeout(() => {
        this.flushQueue();
      }, this.BATCH_DELAY_MS);
    } catch (err) {
      log(`Fatal error in queueFile(): ${err.message}`);
      process.exit(1);
    }
  }

  flushQueue() {
    if (this.orderQueue.length === 0) return;

    const files = [...this.orderQueue];
    this.orderQueue.length = 0;
    this.batchTimer = null;

    log(`Flushing batch of ${files.length} file(s)...`);

    // Emit the batch event for listeners
    this.emit("batch", files);
  }
}

module.exports = new BatchQueue();
