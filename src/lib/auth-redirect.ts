let loggingOut = false;

export function setLoggingOut(value: boolean): void {
  loggingOut = value;
}

export function isLoggingOut(): boolean {
  return loggingOut;
}
