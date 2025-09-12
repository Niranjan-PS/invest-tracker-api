import Portfolio from "../../models/portfolioModel.js"
import mongoose from "mongoose"
import { ensureValidSchemeCode, getLatestNav, getHistoricalNAV, computePortfolioHistory } from "../../services/portfolioService.js"
import { getUserPortfolioRecords, validateUserAndSchemeCode } from "../../helpers/portfolioHelpers.js"
import HttpStatus from "../../helpers/httpStatusCodes.js"
import { validateAddFund, validateRemoveFund, validatePortfolioValue,validateNAVHistory, checkValidationResult } from "../../helpers/validation.js"


export const addPortfolioFund = async (req, res) => {
    try {
        checkValidationResult(req,res,()=>{})

        const { schemeCode, units } = req.body
        if (!schemeCode || !units) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "schemeCodes and units are required" })
        }

        if (typeof schemeCode !== "number" || schemeCode <= 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'schmemeCode must be a positive integer ' })
        }
        if (typeof units !== "number" || units <= 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'units must be a positive integer ' })
        }

        const schemeData = await ensureValidSchemeCode(schemeCode)

        const newFundRecord = new Portfolio({
            userId: req.user.id,
            schemeCode,
            units,
            purchaseDate: new Date(),
        })

        await newFundRecord.save()
        res.status(HttpStatus.CREATED).json({
            success: true,
            message: "new fund record saved to portfolio successfully",
            fundRecord: {
                id: newFundRecord._id,
                schemeCode,
                schemeName: schemeData.scheme_name,
                units,
                addedAt: newFundRecord.createdAt
            }

        })

    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error while adding fund to portfolio or invalid scheme-code',
            error: error.message
        })
    }
}



export const getPortfolioValue = async (req, res) => {
    try {
        checkValidationResult(req,res,()=>{})

        const portfolioRecords = await getUserPortfolioRecords(req, res)

        const fundSummary = await Promise.all(
            portfolioRecords.map(async (data) => {
                const schemeDetails = await ensureValidSchemeCode(data.schemeCode)
                const latestNAV = await getLatestNav(data.schemeCode)
                const historicalNAV = await getHistoricalNAV(data.schemeCode, data.purchaseDate)
                const currentValue = data.units * latestNAV.nav
                const investedValue = data.units * historicalNAV
                const profitLoss = currentValue - investedValue
                return {
                    schemeCode: data.schemeCode,
                    schemeName: schemeDetails.scheme_name,
                    units: data.units,
                    currentNAV: latestNAV.nav,
                    currentValue,
                    investedValue,
                    profitLoss,
                }
            })
        )
        const totalInvestment = fundSummary.reduce((sum, fund) => sum + fund.investedValue, 0)
        const totalCurrentValue = fundSummary.reduce((sum, fund) => sum + fund.currentValue, 0)
        const totalProfitLoss = fundSummary.reduce((sum, fund) => sum + fund.profitLoss, 0)
        const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0
        const asOnDate = fundSummary.length > 0 ? (await getLatestNav(fundSummary[0].schemeCode)).date : null

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Portfolio values are calculated successfully",
            portfolio: {
                investedValue: totalInvestment,
                currentValue: totalCurrentValue,
                profitLoss: totalProfitLoss,
                profitLossPercentage: totalProfitLossPercentage,
                asOn: asOnDate,
                holdings: fundSummary,
            },
        })
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error calculating portfolio value",
            error: error.message
        })

    }
}


export const getNAVhistory = async (req, res) => {
    try {
        checkValidationResult(req,res,()=>{})
        const portfolioRecords = await getUserPortfolioRecords(req, res)

        const today = new Date();
        const defaultStart = new Date(today.setDate(today.getDate() - 30)).toLocaleDateString('en-GB')
        const startDate = req.query.startDate || defaultStart;
        const endDate = req.query.endDate || new Date().toLocaleDateString('en-GB')
        console.log("Date Range:", { startDate, endDate })

        const historyData = await computePortfolioHistory(portfolioRecords, startDate, endDate)

        res.status(HttpStatus.OK).json({
            success: true,
            data: historyData,
        });

    } catch (error) {
        console.log(error.message, "nav histroy fetch error")
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "eror while fetching NAV histroy", error: error.message })
    }
}

export const getPortfolioList = async (req, res) => {
    try {
        
        const portfolioRecords = await getUserPortfolioRecords(req, res)
        console.log('listout the portfoliorecords', portfolioRecords)

        const holdings = await Promise.all(
            portfolioRecords.map(async (data) => {
                const schemeDetails = await ensureValidSchemeCode(data.schemeCode)
                const latestNAVData = await getLatestNav(data.schemeCode)
                console.log("Latest NAV Data for scheme", data.schemeCode, ":", latestNAVData)
                const units = data.units || 0
                const currentNav = latestNAVData.nav
                const currentValue = units * currentNav

                return {
                    schemeCode: data.schemeCode,
                    schemeName: schemeDetails.scheme_name,
                    units: data.units,
                    currentNav,
                    currentValue: Number(currentValue.toFixed(2)),
                };
            })
        );

        const totalHoldings = holdings.length;

        res.status(HttpStatus.OK).json({
            success: true,
            data: {
                totalHoldings,
                holdings,
            },
        });
    } catch (error) {
        console.error("Error fetching portfolio list:", error.message)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error fetching portfolio list",
        });
    }
};


export const removePortfolioFund = async (req, res) => {
    try {
        checkValidationResult(req,res,()=>{})

        const userId = req.user._id
        const { schemeCode } = req.params

        const validate = validateUserAndSchemeCode(userId, schemeCode)
        if (!validate.valid) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Invalid SchemeCode and UserID" })
        }

        await ensureValidSchemeCode(schemeCode)

        const removeResult = await Portfolio.deleteOne({
            userId: new mongoose.Types.ObjectId(userId),
            schemeCode: parseInt(schemeCode, 10)
        })
        if (removeResult.deletedCount == 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "no fund or record found in portfolio" })
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Fund removed from portfolio successfully",
        })

    } catch (error) {
        console.log('error while removing records:', error.message)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error removing records or fund from portfolio",
            error: error.message,
        })
    }



}

