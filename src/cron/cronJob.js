import cron from "node-cron"
import Portfolio from "../models/portfolioModel.js"
import { ensureValidSchemeCode } from "../services/portfolioService.js"
import { getLatestNav } from "../services/portfolioService.js";
import latestFundNAV from "../models/latestFundNAV.js"
import historyFundNAV from "../models/historyFundNAV.js";


let updateNavJob
try {
    updateNavJob = cron.schedule("0 0 6 * * *", async () => {
    console.log("Starting daily NAV update at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))
    try {
      const portfolioSchemes = await Portfolio.distinct("schemeCode");
      console.log(`Found ${portfolioSchemes.length} unique scheme codes to update`)

      for (const schemeCode of portfolioSchemes) {
        try {
          console.log(`Validating and updating NAV for schemeCode: ${schemeCode}`)
          await ensureValidSchemeCode(schemeCode)
          const latestNav = await getLatestNav(schemeCode)
          console.log(`Fetched NAV for schemeCode ${schemeCode}:`, latestNav)

          await latestFundNAV.findOneAndUpdate(
            { schemeCode: parseInt(schemeCode, 10) },
            {
              schemeCode: parseInt(schemeCode, 10),
              nav: parseFloat(latestNav.nav),
              date: latestNav.date,
            },
            { upsert: true, new: true }
          );

          await historyFundNAV.create({
            schemeCode: parseInt(schemeCode, 10),
            nav: parseFloat(latestNav.nav),
            date: latestNav.date,
          });

          console.log(`Successfully updated NAV for schemeCode: ${schemeCode}`)
        } catch (error) {
          console.error(`Failed to update NAV for schemeCode: ${schemeCode}, error: ${error.message}`)
        }
      }

      console.log("NAV update completed successfully")
    } catch (error) {
      console.error("NAV update failed:", error.message)
    }
  });

  updateNavJob.start();
  console.log("Cron job initialized and started")
} catch (error) {
  console.error("Failed to initialize cron job:", error.message)
}

export default updateNavJob