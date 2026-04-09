"use strict";
// Event Tracker System - Refactored Solution
// Original: next-edit-4-2.ts
// Refactored to follow SOLID principles
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = exports.EventRepository = exports.events = void 0;
exports.add_event = add_event;
exports.removeEvent = removeEvent;
exports.updateEvent = updateEvent;
exports.addAttendeeToEvent = addAttendeeToEvent;
exports.removeAttendeeFromEvent = removeAttendeeFromEvent;
exports.getEventsByDateRange = getEventsByDateRange;
exports.getEventsByCategory = getEventsByCategory;
// EventRepository - Handles data storage and retrieval
class EventRepository {
    events = [];
    nextEventId = 1;
    getAll() {
        return [...this.events];
    }
    getById(eventId) {
        return this.events.find((event) => event.id === eventId);
    }
    add(event) {
        const newEvent = {
            ...event,
            id: this.nextEventId++,
        };
        this.events.push(newEvent);
        return newEvent.id;
    }
    update(eventId, eventUpdates) {
        const eventIndex = this.findEventIndex(eventId);
        if (eventIndex === -1)
            return false;
        this.events[eventIndex] = {
            ...this.events[eventIndex],
            ...eventUpdates,
        };
        return true;
    }
    remove(eventId) {
        const eventIndex = this.findEventIndex(eventId);
        if (eventIndex === -1)
            return false;
        this.events.splice(eventIndex, 1);
        return true;
    }
    findByDateRange(startDate, endDate) {
        return this.events.filter((event) => event.date >= startDate && event.date <= endDate);
    }
    findByCategory(category) {
        return this.events.filter((event) => event.category === category);
    }
    findEventIndex(eventId) {
        return this.events.findIndex((event) => event.id === eventId);
    }
}
exports.EventRepository = EventRepository;
// EventService - Handles business logic
class EventService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    createEvent(name, date, attendees, location, category) {
        return this.repository.add({
            name,
            date,
            attendees,
            location,
            category,
        });
    }
    updateEvent(eventId, updates) {
        return this.repository.update(eventId, updates);
    }
    removeEvent(eventId) {
        return this.repository.remove(eventId);
    }
    addAttendee(eventId, attendeeName) {
        const event = this.repository.getById(eventId);
        if (!event)
            return false;
        // Don't add if already exists
        if (event.attendees.includes(attendeeName)) {
            return false;
        }
        return this.repository.update(eventId, {
            attendees: [...event.attendees, attendeeName],
        });
    }
    removeAttendee(eventId, attendeeName) {
        const event = this.repository.getById(eventId);
        if (!event)
            return false;
        const initialCount = event.attendees.length;
        const updatedAttendees = event.attendees.filter((name) => name !== attendeeName);
        if (initialCount === updatedAttendees.length) {
            return false; // Attendee wasn't in the list
        }
        return this.repository.update(eventId, {
            attendees: updatedAttendees,
        });
    }
    getEventsByDateRange(startDate, endDate) {
        return this.repository.findByDateRange(startDate, endDate);
    }
    getEventsByCategory(category) {
        return this.repository.findByCategory(category);
    }
    getAllEvents() {
        return this.repository.getAll();
    }
}
exports.EventService = EventService;
// Create instances for use
const eventRepository = new EventRepository();
const eventService = new EventService(eventRepository);
// Example usage
eventService.createEvent("Team Meeting", new Date("2023-06-15T10:00:00"), ["Alice", "Bob", "Charlie"], "Conference Room A", "meeting");
eventService.createEvent("JavaScript Workshop", new Date("2023-06-20T14:00:00"), ["David", "Eve"], "Training Center", "workshop");
console.log("All events:", eventService.getAllEvents());
eventService.addAttendee(1, "Frank");
console.log("Events after adding Frank:", eventService.getAllEvents());
// Export functions with the same interface as the original for backward compatibility
exports.events = eventService.getAllEvents();
function add_event(eventName, eventDate, attendees, location, category) {
    return eventService.createEvent(eventName, eventDate, attendees, location, category);
}
function removeEvent(eventId) {
    return eventService.removeEvent(eventId);
}
function updateEvent(eventId, name, date, attendees, location, category) {
    return eventService.updateEvent(eventId, {
        name,
        date,
        attendees,
        location,
        category,
    });
}
function addAttendeeToEvent(eventId, attendeeName) {
    return eventService.addAttendee(eventId, attendeeName);
}
function removeAttendeeFromEvent(eventId, attendeeName) {
    return eventService.removeAttendee(eventId, attendeeName);
}
function getEventsByDateRange(startDate, endDate) {
    return eventService.getEventsByDateRange(startDate, endDate);
}
function getEventsByCategory(category) {
    return eventService.getEventsByCategory(category);
}
/*
Code Smells in next-edit-4-2.ts:
Violation of Single Responsibility Principle:

The code mixes data storage, business logic, and usage in one flat file
Global state management with events array and nextEventId variable
Poor Encapsulation:

Direct manipulation of the global events array
No protection against external modification of data
Inconsistent Naming Conventions:

Mix of snake_case (add_event) and camelCase (removeEvent)
Lack of consistent function naming patterns
Duplicated Logic:

Repeated event lookup code in multiple functions
Multiple loops to find events by ID
Inefficient Algorithms:

Linear searches through arrays instead of using more efficient methods
Manual implementation of array operations that have built-in methods
No Separation of Concerns:

No distinction between data access and business logic
No clear architecture or organization
Mutable Shared State:

Direct modification of the global events array
No immutability principles


Improvements Made:

Applied SOLID Principles:

Single Responsibility: Split into EventRepository (data storage) and EventService (business logic)
Open/Closed: Better structure for extending functionality without modifying existing code
Interface Segregation: Cleaner interfaces with focused responsibilities
Dependency Inversion: Service depends on repository abstraction


Improved Encapsulation:

Added proper classes with private fields
Controlled access to data through methods
Immutable return values (using spreads and filters)


Consistent Naming:

All methods follow camelCase convention
More descriptive and consistent naming patterns


Removed Duplication:

Centralized event lookup in the repository
Reused code through proper method calls


More Efficient Algorithms:

Used built-in array methods (find, filter, etc.) instead of manual loops
Simplified attendee management logic


Clear Separation of Concerns:

Repository handles data access
Service handles business logic
Maintained backward compatibility with original exports


Better Type Definitions:

Extracted EventCategory type
Used TypeScript features like Partial and Omit for more precise typing
Added proper interfaces


Maintained Backward Compatibility:

Kept original function exports to ensure existing code can work
Added additional exports for new usage patterns
*/
//# sourceMappingURL=next-edit-4-2-sol.js.map