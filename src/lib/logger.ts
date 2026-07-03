export const logger = {
  error: (context: string, ...args: unknown[]) => {
    console.error(`[${context}]`, ...args);
  },
};
