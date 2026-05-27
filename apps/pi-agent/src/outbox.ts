import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AgentMessage } from "@homemonitor/types";

export type QueuedAgentMessage = Exclude<AgentMessage, { type: "hello" }>;

interface OutboxState {
  messages: QueuedAgentMessage[];
}

export class FileOutbox {
  private state: OutboxState = { messages: [] };
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  static at(dataDir: string): FileOutbox {
    return new FileOutbox(join(dataDir, "outbox.json"));
  }

  async open(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw) as OutboxState;
    } catch {
      this.state = { messages: [] };
      await this.persist();
    }
  }

  list(): QueuedAgentMessage[] {
    return [...this.state.messages];
  }

  async enqueue(message: QueuedAgentMessage): Promise<void> {
    if (!this.state.messages.some((item) => item.sequence === message.sequence)) {
      this.state.messages.push(message);
      await this.persist();
    }
  }

  async ack(sequence: number): Promise<void> {
    const next = this.state.messages.filter((message) => message.sequence !== sequence);
    if (next.length !== this.state.messages.length) {
      this.state.messages = next;
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    const snapshot = JSON.stringify(this.state, null, 2);
    this.writeChain = this.writeChain.then(async () => {
      const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmpPath, snapshot);
      await rename(tmpPath, this.filePath);
    });
    await this.writeChain;
  }
}
