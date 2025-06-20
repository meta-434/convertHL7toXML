require("dotenv").config();
const fs = require("fs");
const path = require("path");
const batchQueue = require("./batchQueue");
const { transform } = require("./transformer");

const { log, initLogger } = require("./logger");

const INPUT_DIR = process.env.MIRTH_IN;
const OUTPUT_DIR = process.env.MIRTH_OUT;

function handleBatch(files) {
  files.forEach((filename) => {
    const inputPath = path.join(INPUT_DIR, filename);
    const outputPath = path.join(OUTPUT_DIR, filename);

    fs.readFile(inputPath, "utf8", (err, data) => {
      if (err) {
        log(`Error reading file ${filename}: ${err.message}`);
        process.exit(1);
      }

      let transformed;
      try {
        transformed = transform(data);
      } catch (err) {
        log(`Transformation failed for ${filename}: ${err.message}`);
        process.exit(1);
      }

      fs.writeFile(outputPath, transformed, (err) => {
        if (err) {
          log(`Error writing file ${filename}: ${err.message}`);
          process.exit(1);
        }

        log(`Transformed: ${filename} → ${outputPath}`);

        // Cleanup: delete the original input file only after successful write
        fs.unlink(inputPath, (err) => {
          if (err) {
            log(`Error deleting input file ${filename}: ${err.message}`);
            // Depending on your needs, decide if you want to exit or continue
          } else {
            log(`Deleted input file: ${filename}`);
          }
        });
      });
    });
  });
}

function main() {
  initLogger();

  fs.readdir(INPUT_DIR, (err, files) => {
    if (err) {
      log(`Error reading input directory: ${err.message}`);
      process.exit(1);
    }

    files
      .filter((f) => f.endsWith(".txt"))
      .forEach((filename) => batchQueue.queueFile(filename));
  });

  // Register the batch handler
  batchQueue.on("batch", handleBatch);

  // Start watching the directory
  fs.watch(INPUT_DIR, (eventType, filename) => {
    if (eventType === "rename" && filename) {
      const fullPath = path.join(INPUT_DIR, filename);

      setTimeout(() => {
        if (fs.existsSync(fullPath)) {
          batchQueue.queueFile(filename);
        }
      }, 100);
    }
  });

  log("Watching directory for new files...");
}

main();
