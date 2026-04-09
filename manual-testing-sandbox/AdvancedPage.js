"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const AdvancedPage = () => {
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(false);
    const [counter, setCounter] = (0, react_1.useState)(0);
    const toggleDarkMode = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };
    return (<div className={`${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"} min-h-screen p-4`}>
      <header className="mb-4 flex items-center justify-between border-b-2 pb-4">
        {" "}
        <button className="rounded bg-blue-500 px-4 py-2 text-white" onClick={toggleDarkMode}>
          Toggle Dark Mode
        </button>
      </header>

      <main className="flex flex-col items-center">
        <div className="mb-4">
          <p className="text-xl">
            Counter: <span className="font-bold">{counter}</span>
          </p>

          <button className="mt-2 rounded bg-green-500 px-4 py-2 text-white" onClick={() => setCounter(counter + 1)}>
            Increment
          </button>
        </div>

        <div>
          <p className="mb-2">Some other interactive elements:</p>
          <input type="text" placeholder="Type something here..." className="mb-2 rounded border p-2"/>
          <div>
            <select className="rounded border p-2">
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
          </div>
        </div>
      </main>

      <footer className="mt-4 border-t-2 pt-4">
        <p className="text-center">
          &copy; 2023 Advanced Page. All rights reserved.
        </p>
      </footer>
    </div>);
};
exports.default = AdvancedPage;
//# sourceMappingURL=AdvancedPage.js.map