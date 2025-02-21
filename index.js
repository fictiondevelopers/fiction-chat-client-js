import FictionChatClient from "./src/components/FictionChatClient";
import { createConversation } from "./src/useFictionChat";
import "./src/styles/index.css";

const Fiction = {
  FictionChatClient,
  createConversation,
};

export { FictionChatClient, createConversation };
export default Fiction;
