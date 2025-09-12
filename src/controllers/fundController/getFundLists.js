import Fund from "../../models/fundModel.js"
import { verifySchemeCode, fetchLatestNav, fetchNavHistory, fetchAndStoreFundList } from "../../services/fundService.js"
import HttpStatus from "../../helpers/httpStatusCodes.js"
import { validateFetchFundList, validateFetchFundNAVHistory, checkValidationResult } from "../../helpers/validation.js"


export const fetchFundList = async (req, res) => {
  try {

    checkValidationResult(req,res,()=>{})
    const { search = "", page = 1, limit = 20 } = req.query

    const query = search
      ? { schemeName: { $regex: search, $options: "i" } }
      : {}

    const totalFunds = await Fund.countDocuments(query)
    console.log('this is the totalFunds', totalFunds)
    if (totalFunds === 0) {
      await fetchAndStoreFundList()
    }
    const funds = await Fund.find(query)
      .select("schemeCode schemeName")
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))

    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        funds,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(totalFunds / limit),
          totalFunds,
          hasNext: page * limit < totalFunds,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching funds:", error.message)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to fetch funds list",
    })
  }
}



export const fetchFundNAVHistory = async (req, res) => {
  try {
     checkValidationResult(req,res,()=>{})
    const { schemeCode } = req.params


    const today = new Date();
    const defaultStart = new Date(new Date().setDate(today.getDate() - 30))
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")
    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || today.toLocaleDateString("en-GB").replace(/\//g, "-")
   

    if (!schemeCode || isNaN(parseInt(schemeCode))) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Invalid scheme code" });
    }

    const fundDetails = await verifySchemeCode(schemeCode)
    const latestNav = await fetchLatestNav(schemeCode)
    const history = await fetchNavHistory(schemeCode, startDate, endDate);


    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        schemeCode: parseInt(schemeCode, 10),
        schemeName: fundDetails.scheme_name,
        currentNav: latestNav.nav,
        asOn: latestNav.date,
        history,
      },
    })
  } catch (error) {
    console.error("Error fetching NAV history:", error.message)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to fetch NAV history as per the api",
      details: error.message
    });
  }
};