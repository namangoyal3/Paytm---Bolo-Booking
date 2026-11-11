import { makeVerticalAgent } from "./sharedFlow.js";
export const trainAgent = makeVerticalAgent({
  vertical: "train", searchTool: "search_trains", needCity: false,
  noRouteMsg: "No trains on that route in the sample data - try Delhi-Mumbai, Delhi-Jaipur, Mumbai-Bangalore or Delhi-Bangalore.",
  confirmLine: (sel, s) => `${sel.title}, ${sel.sub}, ${sel.badge}. Traveller: ${s.prefs.name}, class ${s.prefs.preferredClass}, Rs ${sel.price}. Confirm booking?`
});
