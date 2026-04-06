import express from "express";
import { viewTariff, editTariff } from "../controllers/tariffController.js";
import { updateTariffRules } from "../validators/tariffValidation.js";
import { protect, authorize } from "../middlewares/auth.middleware.js"; // add your auth middleware

const router = express.Router();

//read
router.get("/", viewTariff);

// Tariff editing stays behind admin roles because it changes billing for the whole system.
router.put("/", protect, authorize("admin", "superadmin"), updateTariffRules, editTariff);

export default router;
