import { buildGraph } from "./graph";
import { getStates } from "./stepFunction";

import { resolveFrameworkSpecifics } from "./parse/resolveFrameworkSpecifics";

const parseStepFunction = (data: string) => {
  const stepFunction = resolveFrameworkSpecifics(data);

  const serializedGraph = buildGraph(stepFunction);
  const states = getStates(stepFunction);

  return {
    serializedGraph,
    states,
  };
};

export default parseStepFunction;
