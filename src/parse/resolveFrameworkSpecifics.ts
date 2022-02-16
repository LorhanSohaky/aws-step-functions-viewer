import * as R from "ramda";

import { parseText } from "./parse";
import { StepFunction } from "../stepFunction";

function isASL(document: any) {
  return Boolean(document.StartAt && document.States);
}

function isSAM(document: any) {
  return Boolean(document.AWSTemplateFormatVersion && document.Resources);
}

function isSLS(document: any) {
  return Boolean(document.stepFunctions && document.stepFunctions.stateMachines);
}

function isServerlessSeparateDeclaration(document: any) {
  const flowName = Object.keys(document)[0];
  return flowName && document[flowName] && document[flowName].definition && isASL(document[flowName].definition);
}

export const resolveFrameworkSpecifics = (data: string): StepFunction => {
  const document = parseText(data);

  if (isASL(document)) {
    return {
      StartAt: document.StartAt,
      States: document.States,
    };
  }

  if (isSAM(document)) {
    const STATE_MACHINE_TYPE = "AWS::StepFunctions::StateMachine";
    const SAM_STATE_MACHINE_TYPE = "AWS::Serverless::StateMachine";

    const stepFunctionResource = R.values(document.Resources).find((resource) => {
      return resource.Type === STATE_MACHINE_TYPE || resource.Type === SAM_STATE_MACHINE_TYPE;
    });

    if (!stepFunctionResource) {
      return null;
    }
    const properties = stepFunctionResource.Properties;

    if (properties.DefinitionString) {
      return JSON.parse(properties.DefinitionString);
    } else if (properties.Definition) {
      return properties.Definition;
    } else if (properties.DefinitionUri) {
      return parseText(data);
    } else {
      return null;
    }
  }

  // Serverless file - take just first
  if (isSLS(document)) {
    const stateMachinesNames = Object.keys(document.stepFunctions.stateMachines);
    const firstName = stateMachinesNames[0];

    const stateMachineValue = document.stepFunctions.stateMachines[firstName];

    const isFileReference = typeof stateMachineValue === "string";

    if (isFileReference) {
      const [, , stateMachineName] = stateMachineValue.match(/\$\{file\((.*)\):(.*)\}/);

      const stateMachines = parseText(data);

      return stateMachines[stateMachineName].definition;
    } else {
      return document.stepFunctions.stateMachines[firstName].definition;
    }
  }

  if (isServerlessSeparateDeclaration(document)) {
    const flowName = Object.keys(document)[0];
    return document[flowName].definition;
  }

  throw new Error("Could not extract function definition");
};
