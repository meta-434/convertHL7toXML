require("dotenv").config();
const { Hl7Parser } = require("@amida-tech/hl7-parser");
const o2x = require("object-to-xml");
const { log } = require("./logger.js");
console.log("✅ parser.js loaded");

function obxSegToDI(segment, index) {
  console.log("makes it");

  if (!segment || !segment.children || !Array.isArray(segment.children)) {
    console.warn("Invalid OBX segment:", segment);
    return undefined;
  }

  // OBX fields are in order: OBX|1|2|3|4|5|...
  const fields = segment.children;

  const type = fields[2]?.value || ""; // OBX-2
  const observationId = fields[3]?.value || ""; // OBX-3 (may have subfields)
  const value = fields[5]?.value || ""; // OBX-5
  const unit = fields[6]?.value || ""; // OBX-6

  // OBX-3 children: subfields like LV_EDV^LV ED volume^99R42
  let description = "";
  const obx3 = fields[3];
  if (obx3?.children?.[1]?.value) {
    description = obx3.children[1].value;
  }

  return {
    DI: {
      "@": { K: `Value${index}`, T: type === "NM" ? "0" : "1" },
      "#": [
        { DI: { "@": { K: "FindingId", V: observationId } } },
        { DI: { "@": { K: "Unit", V: unit } } },
        { DI: { "@": { K: "ValueToUse", V: value } } },
        { DI: { "@": { K: "Description", V: description } } },
      ],
    },
  };
}

/**
 * converts hl7 to JS object, then converts object to XML
 * @param {*} HL7file - the full HL7 file
 */
function parseHL7ToXmlObject(hl7Text) {
  const parser = new Hl7Parser();
  const model = parser.getHl7Model(hl7Text);
  const segments = model.children;
  const obxSegments = segments.filter((seg) => {
    if (!seg) {
      console.warn("Warning: undefined segment detected");
      return false;
    }
    console.log(`Segment found: ${seg.name}`);
    return seg.name === "OBX";
  });

  const diBlocks = obxSegments
    .map((segment, index) => obxSegToDI(segment, index))
    .filter((x) => x !== undefined);

  console.log("diBlocks =", JSON.stringify(diBlocks, null, 2));

  const fullObject = {
    '?xml version="1.0" encoding="UTF-8"?': null,
    FI_DCMSR: {
      "@": {
        srType: "Circle",
        version: "1.0",
        emdVersion: "1.0.7",
        fullVersion: "1.2.3",
        manufacturer: "Circle",
        implementationVersionName: "2.5.1",
        implementationClassUID: "CIRCLE",
        source: "CIRCLE",
      },
      "#": [
        {
          DI: {
            "@": { K: "Info" },
            "#": [
              { DI: { "@": { K: "Description", V: "Circle" } } },
              { DI: { "@": { K: "Version", V: "2.5.1" } } },
            ],
          },
        },
      ],
    },
  };
  return o2x(fullObject);
}

module.exports = { parseHL7ToXmlObject };
