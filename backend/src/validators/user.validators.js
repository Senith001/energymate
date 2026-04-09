import { body } from "express-validator";
import { passwordRule } from "./common.rules.js";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 30 })
    .withMessage("Name must not exceed 30 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name cannot contain special characters/digits"),

  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("phone")
    .trim()
    .notEmpty().withMessage("Mobile number is required")
    .matches(/^(0[0-9]{9}|(77|76|74|78|75|71|70|72)[0-9]{7})$/).withMessage("Invalid mobile number"),
  passwordRule("password"),
];

export const resetPasswordValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("otp").trim().notEmpty().withMessage("OTP is required"),
  passwordRule("newPassword"),
];

export const changeMyPasswordValidator = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  passwordRule("newPassword"),
];

export const adminChangeUserPasswordValidator = [
  passwordRule("password"),
];

export const updateProfileValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 30 })
    .withMessage("Name must not exceed 30 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name cannot contain special characters/digits"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^(0[0-9]{9}|(77|76|74|78|75|71|70)[0-9]{7})$/)
    .withMessage("Invalid mobile number"),
  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .matches(/^[A-Za-z0-9/\-, ]+$/)
    .withMessage("Address can only contain letters, numbers, '/', and '-'")
    .isLength({ max: 100 })
    .withMessage("Address must not exceed 100 characters"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 50 })
    .withMessage("City must not exceed 50 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("City can only contain English letters and spaces"),
];