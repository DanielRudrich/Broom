import Image from "next/image";

import logo from "@/images/logo.svg";
import CreateSweep from "@/components/CreateSweep";
import ProcessSweepResponse from "@/components/ProcessSweepResponse";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-800 p-4">
            <Image src={logo} alt="Broom logo" width={320} />
            <div className="font-mono">Sweep the room!</div>
            <CreateSweep />
            <ProcessSweepResponse />
        </main>
    );
}
