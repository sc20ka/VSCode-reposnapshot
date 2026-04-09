"use strict";
// A well-structured todo list manager following SOLID principles
// Refactored solution for next-edit-3-2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.todoManager = exports.TodoManager = void 0;
// TodoManager class following Single Responsibility Principle
class TodoManager {
    todos = new Map();
    lastId = 0;
    // Create a new todo
    addTodo(text, priority = "medium") {
        // Input validation
        if (!text.trim()) {
            throw new Error("Todo text cannot be empty");
        }
        const newTodo = {
            id: ++this.lastId,
            text: text.trim(),
            completed: false,
            priority,
        };
        this.todos.set(newTodo.id, newTodo);
        return { ...newTodo }; // Return a copy to prevent direct modification
    }
    // Delete a todo by id
    deleteTodo(id) {
        return this.todos.delete(id);
    }
    // Toggle todo completion status
    toggleTodo(id) {
        const todo = this.todos.get(id);
        if (!todo)
            return null;
        const updatedTodo = { ...todo, completed: !todo.completed };
        this.todos.set(id, updatedTodo);
        return { ...updatedTodo };
    }
    // Update todo text
    updateTodoText(id, newText) {
        if (!newText.trim()) {
            throw new Error("Todo text cannot be empty");
        }
        const todo = this.todos.get(id);
        if (!todo)
            return null;
        const updatedTodo = { ...todo, text: newText.trim() };
        this.todos.set(id, updatedTodo);
        return { ...updatedTodo };
    }
    // Change todo priority
    changePriority(id, newPriority) {
        const todo = this.todos.get(id);
        if (!todo)
            return null;
        const updatedTodo = { ...todo, priority: newPriority };
        this.todos.set(id, updatedTodo);
        return { ...updatedTodo };
    }
    // Get all todos
    getAllTodos() {
        return Array.from(this.todos.values()).map((todo) => ({ ...todo }));
    }
    // Filter todos by various criteria (following Open/Closed Principle)
    filterTodos(predicate) {
        return this.getAllTodos().filter(predicate);
    }
    // Helper methods built on top of filterTodos
    getCompletedTodos() {
        return this.filterTodos((todo) => todo.completed);
    }
    getActiveTodos() {
        return this.filterTodos((todo) => !todo.completed);
    }
    getTodosByPriority(priority) {
        return this.filterTodos((todo) => todo.priority === priority);
    }
}
exports.TodoManager = TodoManager;
// Create a singleton instance
const todoManager = new TodoManager();
exports.todoManager = todoManager;
// Example usage
todoManager.addTodo("Buy groceries", "high");
todoManager.addTodo("Clean house");
todoManager.addTodo("Pay bills", "high");
todoManager.toggleTodo(2);
console.log("All todos:", todoManager.getAllTodos());
console.log("High priority todos:", todoManager.getTodosByPriority("high"));
console.log("Completed todos:", todoManager.getCompletedTodos());
/*
Code Smells in next-edit-3-2.ts:
Global state - using global variables for todos and lastId
Single Responsibility Principle violation - mixing data management with business logic
Duplicated code in several functions that iterate through todos
No clear abstraction layers - direct manipulation of the data structure
No validation or error handling
No proper typing for priority values
No encapsulation - direct access to the todos array
No use of more efficient data structures (using array iteration instead of maps/objects)

Improvements Made in the Refactored Solution:

Encapsulation and Data Hiding

Created a TodoManager class to encapsulate all operations and data
Made todos and lastId private members of the class
Used a Map instead of an array for more efficient lookup by id


Proper Type Definitions

Defined a proper Todo interface
Created a union type for Priority with specific allowed values


Single Responsibility Principle

Each method has a clear, single responsibility
Separated data structure management from business logic


Open/Closed Principle

Introduced a general filterTodos method that accepts a predicate
Built specialized filter methods on top of this generic one


Data Integrity and Validation

Added validation for todo text to prevent empty todos
Return copies of todos to prevent direct modification of internal state


Reduced Code Duplication

Eliminated repeated code for finding todos by id
Consolidated filtering logic into a single method


Improved Performance

Used a Map data structure for O(1) lookups by id instead of O(n) array iterations
More efficient todo retrieval and manipulation


Better API Design

Added more helper methods for common operations
Created a consistent interface with descriptive method names
Added a method to get all todos instead of directly accessing the array


Error Handling

Added basic input validation with meaningful error messages


Immutability

Returned copies of objects rather than references to internal state
Used object spread to create new objects when updating
*/
//# sourceMappingURL=next-edit-3-2-sol.js.map