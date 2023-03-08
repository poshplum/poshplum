import React from "react";

export function CodeExample({ language = "jsx", children }) {
    return (
        <pre className="code" data-lang={language}>
            <code>{children}</code>
        </pre>
    );
}
