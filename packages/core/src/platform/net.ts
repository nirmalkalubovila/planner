// A minimal connectivity port. Web reads navigator.onLine; native will read
// NetInfo's cached state. Defaults to "online" so nothing in @llb/core
// falsely reports itself offline before an app registers a real check.
export interface NetStatus {
  isOnline(): boolean;
}

let impl: NetStatus = { isOnline: () => true };

export function setNetStatus(status: NetStatus): void {
  impl = status;
}

export const net: NetStatus = {
  isOnline: () => impl.isOnline(),
};
