import Portfolio from "../../models/portfolioModel.js"
import mongoose from "mongoose"
import { ensureValidSchemeCode, getLatestNav, getHistoricalNAV } from "../../services/portfolioService.js"

export const addPortfolioFund = async (req, res) => {
    try {
        const { schemeCode, units } = req.body
        if (!schemeCode || !units) {
            return res.status(400).json({ success: false, message: "schemeCodes and units are required" })
        }

        if (typeof schemeCode !== "number" || schemeCode <= 0) {
            return res.status(400).json({ success: false, message: 'schmemeCode must be a positive integer ' })
        }
        if (typeof units !== "number" || units <= 0) {
            return res.status(400).json({ success: false, message: 'units must be a positive integer ' })
        }

        const schemeData = await ensureValidSchemeCode(schemeCode)

        const newFundRecord = new Portfolio({
            userId: req.user.id,
            schemeCode,
            units,
            purchaseDate: new Date(),
        })

        await newFundRecord.save()
        res.status(201).json({
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
        console.log('error while adding fund to portfolio', error.message)
        res.status(500).json({
            success: false,
            message: 'error while adding fund to portfolio or invalid scheme-code',
            error: error.message
        })
    }
}




export const getPortfolioValue = async (req, res) => {
    try {

        const userId = req.user._id
        console.log("User ID:", req.user.id)

        const portfolioRecords = await Portfolio.find({ userId: new mongoose.Types.ObjectId(req.user.id) })
        console.log(portfolioRecords, "this is the user")

        if (!portfolioRecords || portfolioRecords.length == 0) {
            return res.status(404).json({
                success: false,
                message: "No portfolio records found for this user",
            });
        }


        const fundSummary = await Promise.all(
            portfolioRecords.map(async (data) => {
                const schemeDetails = await ensureValidSchemeCode(data.schemeCode)
                const latestNAV = await getLatestNav(data.schemeCode)
                console.log(latestNAV,"this is the latestnav")
                const historicalNAV = await getHistoricalNAV(data.schemeCode, data.purchaseDate)
                console.log("Historical NAV is-", data.schemeCode, ":", historicalNAV);
                const currentValue = data.units * latestNAV.nav
                console.log("Calculated currentValue:", currentValue);
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
        console.log(totalInvestment, "TI")
        const totalCurrentValue = fundSummary.reduce((sum, fund) => sum + fund.currentValue, 0)
        console.log(totalInvestment, ":this is the total current val")
        const totalProfitLoss = fundSummary.reduce((sum, fund) => sum + fund.profitLoss, 0)
        console.log(totalProfitLoss, "total profitLoss")
        const totalProfitLossPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment ) * 100 : 0
        console.log(totalProfitLossPercentage, "percentage of tplp")
        const asOnDate = fundSummary.length > 0 ? (await getLatestNav(fundSummary[0].schemeCode)).date : null
        console.log(asOnDate)

        res.status(200).json({
            success: true,
            message: "Portfolio values are calculated successfully",
            portfolio: {
                investedValue:totalInvestment,
                currentValue:totalCurrentValue,
                profitLoss:totalProfitLoss,
                profitLossPercentage:totalProfitLossPercentage,
                asOn:asOnDate,
                holdings: fundSummary,
            },
        })
        
    } catch (error) {
        console.error("Error calculating portfolio value:", error.message);

        res.status(500).json({
            success: false,
            message: "Error calculating portfolio value",
            error: error.message
        })

    }
}