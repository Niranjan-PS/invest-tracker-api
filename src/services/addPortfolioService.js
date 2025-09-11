import axios from "axios";

 const ensureValidSchemeCode = async (schemeCode) => {

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
export default ensureValidSchemeCode