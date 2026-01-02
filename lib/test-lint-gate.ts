// Test file to verify lint gate catches errors
export const testFunction = () => {
  const unusedVar = "this should trigger a warning"
  const x: any = "this should trigger an error but is in allowlist"
  return "test"
}
