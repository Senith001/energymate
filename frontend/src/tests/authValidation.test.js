import { describe, it, expect } from 'vitest';

// A mock version of the validation logic we built in UserProfile
const validatePhone = (phone) => {
  if (!phone.trim()) return "Mobile number is required";
  if (!/^(0[0-9]{9}|(77|76|74|78|75|71|70|72)[0-9]{7})$/.test(phone.trim())) return "Invalid mobile number";
  return null;
};

describe('Auth & Profile Validation Logic', () => {
  it('should accept valid Sri Lankan phone numbers', () => {
    expect(validatePhone('0771234567')).toBeNull(); // Null means no error
    expect(validatePhone('0719876543')).toBeNull();
  });

  it('should reject letters in phone numbers', () => {
    expect(validatePhone('077123abcd')).toBe("Invalid mobile number");
  });

  it('should require a phone number', () => {
    expect(validatePhone('')).toBe("Mobile number is required");
  });
});