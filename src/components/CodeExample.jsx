import React from "react";

function CodeExample({language="jsx", children}) {
  return <pre className="code" data-lang={language}>
    <code>{children}</code>
  </pre>
}
export default CodeExample;
