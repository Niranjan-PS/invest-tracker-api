import axios from "axios"
import Fund from "../models/fundModel.js"
import LatestFundNAV from "../models/latestFundNAV.js"
import HistoryFundNAV from "../models/historyFundNAV.js"
import RetryApi from "../helpers/retryExecutor.js"


export const fetchAndStoreFundList = async () => {
  try {
   
    const { data } = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_FUND_LIST )
    ) 
  
    
    let funds = [];
    if (Array.isArray(data)) {
      funds = data;
      console.log("Using data as array directly, length:", funds.length)
    } else if (data.data && Array.isArray(data.data)) {
      funds = data.data;
      console.log("Using data.data as array, length:", funds.length)
    } else if (data.results && Array.isArray(data.results)) {
      funds = data.results;
      console.log("Using data.results as array, length:", funds.length)
    } else {
      throw new Error("No recognizable funds array found in API response")
    }
    console.log("Funds array:", funds)
    if (!funds.length) {
      throw new Error("No funds data available from API");
    }
    const formattedFunds = funds.map(fund => ({
      schemeCode: parseInt(fund.schemeCode || fund.code, 10),
      schemeName: fund.schemeName || fund.name || "Unknown Scheme",
      isinGrowth: fund.isinGrowth || null,
      isinDivReinvestment: fund.isinDivReinvestment || null,
      
    }))
    console.log("Formatted funds count:", formattedFunds.length);
    await Fund.deleteMany()
    try {
      const insertResult = await Fund.insertMany(formattedFunds, { ordered: false });
      console.log("Inserted funds count:", insertResult.length);
    } catch (insertErr) {
      console.error("InsertMany failed:", insertErr.message);
      throw new Error(`InsertMany failed: ${insertErr.message}`);
    }
    console.log("Fund list fetched and stored successfully");
  } catch (err) {
    console.error("Failed to fetch and store fund list:", err.message);
    throw err;
  }
}



export const verifySchemeCode = async (schemeCode) => {
  try {
    const { data } = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_NAV_HISTORY.replace("{schemeCode}", schemeCode))
    ) 
    const schemeMeta = data.meta;

    if (!schemeMeta?.scheme_name) {
      throw new Error("Invalid scheme code");
    }

    await Fund.findOneAndUpdate(
      { schemeCode: parseInt(schemeCode, 10) },
      { ...schemeMeta, schemeCode: parseInt(schemeCode, 10) },
      { upsert: true, new: true }
    );

    return schemeMeta;
  } catch (err) {
    throw new Error("Invalid scheme code or unable to fetch details");
  }
};

export const fetchLatestNav = async (schemeCode) => {
  try {
    const { data } = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_LATEST_NAV.replace("{schemeCode}", schemeCode))
    ) 
    const navEntries = data.data;

    if (!navEntries || navEntries.length === 0) {
      throw new Error(`No NAV data available for scheme code: ${schemeCode}`);
    }

    const latestNavEntry = navEntries[0]
    console.log('this is the latest navEntri',latestNavEntry)
    const latestNav = {
      nav: parseFloat(latestNavEntry.nav),
      date: latestNavEntry.date,
    }
    console.log('the latest nav: ',latestNav)

    
    await LatestFundNAV.findOneAndUpdate(
      { schemeCode: parseInt(schemeCode, 10) },
      { ...latestNav, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return latestNav
  } catch (err) {
    throw new Error("Unable to fetch latest NAV for scheme code");
  }
};


export const fetchNavByDate = async (schemeCode, purchaseDate) => {
  try {
    const { data } = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_NAV_HISTORY.replace("{schemeCode}", schemeCode))
    ) 
    const navEntries = data.data;

    if (!navEntries || navEntries.length === 0) {
      throw new Error(`No NAV history available for scheme code: ${schemeCode}`)
    }

    const purchaseDateObj = new Date(purchaseDate);
    const navEntry = navEntries.find((entry) => new Date(entry.date) <= purchaseDateObj)

    if (!navEntry) {
      throw new Error(`No NAV found for or before purchase date: ${purchaseDate}`)
    }

    return parseFloat(navEntry.nav);
  } catch (err) {
    throw new Error("Unable to fetch NAV for purchase date")
  }
};
export const fetchNavHistory = async (schemeCode, startDate, endDate) => {
  try {
    const defaultStartDate = "01-01-2025";
    const defaultEndDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "-")
    const effectiveStartDate = startDate || defaultStartDate
    const effectiveEndDate = endDate || defaultEndDate

    console.log(`Fetching NAV history for schemeCode: ${schemeCode}, startDate: ${effectiveStartDate}, endDate: ${effectiveEndDate}`)

    const { data } = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_NAV_HISTORY.replace("{schemeCode}", schemeCode))
    ) 
    const navEntries = data.data;

    console.log("Raw NAV entries:", JSON.stringify(navEntries, null, 2))

    if (!navEntries || navEntries.length === 0) {
      throw new Error(`No NAV history available for scheme code: ${schemeCode}`)
    }

    const start = new Date(effectiveStartDate.split("-").reverse().join("-")).getTime()
    const end = new Date(effectiveEndDate.split("-").reverse().join("-")).getTime()
    console.log("Start timestamp:", start, "End timestamp:", end)

    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid date format for startDate: ${effectiveStartDate} or endDate: ${effectiveEndDate}`)
    }

    const filteredHistory = navEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date.split("-").reverse().join("-")).getTime()
        return entryDate >= start && entryDate <= end;
      })
      .map((entry) => ({
        date: entry.date,
        nav: parseFloat(entry.nav),
      }));

    await HistoryFundNAV.deleteMany({ schemeCode: parseInt(schemeCode, 10) })
    await HistoryFundNAV.insertMany(
      navEntries.map((entry) => ({
        schemeCode: parseInt(schemeCode, 10),
        nav: parseFloat(entry.nav),
        date: entry.date,
      }))
    );

    console.log(`Fetched and stored ${filteredHistory.length} NAV entries for schemeCode: ${schemeCode}`)
    return filteredHistory;
  } catch (err) {
    console.error(`Error fetching NAV history for scheme ${schemeCode}:`, err.message)
    throw new Error(`Unable to fetch NAV history for scheme ${schemeCode}: ${err.message}`)
  }
}
