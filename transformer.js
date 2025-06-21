const { parseHL7ToXmlObject } = require("./parser.js");
/**
 * Perform transformation on HL7 content
 * @param {string} content - Raw HL7 file contents
 * @returns {string} Transformed output (e.g. XML or JSON)
 */
function transform(content) {
  try {
    const result = parseHL7ToXmlObject(content);
    console.log("🎯 parseHL7ToXmlObject returned: \n", result);
  } catch (err) {
    console.error("❌ parseHL7ToXmlObject threw an error:", err.message);
  }
  return content; // No-op for now
}

module.exports = { transform };
