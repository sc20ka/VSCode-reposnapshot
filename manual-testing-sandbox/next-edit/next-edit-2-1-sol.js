"use strict";
// A refactored user validation utility following SOLID principles
// Solution for next-edit-2-1.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidator = exports.NameValidator = exports.EmailValidator = exports.AgeValidator = void 0;
// Individual validators with single responsibilities (Single Responsibility Principle)
class NameValidator {
    validate(name) {
        if (name.length < 2) {
            return { isValid: false, error: "Name is too short" };
        }
        return { isValid: true };
    }
}
exports.NameValidator = NameValidator;
class EmailValidator {
    validate(email) {
        if (!email.includes("@")) {
            return { isValid: false, error: "Invalid email format" };
        }
        return { isValid: true };
    }
}
exports.EmailValidator = EmailValidator;
class AgeValidator {
    validate(age) {
        if (age !== undefined && age < 18) {
            return { isValid: false, error: "User must be 18 or older" };
        }
        return { isValid: true };
    }
}
exports.AgeValidator = AgeValidator;
// Composite validator that uses individual validators (Open/Closed Principle)
class UserValidator {
    validators = {
        name: new NameValidator(),
        email: new EmailValidator(),
        age: new AgeValidator(),
    };
    validate(user) {
        // Validate name
        const nameResult = this.validators.name.validate(user.name);
        if (!nameResult.isValid) {
            return nameResult;
        }
        // Validate email
        const emailResult = this.validators.email.validate(user.email);
        if (!emailResult.isValid) {
            return emailResult;
        }
        // Validate age
        const ageResult = this.validators.age.validate(user.age);
        if (!ageResult.isValid) {
            return ageResult;
        }
        // All validations passed
        return { isValid: true };
    }
}
exports.UserValidator = UserValidator;
// Example usage
const user = {
    name: "Jo",
    email: "jo.example.com",
    age: 25,
    isActive: true,
};
const userValidator = new UserValidator();
const result = userValidator.validate(user);
if (result.isValid) {
    console.log("User is valid");
}
else {
    console.log("Error: " + result.error);
}
/*
Code Smells:
Using global state (validationError variable)
Single validation function doing multiple things
No clear error handling mechanism
Tightly coupled validation logic

Fix:
1. Single Responsibility Principle (SRP)
Created separate validator classes for each validation concern
Each validator is responsible for only one type of validation (name, email, age)


2. Open/Closed Principle (OCP)
The validation system is open for extension (you can add new validators)
The core UserValidator class doesn't need to change when adding new validation rules


3. Interface Segregation Principle (ISP)
Created a clean Validator interface that all validators implement
Each validator only needs to implement a single validation method


4. Dependency Inversion Principle (DIP)
The UserValidator depends on abstractions (the Validator interface)
Specific validators are injected into the UserValidator


5. Other improvements:
Eliminated global state by using return values instead of global variables
Created a proper ValidationResult interface for structured error reporting
Made the validation logic more modular and testable
Each class and function has a clear, single responsibility
*/
//# sourceMappingURL=next-edit-2-1-sol.js.map