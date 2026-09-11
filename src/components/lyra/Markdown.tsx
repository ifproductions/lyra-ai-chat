import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatImage } from "./ChatImage";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="lyra-md text-[15px] text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
          img: ({ src, alt }) =>
            typeof src === "string" ? <ChatImage src={src} alt={alt} /> : null,
          p: ({ children }) => <div className="lyra-p">{children}</div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
