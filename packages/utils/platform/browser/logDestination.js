export function logDestination() { return undefined }

logDestination.localEnv = function localEnv(key) {
    if (!self.localStorage) {
      if (self.ENV) return self.ENV[key];
      return undefined;
    }
    return localStorage.getItem(`ENV:${key}`)
  }
  