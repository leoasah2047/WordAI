export const readFile = async () => new Uint8Array()
export const writeFile = async () => {
  /* noop */
}
export const unlink = async () => {
  /* noop */
}
export const readdir = async () => []
export const stat = async () => ({})
export default {
  readFile,
  writeFile,
  unlink,
  readdir,
  stat,
}
