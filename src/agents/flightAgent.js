import { makeVerticalAgent } from "./sharedFlow.js";
export const flightAgent = makeVerticalAgent({
  vertical: "flight", searchTool: "search_flights", needCity: false,
  noRouteMsg: "No flights on that route in the sample data - try Delhi-Mumbai, Mumbai-Delhi, Delhi-Bangalore or Delhi-Goa.",
  confirmLine: (sel, s) => `${sel.title}, ${sel.sub}. Traveller: ${s.prefs.name}, Rs ${sel.price}, zero convenience fee. Confirm booking? (Rs 99 free-cancellation cover available)`
});
