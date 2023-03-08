import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import remarkObsidian from 'remark-obsidian';

export const MD = ({ children, ...moProps }) => {
    return (
        <ReactMarkdown
            {...{
                children,
                remarkPlugins: [remarkGfm],
                ...moProps,
            }}
        />
    );
};
