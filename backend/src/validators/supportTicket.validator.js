import { body, param } from "express-validator";

export const createTicketValidator = [
  body("name").optional().trim(),
  body("email").optional().trim().isEmail(),
  body("subject").trim().notEmpty().withMessage("subject is required"),
  body("description").trim().notEmpty().withMessage("description is required"),

  body("category")
    .optional()
    .isIn(["Appliance Issue", "Room Issue", "Energy Target Issue", "Billing Issue", "Other"])
    .withMessage("invalid category"),

  body("priority")
    .optional()
    .isIn(["High", "Medium", "Low"])
    .withMessage("priority must be High/Medium/Low"),
];

export const ticketIdParamValidator = [
  param("id").isMongoId().withMessage("invalid ticket id"),
];

export const updateTicketStatusValidator = [
  param("id").isMongoId().withMessage("invalid ticket id"),
  body("status")
    .notEmpty()
    .isIn(["Open", "In Progress", "Resolved"])
    .withMessage("status must be Open/In Progress/Resolved"),
];

export const addMessageValidator = [
  param("id").isMongoId().withMessage("invalid ticket id"),
  body("text").trim().notEmpty().withMessage("text is required"),
  body("sender")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("sender must be user/admin"),
];