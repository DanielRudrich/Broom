import Image from "next/image";

import logo from "@/images/logo.svg";
import CreateSweep from "@/components/CreateSweep";
import ProcessSweepResponse from "@/components/ProcessSweepResponse";
import { SweepCodeProvider } from "@/lib/context/SweepCodeContext";
import { ImpulseResponseProvider } from "@/lib/context/ImpulseResponseContext";
import ImpulseResponseEditor from "@/components/ImpulseResponseEditor";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center gap-8 bg-gray-800 p-8">
            <Image src={logo} alt="Broom logo" width={320} />
            <div className="font-mono">Sweep the room!</div>
            <SweepCodeProvider>
                <ImpulseResponseProvider>
                    <div className="flex w-full flex-col gap-4">
                        <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:items-start">
                            <CreateSweep />
                            <ProcessSweepResponse />
                        </div>
                        <ImpulseResponseEditor />
                    </div>
                </ImpulseResponseProvider>
            </SweepCodeProvider>
        </main>
    );
}
