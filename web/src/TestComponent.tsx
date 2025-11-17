import React from "react";
import { createRoot } from "react-dom/client";

const TestComponent: React.FC = () => {
  return <div>TestComponent is working.</div>;
};

createRoot(document.getElementById("test-component-root")).render(
  <TestComponent />
);
