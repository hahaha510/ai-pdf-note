"use client";
import React, { createContext, useContext } from "react";

const EditorContext = createContext();

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
};

export const EditorProvider = ({ children, editor, setEditor }) => {
  return <EditorContext.Provider value={{ editor, setEditor }}>{children}</EditorContext.Provider>;
};
