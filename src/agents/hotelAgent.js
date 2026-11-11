import { makeVerticalAgent } from "./sharedFlow.js";
export const hotelAgent = makeVerticalAgent({
  vertical: "hotel", searchTool: "search_hotels", needCity: true,
  noRouteMsg: "No hotels there in the sample data - try Mumbai, Jaipur or Goa.",
  confirmLine: (sel, s) => `${sel.title}, ${sel.sub}. Guest: ${s.prefs.name}, Rs ${sel.price}/night. Confirm booking?`
});
