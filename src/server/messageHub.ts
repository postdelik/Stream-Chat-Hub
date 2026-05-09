import type { ChatMessage } from "../shared/types";

type MessageListener = (message: ChatMessage) => void;

export class MessageHub {
  private messages: ChatMessage[] = [];
  private listeners = new Set<MessageListener>();

  addMessage(message: ChatMessage) {
    this.messages.push(message);

    if (this.messages.length > 200) {
      this.messages = this.messages.slice(-200);
    }

    for (const listener of this.listeners) {
      listener(message);
    }
  }

  getRecentMessages() {
    return this.messages.slice(-100);
  }

  clearMessages() {
    this.messages = [];
  }

  onMessage(listener: MessageListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}