"use strict";
// A simple user validation utility with poor organization
// Difficulty: 1 - Easy fixes needed
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationError = void 0;
exports.validateUser = validateUser;
// Global variable to store error messages
let validationError = "";
exports.validationError = validationError;
// Function to validate user data
function validateUser(data) {
    // Reset error
    exports.validationError = validationError = "";
    // Check name
    if (data.name.length < 2) {
        exports.validationError = validationError = "Name is too short";
        return false;
    }
    // Check email
    if (!data.email.includes("@")) {
        exports.validationError = validationError = "Invalid email format";
        return false;
    }
    // Check age if provided
    if (data.age != undefined) {
        if (data.age < 18) {
            exports.validationError = validationError = "User must be 18 or older";
            return false;
        }
    }
    // All validations passed
    return true;
}
// Example usage
const user = {
    name: "Jo",
    email: "jo.example.com",
    age: 25,
    isActive: true,
};
if (validateUser(user)) {
    console.log("User is valid");
}
else {
    console.log("Error: " + validationError);
}
//# sourceMappingURL=next-edit-2-1.js.map