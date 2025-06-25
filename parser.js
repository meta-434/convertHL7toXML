require("dotenv").config();
const { Hl7Parser } = require("@amida-tech/hl7-parser");
const { create } = require("xmlbuilder2");
const { log } = require("./logger.js");

/**
 * Maps segments of HL7Parser objects in format for xmlbuilder2 to build XML
 * @param {String} segment
 * @param {Number} index
 * @param {Number} obxCount (default null) allows tracking of obx index
 * @returns
 */
function segToDI(segment, index, obxCount = null) {
  let hold;

  if (!segment || !segment.children || !Array.isArray(segment.children)) {
    console.warn("Invalid segment:", segment);
    return undefined;
  }

  // fields are in order: 0|1|2|3|4|5|...
  const fields = segment.children;

  console.log(`fields[${index}] is type ${fields[index]?.name}`);
  console.log(`Fields5: ${JSON.stringify(fields[5]?.children)}`);

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
          "@V": `${fields[1]?.value}`,
        },
        {
          "@K": "internalId",
          "@V": `${fields[2]?.value}`,
        },
        {
          "@K": "alternateId",
          "@V": `${fields[3]?.value}`,
        },
        {
          "@K": "FamilyName",
          "@V": `${fields[5]?.children?.[0]?.value}`,
        },
        {
          "@K": "GivenName",
          "@V": `${fields[5]?.children?.[1]?.value}`,
        },
        {
          "@K": "MiddleName",
          "@V": `${fields[5]?.children?.[2]?.value}`,
        },
        {
          "@K": "DateOfBirth",
          "@V": `${fields[7]?.value}`,
        },
        {
          "@K": "Sex",
          "@V": `${fields[8]?.value}`,
        },
        {
          "@K": "DicomPatientId",
          "@V": ``,
        },
        {
          "@K": "PatientAccountNumber",
          "@V": `${fields[18]?.value}`,
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
    console.log("obx counter is ", obxCount);
    hold = {
      "@K": `Value${obxCount}`,
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
 * @param {String} HL7file - the full HL7 file
 */
function parseHL7ToXmlObject(hl7Text) {
  const parser = new Hl7Parser();
  const model = parser.getHl7Model(hl7Text.trimEnd());
  const segments = model.children;
  const diBlocks = [];
  let obxCounter = 1;

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

  segmentsValid.forEach((segment, index) => {
    if (segment.children?.[0]?.value === "OBX") {
      diBlocks.push(segToDI(segment, index, obxCounter));
      obxCounter++;
    } else {
      diBlocks.push(segToDI(segment, index));
    }
  });

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
