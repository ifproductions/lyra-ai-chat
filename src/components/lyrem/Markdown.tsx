import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatImage } from "./ChatImage";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="lyrem-md text-[15px] text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
          img: ({ src, alt }) => {
            if (typeof src !== "string") return null;
            return <ChatImage src={src} alt={alt} />;
          },
          p: ({ children }) => <div className="lyrem-p">{children}</div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
