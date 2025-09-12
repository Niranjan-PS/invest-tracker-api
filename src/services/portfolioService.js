import axios from "axios"
import RetryApi from "../helpers/retryExecutor.js"
export const ensureValidSchemeCode = async (schemeCode) => {

  try {
    const schemeFetchResult = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_NAV_HISTORY.replace("{schemeCode}", schemeCode))
    )

    const schemeDetails = schemeFetchResult.data.meta
    if (!schemeDetails.scheme_name) {
      throw new Error('invalid scheme code')
    }
    return schemeDetails

  } catch (apiError) {

    throw new Error("Invalid Scheme Code. Unable to verify fund.")
  }
}



export const getLatestNav = async (schemeCode) => {
  try {

    const apiResponse = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_LATEST_NAV.replace("{schemeCode}", schemeCode))
    ) 
    const data = apiResponse.data.data

    if (!data || data.length === 0) {
      throw new Error(`No latest NAV data available for scheme code: ${schemeCode}`)
    }

    const latest = data[0]

    return {
      nav: parseFloat(latest.nav),
      date: latest.date,
    };
  } catch (apiError) {
    throw new Error("Invalid scheme code or unable to fetch latest NAV")
  }
}



export const getHistoricalNAV = async (schemeCode, purchaseDate) => {

  try {
    const response = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_NAV_HISTORY.replace("{schemeCode}", schemeCode))
    )
    const data = response.data.data
    if (!data || data.length === 0) {
      throw new Error(`No historical NAV data available for scheme code: ${schemeCode}`)
    }
    const purchaseDateObj = new Date(purchaseDate)
    const historicalNAV = data.find((entry) => new Date(entry.date) <= purchaseDateObj)
    if (!historicalNAV) {
      throw new Error(`No NAV data available for purchase date: ${purchaseDate}`)
    }
    return parseFloat(historicalNAV.nav)
  } catch (apiError) {

    throw new Error(`Unable to fetch historical NAV for scheme code: ${schemeCode}`)
  }
}

export const getNAVDataHistory = async (schemeCode, startDate, endDate) => {
  try {
    const response = await RetryApi.executeWithBackoff(()=>
      axios.get(process.env.MF_API_NAV_HISTORY.replace("{schemeCode}", schemeCode)) 
    )
    const data = response.data.data;
    if (!data || data.length === 0) {
      throw new Error(`No NAV data available for scheme code: ${schemeCode}`)
    }
    const start = new Date(startDate.split('-').reverse().join('-')).getTime()
    const end = new Date(endDate.split('-').reverse().join('-')).getTime()
    return data
      .filter(entry => {
        const entryDate = new Date(entry.date.split('-').reverse().join('-')).getTime()
        return entryDate >= start && entryDate <= end
      })
      .map(entry => ({
        date: entry.date,
        nav: parseFloat(entry.nav),
      }));
  } catch (apiError) {

    throw new Error(`Unable to fetch NAV history for scheme code: ${schemeCode}`)
  }
}



export const calculatePortfolioValueForDate = async (portfolioRecord, nav) => {
  try {
    const units = portfolioRecord.units || 0
    const totalValue = units * (nav.nav || 0)
    const historicalNAV = await getHistoricalNAV(portfolioRecord.schemeCode, portfolioRecord.purchaseDate)
    const investedValue = units * (historicalNAV || 0)
    const profitLoss = totalValue - investedValue
    return {
      date: nav.date || new Date().toLocaleDateString('en-GB'),
      totalValue,
      profitLoss,
    }
  } catch (error) {
    console.error("Error calculating portfolio value for date:", error.message)
    throw new Error("Unable to calculate portfolio value for date")
  }
}


export const computePortfolioHistory = async (portfolioRecords, startDate, endDate) => {
  try {
    const historyData = await Promise.all(
      portfolioRecords.map(async (record) => {
        const navHistory = await getNAVDataHistory(record.schemeCode, startDate, endDate);
        return Promise.all(
          navHistory.map(async (nav) => calculatePortfolioValueForDate(record, nav))
        )
      })
    )
    console.log(historyData.flat().slice(0, 11))
    console.log('Full history data length:', historyData.length)
    return [].concat(...historyData).sort((a, b) =>
      new Date(b.date.split('-').reverse().join('-')) - new Date(a.date.split('-').reverse().join('-'))
    )
  } catch (error) {
    console.error("Error computing portfolio history:", error.message);
    throw new Error("Unable to computing portfolio history");
  }
}
