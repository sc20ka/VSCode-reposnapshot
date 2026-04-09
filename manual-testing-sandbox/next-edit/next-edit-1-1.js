"use strict";
// A simple utility function with minor issues
// Difficulty: 1 - Easy fixes needed
Object.defineProperty(exports, "__esModule", { value: true });
// Function to calculate total price with discount
function calc_price(items, discountPercentage) {
    // Calculate total price
    let total = 0;
    for (var i = 0; i < items.length; i++) {
        total = total + items[i].price;
    }
    // Apply discount
    if (discountPercentage != undefined) {
        total = total - (total * discountPercentage) / 100;
    }
    return total;
}
// Example usage
const cart = [
    { name: "Shirt", price: 25 },
    { name: "Pants", price: 50 },
    { name: "Shoes", price: 100 },
];
// Calculate price with 10% discount
const finalPrice = calc_price(cart, 10);
console.log("Final price: $" + finalPrice);
// Export function
exports.default = calc_price;
//# sourceMappingURL=next-edit-1-1.js.map