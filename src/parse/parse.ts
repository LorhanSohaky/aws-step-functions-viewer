import * as yaml from "js-yaml";

export enum FileFormat {
  JSON,
  YML,
}

export const parseText = (text: string): any => {
  const stripAWSTags = (text: string) => {
    const intrinsicFunctions = [
      "Base64",
      "Cidr",
      "Condition functions",
      "FindInMap",
      "GetAtt",
      "GetAZs",
      "ImportValue",
      "Join",
      "Select",
      "Split",
      "Sub",
      "Transform",
      "Ref",
    ];
    const regexps = intrinsicFunctions.map((func) => new RegExp(`!${func} `, "g"));

    return regexps.reduce((acc, regexp) => acc.replace(regexp, ""), text);
  };

  const jsonData = text;
  const isJson = typeof jsonData === "object";
  try {
    if (isJson) {
      return jsonData;
    } else {
      return yaml.load(stripAWSTags(text));
    }
  } catch (error) {
    throw new Error(`Error occured while parsing file: ${error}`);
  }
};
