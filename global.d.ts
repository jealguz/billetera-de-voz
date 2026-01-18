declare global {
  interface Window {
    process?: {
      env: {
        NODE_ENV: string;
        PUBLIC_URL: string;
      };
      cwd: () => string;
      version: string;
      versions: Record<string, string>;
      platform: string;
      nextTick: (fn: Function) => void;
    };
  }
}

export {};