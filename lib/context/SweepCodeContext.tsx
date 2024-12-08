"use client";

import React, { createContext, useContext, useState } from "react";

const SweepCodeContext = createContext<{
    sweepCode: string;
    setSweepCode: (sweepCode: string) => void;
}>({
    sweepCode: "",
    setSweepCode: () => {},
});

export const SweepCodeProvider = ({ children }: { children: React.ReactNode }) => {
    const [sweepCode, setSweepCode] = useState("");
    return (
        <SweepCodeContext.Provider value={{ sweepCode, setSweepCode }}>{children}</SweepCodeContext.Provider>
    );
};

export const useSweepCodeContext = () => useContext(SweepCodeContext);
