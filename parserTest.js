// Stand-alone test for xmlbuilder2

const { create } = require("xmlbuilder2");
const array = [
  {
    "@K": "Value0",
    "@T": 0,
    DI: {
      "@K": "Unit",
      "@V": "1234",
    },
  },
  {
    "@K": "Value1",
    "@T": 0,
    DI: {
      "@K": "Unit",
      "@V": "1234",
    },
  },
];
// Build a simple XML object
const obj = {
  root: {
    "@attribute": "value",
    DI: [
      { "#": "Text content 1" },
      { "@anotherAttr": "anotherValue", "#": "Text content 2" },
      ...array,
    ],
  },
};

// Create XML document
const doc = create({ version: "1.0", encoding: "UTF-8" }, obj);

// Convert to pretty-printed XML string
const xmlString = doc.end({ prettyPrint: true });

// Output the XML string
console.log(xmlString);

// To run this test, use: node convertHL7toXML/xmlbuilder2_test.js
