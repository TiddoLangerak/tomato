export function run<T>(f: () => T): { val? : T, error?: any } {
  try {
    const val = f();
    return {val};
  } catch (error) {
    return {error};
  }
}

