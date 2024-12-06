"use client";

import React, { createContext, useContext, useState } from "react";

const ImpulseResponseContext = createContext<{
    impulseResponse: AudioBuffer | undefined;
    setImpulseResponse: (buffer: AudioBuffer | undefined) => void;
}>({
    impulseResponse: undefined,
    setImpulseResponse: () => {},
});

export const ImpulseResponseProvider = ({ children }: { children: React.ReactNode }) => {
    const [impulseResponse, setImpulseResponse] = useState<AudioBuffer | undefined>(undefined);
    return (
        <ImpulseResponseContext.Provider value={{ impulseResponse, setImpulseResponse }}>
            {children}
        </ImpulseResponseContext.Provider>
    );
};

export const useImpulseResponseContext = () => useContext(ImpulseResponseContext);
