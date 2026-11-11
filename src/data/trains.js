// SAMPLE data - real trains, indicative fares, mock confirmation odds. No live IRCTC feed.
export const TRAINS = [
  { no: "12951", name: "Mumbai Rajdhani", from: "NDLS", to: "MMCT", fromCity: "delhi", toCity: "mumbai", dep: "16:25", arr: "08:15", dur: "15h 50m", classes: { "3A": 2745, "2A": 3655, "1A": 6145 }, odds: 92, days: "Daily" },
  { no: "12953", name: "August Kranti Rajdhani", from: "NZM", to: "MMCT", fromCity: "delhi", toCity: "mumbai", dep: "17:40", arr: "10:10", dur: "16h 30m", classes: { "3A": 2680, "2A": 3580, "1A": 5980 }, odds: 84, days: "Daily" },
  { no: "12909", name: "Bandra Garib Rath", from: "NZM", to: "BDTS", fromCity: "delhi", toCity: "mumbai", dep: "16:30", arr: "09:15", dur: "16h 45m", classes: { "3A": 1560, "CC": 1385 }, odds: 71, days: "Tue, Thu, Sat" },
  { no: "12904", name: "Golden Temple Mail", from: "NDLS", to: "MMCT", fromCity: "delhi", toCity: "mumbai", dep: "20:45", arr: "23:45", dur: "27h 00m", classes: { "SL": 640, "3A": 1690, "2A": 2440 }, odds: 58, days: "Daily" },
  { no: "22221", name: "CSMT Rajdhani", from: "NZM", to: "CSMT", fromCity: "delhi", toCity: "mumbai", dep: "16:55", arr: "11:15", dur: "18h 20m", classes: { "3A": 2620, "2A": 3495, "1A": 5840 }, odds: 66, days: "Daily" },
  { no: "12952", name: "Mumbai Rajdhani (Return)", from: "MMCT", to: "NDLS", fromCity: "mumbai", toCity: "delhi", dep: "17:00", arr: "08:35", dur: "15h 35m", classes: { "3A": 2745, "2A": 3655, "1A": 6145 }, odds: 90, days: "Daily" },
  { no: "12015", name: "Ajmer Shatabdi", from: "NDLS", to: "JP", fromCity: "delhi", toCity: "jaipur", dep: "06:10", arr: "10:30", dur: "4h 20m", classes: { "CC": 720, "EC": 1450 }, odds: 95, days: "Daily" },
  { no: "12986", name: "JP Double Decker", from: "DEE", to: "JP", fromCity: "delhi", toCity: "jaipur", dep: "17:35", arr: "22:05", dur: "4h 30m", classes: { "CC": 545 }, odds: 88, days: "Daily" },
  { no: "11301", name: "Udyan Express", from: "CSMT", to: "SBC", fromCity: "mumbai", toCity: "bangalore", dep: "08:10", arr: "08:50", dur: "24h 40m", classes: { "SL": 590, "3A": 1560, "2A": 2255 }, odds: 74, days: "Daily" },
  { no: "12627", name: "Karnataka Express", from: "NDLS", to: "SBC", fromCity: "delhi", toCity: "bangalore", dep: "20:20", arr: "12:00", dur: "39h 40m", classes: { "SL": 815, "3A": 2135, "2A": 3115 }, odds: 61, days: "Daily" }
];
