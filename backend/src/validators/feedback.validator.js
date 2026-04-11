import { body, param } from "express-validator";

export const createFeedbackValidator = [
  body("name").optional().trim(),
  body("email").optional().trim().isEmail().withMessage("valid email is required"),
  body("subject").trim().notEmpty().withMessage("subject is required"),
  body("message").trim().notEmpty().withMessage("message is required"),
  body("category")
    .optional()
    .isIn(["Dashboard", "Rooms", "Appliances", "Support", "Other"])
    .withMessage("invalid category"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("rating must be 1-5"),
];

export const feedbackIdParamValidator = [
  param("id").isMongoId().withMessage("invalid feedback id"),
];

export const updateFeedbackStatusValidator = [
  param("id").isMongoId().withMessage("invalid feedback id"),
  body("status")
    .notEmpty()
    .isIn(["Submitted", "Reviewed"])
    .withMessage("status must be Submitted/Reviewed"),
];