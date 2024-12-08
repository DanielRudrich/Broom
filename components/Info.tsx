import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Info as InfoIcon } from "lucide-react";

export default function Info({ content }: { content: string }) {
    return (
        <Popover>
            <PopoverTrigger>
                <InfoIcon className="w-4 min-w-4 text-muted-foreground" size={16} />
            </PopoverTrigger>
            <PopoverContent className="text-xs text-muted-foreground">{content}</PopoverContent>
        </Popover>
    );
}
