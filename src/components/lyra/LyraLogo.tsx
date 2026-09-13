import logo from "@/assets/lyra-ai-logo.png.asset.json";
import { cn } from "@/lib/utils";
export function LyraLogo({className,alt="Lyra AI"}:{className?:string;alt?:string}){return <img src={logo.url} alt={alt} className={cn("shrink-0 object-contain",className)} />;}
