import { makeVerticalAgent } from "./sharedFlow.js";
export const busAgent = makeVerticalAgent({
  vertical: "bus", searchTool: "search_buses", needCity: false,
  noRouteMsg: "No buses on that route in the sample data - try Delhi-Jaipur, Jaipur-Delhi or Delhi-Lucknow.",
  confirmLine: (sel, s) => `${sel.title}, ${sel.sub}. Traveller: ${s.prefs.name}, Rs ${sel.price}. Confirm booking?`
});
