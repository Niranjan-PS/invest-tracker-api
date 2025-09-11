import Portfolio from "../../models/portfolioModel.js";
import ensureValidSchemeCode from "../../services/addPortfolioService.js"

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