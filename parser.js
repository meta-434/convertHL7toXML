require("dotenv").config();
const { Hl7Parser } = require("@amida-tech/hl7-parser");
const { create } = require("xmlbuilder2");
const { log } = require("./logger.js");

function segToDI(segment, index) {
  let hold;

  if (!segment || !segment.children || !Array.isArray(segment.children)) {
    console.warn("Invalid segment:", segment);
    return undefined;
  }

  // fields are in order: 0|1|2|3|4|5|...
  const fields = segment.children;

  // OBX segment map
  if (fields[0]?.value === "OBX") {
    console.log(`fields[0] is type OBX for element #${index}`);
    hold = {
      "@K": `Value${index}`,
      "@T": "0",
      DI: {
        "@K": "FindingID",
        "@V": "ABCD",
      },
      DI: {
        "@K": "Unit",
        "@V": "1234",
      },
    };
  }
  console.log("hold is: ", JSON.stringify(hold));
  return hold;
}

/**
 * converts hl7 to JS object, then converts object to XML
 * @param {*} HL7file - the full HL7 file
 */
function parseHL7ToXmlObject(hl7Text) {
  const parser = new Hl7Parser();
  const model = parser.getHl7Model(hl7Text.trimEnd());
  const segments = model.children;
  const diBlocks = [];
  const obxSegments = segments.filter((seg) => {
    if (!seg) {
      console.warn("Warning: undefined segment detected");
      return false;
    }
    console.log(`Segment found: ${seg.name}`);
    return seg.name === "OBX";
  });

  obxSegments.forEach((segment, index) =>
    diBlocks.push(segToDI(segment, index)),
  );

  console.log("diBlocks =", JSON.stringify(diBlocks, null, 2));

  const fullObject = {
    FI_DCMSR: {
      "@srType": "Circle",
      "@version": "1.0",
      "@emdVersion": "1.0.7",
      "@fullVersion": "1.2.3",
      "@manufacturer": "Circle",
      "@implementationVersionName": "2.5.1",
      "@implementationClassUID": "CIRCLE",
      "@source": "CIRCLE",
      DI: diBlocks,
    },
  };

  return create({ version: "1.0", encoding: "UTF-8" }, fullObject).end({
    prettyPrint: true,
  });
}

module.exports = { parseHL7ToXmlObject };
