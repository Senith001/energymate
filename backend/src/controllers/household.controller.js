import Household from "../models/Household.js";
import Room from "../models/Room.js";
import Appliance from "../models/Appliance.js";

import { getReqUserId, isAdmin } from "../utils/authHelpers.js";

import { getWeatherByCity, generateEnergyTip } from "../services/weather.service.js";

export const createHousehold = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);

    const household = await Household.create({
      ...req.body,
      userId,
    });

    res.status(201).json(household);
  } catch (err) {
    next(err);
  }
};

export const getAllHouseholds = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);
    const pageParam = req.query.page;
    
    // If no page is specified, return all households as a simple array (Backward Compatibility)
    if (!pageParam) {
      const query = isAdmin(req) ? {} : { userId };
      const households = await Household.find(query).populate("userId", "name email");
      const enhancedHouseholds = await Promise.all(households.map(async (h) => {
        const roomCount = await Room.countDocuments({ householdId: h._id });
        const applianceCount = await Appliance.countDocuments({ householdId: h._id });
        return { ...h._doc, userId: h.userId, roomCount, applianceCount };
      }));
      return res.status(200).json(enhancedHouseholds);
    }

    // Otherwise, use pagination for Admin/Advanced views
    const page = parseInt(pageParam) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = isAdmin(req) ? {} : { userId };

    const total = await Household.countDocuments(query);
    const households = await Household.find(query)
      .populate("userId", "name email")
      .skip(skip)
      .limit(limit);
    
    const enhancedHouseholds = await Promise.all(households.map(async (h) => {
      const roomCount = await Room.countDocuments({ householdId: h._id });
      const applianceCount = await Appliance.countDocuments({ householdId: h._id });
      return { ...h._doc, userId: h.userId, roomCount, applianceCount };
    }));

    res.status(200).json({
      households: enhancedHouseholds,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

export const getHouseholdById = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);

    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

    const household = await Household.findOne(filter);

    if (!household) return res.status(404).json({ message: "Household not found" });

    res.status(200).json(household);
  } catch (err) {
    next(err);
  }
};

export const updateHousehold = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);

    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

    const updated = await Household.findOneAndUpdate(filter, req.body, { new: true });

    if (!updated) return res.status(404).json({ message: "Household not found" });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteHousehold = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);

    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

    const deleted = await Household.findOneAndDelete(filter);

    if (!deleted) return res.status(404).json({ message: "Household not found" });

    res.status(200).json({ message: "Household deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateHouseholdSettings = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);
    const { monthlyKwhTarget, monthlyCostTarget, currency } = req.body;

    const updateData = {};
    if (monthlyKwhTarget !== undefined) updateData.monthlyKwhTarget = monthlyKwhTarget;
    if (monthlyCostTarget !== undefined) updateData.monthlyCostTarget = monthlyCostTarget;
    if (currency !== undefined) updateData.currency = currency;

    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

    const updated = await Household.findOneAndUpdate(filter, updateData, { new: true });

    if (!updated) return res.status(404).json({ message: "Household not found" });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const getHouseholdWeather = async (req, res, next) => {
  try {
    const userId = getReqUserId(req);

    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

    const household = await Household.findOne(filter);
    if (!household) return res.status(404).json({ message: "Household not found" });

    const weather = await getWeatherByCity(household.city);
    const tip = generateEnergyTip(weather.temperature);

    res.status(200).json({
      householdId: household._id,
      city: household.city,
      weather,
      tip,
    });
  } catch (err) {
    next(err);
  }
};