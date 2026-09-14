import logo from "@/assets/lyrem-ai-logo.png.asset.json";
import { cn } from "@/lib/utils";
export function LyremLogo({className,alt="Lyrem AI"}:{className?:string;alt?:string}){return <img src={logo.url} alt={alt} className={cn("shrink-0 object-contain",className)} />;}
