import { useEffect, useState } from "react";
import { type Message, initialMessages, ChatMessage } from "./chat-message";
import { useCookies } from "react-cookie";
import * as docx from "docx";
import { saveAs } from "file-saver";
const COOKIE_NAME = "next-openai-chatgpt";
const { Document, Paragraph } = docx;
const PreLoader = () => (
  <div className="prompt left">
    <p className="name">AI</p>
    <div className="loader">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
);




const InputMessage = ({ input, setInput, sendMessage }: any) => (
  <div className="question">
    <input
      type="text"
      aria-label="chat input"
      required
      value={input}
      placeholder="Type a message to start the conversation"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendMessage(input);
          setInput("");
        }
      }}
      onChange={(e) => {
        setInput(e.target.value);
      }}
    />
    <button
      type="submit"
      onClick={() => {
        sendMessage(input);
        setInput("");
      }}
    >
      Ask
    </button>
  </div>
);




export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookie, setCookie] = useCookies([COOKIE_NAME]);

  useEffect(() => {
    if (!cookie[COOKIE_NAME]) {
      const randomId = Math.random().toString(36).substring(7);
      setCookie(COOKIE_NAME, randomId);
    }
  }, [cookie, setCookie]);

  const sendMessage = async (message: string) => {
    setLoading(true);

    const newMessages = [
      ...messages,
      { message: message, who: "user" } as Message,
    ];
    setMessages(newMessages);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        user: cookie[COOKIE_NAME],
      }),
    });

    const data = await response.json();

    setMessages([
      ...newMessages,
      { message: data.text.trim(), who: "bot" } as Message,
    ]);

    setLoading(false);
  };
  
  const exportToDoc = async () => {
    const sections: { children: docx.Paragraph[]; }[] = [];
    let chatText = "";
    messages.forEach(({ message, who }) => {
      const chatText = new docx.TextRun(`${who}: ${message}\n`)
      // chatText += `${who}: ${message}\n`;
      
    });
    sections.push({ children: [new docx.Paragraph(chatText)] });
    const doc = new docx.Document({
      sections: sections
    });
    const fileName = "chat.docx";
    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, fileName);
  };

    const clearChat = () =>{
      setMessages([]);
    };
 
  

  return (
    <div className="dialogue">
      {messages.map(({ message, who }, index) => (
        <ChatMessage key={index} who={who} message={message} />
      ))}

      {loading && <PreLoader />}

      <InputMessage
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
      />
      <button onClick={clearChat}>Clear Chat</button>
      <button onClick={exportToDoc}>Export Chat</button>
    </div>
  );
}

