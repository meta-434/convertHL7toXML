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
  // console.log(`Fields3: ${JSON.stringify(fields[3]?.children)}}`);
  console.log(`fields[0] is type ${fields[0]?.value} for element #${index}`);

  if (fields[0]?.value === "MSH") {
    hold = {
      "@K": `Info`,
      DI: [
        {
          "@K": "Description",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "Version",
          "@V": `${fields[11]?.value}`,
        },
      ],
    };
  }

  if (fields[0]?.value === "PID") {
    hold = {
      "@K": `Patient`,
      DI: [
        {
          "@K": "externalId",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "internalId",
          "@V": `${fields[11]?.value}`,
        },
        {
          "@K": "alternateId",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "FamilyName",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "GivenName",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "MiddleName",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "DateOfBirth",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "Sex",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "DicomPatientId",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "PatientAccountNumber",
          "@V": `${fields[2]?.value}`,
        },
      ],
    };
  }
  // TODO: PV1 segment map
  // if (fields[0]?.value === "OBX") { }
  // TODO: ORC segment map
  // if (fields[0]?.value === "OBX") { }
  // TODO: OBR segment map
  // if (fields[0]?.value === "OBX") { }
  // OBX segment map
  if (fields[0]?.value === "OBX") {
    hold = {
      "@K": `Value${index}`,
      "@T": "0",
      DI: [
        {
          "@K": "FindingID",
          "@V": `${fields[3]?.value}`,
        },
        {
          "@K": "Unit",
          "@V": `${fields[6]?.value}`,
        },
        {
          "@K": "ValueToUse",
          "@V": `${fields[5]?.value}`,
        },
        {
          "@K": "Description",
          "@V": `${fields[3]?.children?.[1]?.value}`,
        },
      ],
    };
  }

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
  const segmentsValid = segments.filter((seg) => {
    if (!seg) {
      console.warn("Warning: undefined segment detected");
      return false;
    }
    console.log(`Segment found: ${seg.name}`);
    // segment types we care about
    return (
      seg.name === "MSH" ||
      seg.name === "PID" ||
      seg.name === "PV1" ||
      seg.name === "ORC" ||
      seg.name === "OBR" ||
      seg.name === "OBX"
    );
  });

  segmentsValid.forEach((segment, index) =>
    diBlocks.push(segToDI(segment, index)),
  );

  // console.log("diBlocks =", JSON.stringify(diBlocks, null, 2));

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
