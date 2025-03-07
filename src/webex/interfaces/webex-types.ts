// Bot 관련 인터페이스
export interface Bot {
  say: (message: any) => Promise<any>;
  room: {
    title: string;
    id?: string;
  };
}

export interface TriggerPerson {
  displayName: string;
  email: string;
}

export interface Trigger {
  person: TriggerPerson;
  text: string;
  message: {
    text: string;
  };
}

export interface WebhookData {
  id: string;
  name: string;
  targetUrl: string;
  resource: string;
  event: string;
  orgId: string;
  createdBy: string;
  appId: string;
  ownedBy: string;
  status: string;
  created: string;
  actorId: string;
  data: {
    id: string;
    personId: string;
    roomId: string;
    roomType: string;
    personEmail: string;
    created: string;
  };
}

export interface MessageDetails {
  text: string;
  personEmail: string;
}

export interface WebexFramework {
  start: () => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  hears: (
    phrase: string | RegExp,
    callback: (bot: Bot, trigger: Trigger) => void,
    helpText?: string,
    priority?: number,
  ) => void;
}

export interface PersonDetails {
  id: string;
  emails: string[];
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  orgId?: string;
  created?: string;
}

// Command 인터페이스
export interface Command {
  pattern: string | RegExp;
  execute: (bot: Bot, trigger: Trigger) => Promise<void | string>;
  helpText: string;
  priority: number;
}

// Command 팩토리 타입
export type CommandFactory = () => Command;
