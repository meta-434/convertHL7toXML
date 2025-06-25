const fs = require("fs");
const path = require("path");

let ENABLE_LOGGING = false;
let ENABLE_VERBOSE = false;
let LOG_FILE = null;

/**
 * Initialize logging configuration
 */
function initLogger() {
  ENABLE_LOGGING =
    process.argv.includes("--log") || process.argv.includes("--l");
  ENABLE_VERBOSE =
    process.argv.includes("--verbose") || process.argv.includes("--v");

  if (ENABLE_LOGGING) {
    LOG_FILE = path.join(process.cwd(), "log.txt");
  }
}

/**
 * Log a message to console and/or file depending on flags
 * @param {String} message - The message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;

  if (ENABLE_VERBOSE) {
    console.log(fullMessage);
  }

  if (ENABLE_LOGGING && LOG_FILE) {
    fs.appendFile(LOG_FILE, fullMessage + "\n", (err) => {
      if (err) {
        console.error(`Failed to write to log.txt: ${err.message}`);
      }
    });
  }
}

module.exports = { initLogger, log };
