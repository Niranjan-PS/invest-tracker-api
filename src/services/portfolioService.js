import axios from "axios";

 export const ensureValidSchemeCode = async (schemeCode) => {

    try {
        const schemeFetchResult = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`)
        
        const schemeDetails = schemeFetchResult.data.meta
        if (!schemeDetails.scheme_name) {
            throw new Error('invalid scheme code')
        }
        return schemeDetails

    } catch (apiError) {
        console.error("External API error:", apiError.message)
        throw new Error("Invalid Scheme Code. Unable to verify fund.")
    }
}



export const getLatestNav= async (schemeCode)=>{
    try {
        const apiResponse=await axios.get(`https://api.mfapi.in/mf/${schemeCode}`)
        const data=apiResponse.data.data
        //  console.log('data from api for GetLatestNAV:',data)

        if(!data|| data.length<=0){
            throw new Error('there is no NAVdata available for this code'+schemeCode)
        }
         const latest = data[0]
         console.log('data from api for GetLatestNAV sorted:',latest)
    return {
      nav: parseFloat(latest.nav), 
      date: latest.date, 
    };
    } catch (apiError) {
        console.log("error while fetching NAV data",error.message)
        throw new Error('invalid code,please enter valid code to fetch data')
    }
}



export const getHistoricalNAV = async (schemeCode, purchaseDate) => {
  try {
    const response = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`)
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
    console.error("Historical NAV fetch error:", apiError.message)
    throw new Error(`Unable to fetch historical NAV for scheme code: ${schemeCode}`)
  }
}