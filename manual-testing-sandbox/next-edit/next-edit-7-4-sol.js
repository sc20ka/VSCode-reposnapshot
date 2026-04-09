"use strict";
// Refactored event processing system with proper separation of concerns
// Solution for next-edit-7-4.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.Application = exports.AnalyticsService = exports.UIManager = exports.PreferencesManager = exports.AuthService = exports.AppState = exports.EventEmitter = void 0;
exports.getCurrentCount = getCurrentCount;
exports.resetCount = resetCount;
exports.setUsername = setUsername;
class EventEmitter {
    events = new Map();
    processingQueue = [];
    isProcessing = false;
    constructor() {
        // Initialize event collections
        this.events.set("click", new Set());
        this.events.set("hover", new Set());
        this.events.set("scroll", new Set());
        this.events.set("keypress", new Set());
        this.events.set("resize", new Set());
        this.events.set("load", new Set());
    }
    on(eventType, callback) {
        const handlers = this.events.get(eventType) || new Set();
        handlers.add(callback);
        this.events.set(eventType, handlers);
    }
    off(eventType, callback) {
        const handlers = this.events.get(eventType);
        if (handlers) {
            handlers.delete(callback);
        }
    }
    emit(eventType, data) {
        if (this.isProcessing) {
            this.processingQueue.push({ type: eventType, data });
            return;
        }
        this.isProcessing = true;
        try {
            this.processEvent(eventType, data);
            // Process queue
            while (this.processingQueue.length > 0) {
                const next = this.processingQueue.shift();
                this.processEvent(next.type, next.data);
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    processEvent(eventType, data) {
        const handlers = this.events.get(eventType) || new Set();
        for (const handler of handlers) {
            handler(data);
        }
    }
}
exports.EventEmitter = EventEmitter;
// State management with proper encapsulation
class AppState {
    _count = 0;
    _lastEvent = null;
    _eventHistory = [];
    get count() {
        return this._count;
    }
    set count(value) {
        this._count = value;
    }
    get lastEvent() {
        return this._lastEvent;
    }
    get eventHistory() {
        return [...this._eventHistory];
    }
    recordEvent(type, data) {
        this._lastEvent = { type, data, timestamp: Date.now() };
        this._eventHistory.push(`${type}:${JSON.stringify(data)}`);
    }
    incrementCount() {
        this._count++;
    }
    resetCount() {
        this._count = 0;
    }
    formatEventHistory() {
        return this._eventHistory
            .map((event, index) => `${index + 1}. ${event}`)
            .join("\n");
    }
}
exports.AppState = AppState;
class AuthService {
    eventEmitter;
    isActive = false;
    token = "";
    userData = null;
    username = "";
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    setUsername(name) {
        this.username = name;
    }
    getUsername() {
        return this.username;
    }
    async login(username, password) {
        console.log(`Attempting login for ${username}...`);
        return new Promise((resolve) => {
            // Simulate API call
            setTimeout(() => {
                this.isActive = true;
                this.token = `token-${Math.random().toString(36).substring(7)}`;
                this.userData = {
                    name: username,
                    role: "user",
                    loginTime: new Date(),
                };
                this.eventEmitter.emit("load", { user: username });
                resolve();
            }, 1000);
        });
    }
    logout() {
        this.isActive = false;
        this.token = "";
        this.userData = null;
        this.eventEmitter.emit("load", { user: null });
    }
    isAuthenticated() {
        return this.isActive;
    }
    getUserData() {
        return this.userData;
    }
}
exports.AuthService = AuthService;
// Preferences management - separate concern
class PreferencesManager {
    preferences = {
        theme: "light",
        fontSize: 12,
        notifications: true,
    };
    getPreference(key) {
        return this.preferences[key];
    }
    updatePreference(key, value) {
        this.preferences[key] = value;
    }
}
exports.PreferencesManager = PreferencesManager;
// UI management - separate concern
class UIManager {
    appState;
    preferencesManager;
    eventEmitter;
    constructor(appState, preferencesManager, eventEmitter) {
        this.appState = appState;
        this.preferencesManager = preferencesManager;
        this.eventEmitter = eventEmitter;
        // Set up default click handler
        this.eventEmitter.on("click", (data) => {
            console.log("Default click handler:", data);
            this.appState.incrementCount();
            this.appState.recordEvent("click", data);
            this.updateUI();
        });
    }
    updateUI() {
        const countElement = document.getElementById("count");
        if (countElement) {
            countElement.textContent = String(this.appState.count);
        }
        // Apply theme
        document.body.className = this.preferencesManager.getPreference("theme");
        // Update last event display
        const lastEventElement = document.getElementById("lastEvent");
        if (lastEventElement && this.appState.lastEvent) {
            lastEventElement.textContent = JSON.stringify(this.appState.lastEvent);
        }
    }
}
exports.UIManager = UIManager;
class AnalyticsService {
    appState;
    authService;
    constructor(appState, authService) {
        this.appState = appState;
        this.authService = authService;
    }
    trackEvent(category, action, label) {
        const eventData = { category, action, label, timestamp: Date.now() };
        console.log("Tracking event:", eventData);
        this.appState.recordEvent("analytics", eventData);
        if (this.authService.isAuthenticated()) {
            this.sendToAnalyticsService(eventData);
        }
    }
    sendToAnalyticsService(data) {
        // Pretend API call
        console.log("Sending to analytics service:", data);
    }
}
exports.AnalyticsService = AnalyticsService;
// Application class to orchestrate all components
class Application {
    eventEmitter;
    appState;
    authService;
    preferencesManager;
    uiManager;
    analyticsService;
    constructor() {
        // Initialize all components with proper dependencies
        this.eventEmitter = new EventEmitter();
        this.appState = new AppState();
        this.authService = new AuthService(this.eventEmitter);
        this.preferencesManager = new PreferencesManager();
        this.uiManager = new UIManager(this.appState, this.preferencesManager, this.eventEmitter);
        this.analyticsService = new AnalyticsService(this.appState, this.authService);
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Setup DOM event listeners
        document.addEventListener("DOMContentLoaded", () => {
            this.eventEmitter.emit("load", { page: "home" });
            document.addEventListener("click", (e) => {
                this.eventEmitter.emit("click", {
                    target: e.target,
                    x: e.clientX,
                    y: e.clientY,
                });
                // Handle login button click
                if (e.target && e.target.id === "login-button") {
                    this.authService.login(this.authService.getUsername(), "hardcoded-password");
                }
            });
            document.addEventListener("keypress", (e) => {
                this.eventEmitter.emit("keypress", { key: e.key, code: e.code });
            });
        });
    }
    // Public API for application
    on(eventType, callback) {
        this.eventEmitter.on(eventType, callback);
    }
    emit(eventType, data) {
        this.eventEmitter.emit(eventType, data);
    }
    getCurrentCount() {
        return this.appState.count;
    }
    resetCount() {
        this.appState.resetCount();
        this.eventEmitter.emit("click", { action: "reset" });
        this.uiManager.updateUI();
    }
    setUsername(name) {
        this.authService.setUsername(name);
    }
    updatePreference(key, value) {
        this.preferencesManager.updatePreference(key, value);
        this.uiManager.updateUI();
        this.analyticsService.trackEvent("preferences", "update", `${key}:${value}`);
    }
    trackEvent(category, action, label) {
        this.analyticsService.trackEvent(category, action, label);
    }
    formatEventHistory() {
        return this.appState.formatEventHistory();
    }
}
exports.Application = Application;
// Create and export singleton application instance
exports.app = new Application();
// Simplified API for backward compatibility
function getCurrentCount() {
    return exports.app.getCurrentCount();
}
function resetCount() {
    exports.app.resetCount();
}
function setUsername(name) {
    exports.app.setUsername(name);
}
/*
Code Smells in the Original Code

Violation of Single Responsibility Principle (SRP):

The EventManager class was a "God class" handling events, UI updates, authentication, analytics, and preferences
Functions had multiple responsibilities mixed together


Global State Abuse:

Direct manipulation of a global mutable state object
No encapsulation or proper state management


Tight Coupling:

Direct DOM manipulation in the event manager
Hard dependencies between unrelated concerns (events, auth, UI)


Poor Extensibility:

Singleton pattern limiting testability and flexibility
Hardcoded event types and handlers
No interface-based design


Dependency Issues:

Direct instantiation of dependencies
No dependency injection
High-level modules depending on low-level details


Security Concerns:

Hardcoded password in code
No proper authentication flow


Maintainability Problems:

Scattered responsibilities making the code hard to maintain
Side effects hidden throughout the codebase


Improvements Made in the Solution

Applied Single Responsibility Principle:

Split the monolithic EventManager into specialized classes (EventEmitter, AppState, AuthService, etc.)
Each class now has a clear, focused responsibility


Improved Encapsulation:

Replaced global state with proper encapsulated classes
Added getters/setters to control state access
Private fields to protect internal state


Implemented Interface-based Design:

Created interfaces like IEventEmitter, IAuthService, and IAnalyticsService
Enables future extension and easier testing


Applied Dependency Inversion:

Components depend on abstractions rather than concrete implementations
Dependencies are injected through constructors
High-level modules no longer depend directly on low-level modules


Better Organization:

Segregated interfaces to follow Interface Segregation Principle
Clear separation between UI, state, authentication, and event handling


Enhanced Extensibility:

Event system now uses Sets instead of Arrays for better performance and to avoid duplicate handlers
Added ability to remove event listeners with the off method
Created proper type definitions for better type safety


Improved State Management:

Centralized state in the AppState class with proper access controls
Immutable collection returns (using spreads and readonly)
Clear state manipulation methods


Better Event Processing:

Cleaner event queue handling
More efficient event processing


Application Orchestration:

Created an Application class to coordinate all components
Maintains backward compatibility with the original API
Provides a cleaner facade for all operations
*/
//# sourceMappingURL=next-edit-7-4-sol.js.map