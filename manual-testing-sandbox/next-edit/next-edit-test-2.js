"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Node {
}
class ParagraphNode extends Node {
    text;
    constructor(text) {
        super();
        this.text = text;
    }
    render() {
        return `<p>${this.text}</p>`;
    }
}
class ListNode extends Node {
    items;
    constructor(items) {
        super();
        this.items = items;
    }
    render() {
        return `<ul>${this.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    }
}
class DocumentEditor {
    nodes = [];
    undoStack = [];
    redoStack = [];
    observers = [];
    addNode(node) {
        this.nodes.push(node);
        this.notify();
    }
    executeCommand(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = [];
        this.notify();
    }
    undo() {
        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo();
            this.redoStack.push(cmd);
            this.notify();
        }
    }
    redo() {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.execute();
            this.undoStack.push(cmd);
            this.notify();
        }
    }
    getContent() {
        return this.nodes.map((n) => n.render()).join("\n");
    }
    getNodes() {
        return this.nodes;
    }
    setNodes(nodes) {
        this.nodes = nodes;
    }
    subscribe(observer) {
        this.observers.push(observer);
    }
    notify() {
        this.observers.forEach((o) => o.update(this));
    }
}
//# sourceMappingURL=next-edit-test-2.js.map