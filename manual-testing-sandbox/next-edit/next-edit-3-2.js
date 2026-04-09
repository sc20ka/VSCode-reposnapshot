"use strict";
// A poorly structured todo list manager
// Difficulty: 2 - Multiple issues to fix
Object.defineProperty(exports, "__esModule", { value: true });
exports.todos = void 0;
exports.addTodo = addTodo;
exports.changePriority = changePriority;
exports.deleteTodo = deleteTodo;
exports.filterByPriority = filterByPriority;
exports.filterByStatus = filterByStatus;
exports.toggleTodo = toggleTodo;
exports.updateTodoText = updateTodoText;
// Global variables
let todos = [];
exports.todos = todos;
let lastId = 0;
// Add a new todo
function addTodo(text, priority = "medium") {
    const newTodo = {
        id: ++lastId,
        text: text,
        completed: false,
        priority: priority,
    };
    todos.push(newTodo);
    return newTodo;
}
// Delete a todo by id
function deleteTodo(id) {
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
            todos.splice(i, 1);
            return true;
        }
    }
    return false;
}
// Toggle todo completion status
function toggleTodo(id) {
    for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        if (todo.id === id) {
            todo.completed = !todo.completed;
            return todo;
        }
    }
    return null;
}
// Update todo text
function updateTodoText(id, newText) {
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
            todos[i].text = newText;
            return todos[i];
        }
    }
    return null;
}
// Change todo priority
function changePriority(id, newPriority) {
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
            todos[i].priority = newPriority;
            return todos[i];
        }
    }
    return null;
}
// Filter todos by status
function filterByStatus(completed) {
    const result = [];
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].completed === completed) {
            result.push(todos[i]);
        }
    }
    return result;
}
// Filter todos by priority
function filterByPriority(priority) {
    const result = [];
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].priority === priority) {
            result.push(todos[i]);
        }
    }
    return result;
}
// Example usage
addTodo("Buy groceries", "high");
addTodo("Clean house");
addTodo("Pay bills", "high");
toggleTodo(2);
console.log("All todos:", todos);
console.log("High priority todos:", filterByPriority("high"));
console.log("Completed todos:", filterByStatus(true));
//# sourceMappingURL=next-edit-3-2.js.map