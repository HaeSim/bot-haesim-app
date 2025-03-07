export interface Bot {
  say: (message: any) => Promise<any>;
  room: {
    title: string;
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
