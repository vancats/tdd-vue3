import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default {
  input: './packages/index.ts',
  output: [
    {
      format: 'es',
      file: pkg.module,
    },
    {
      format: 'cjs',
      file: pkg.main,
    },
  ],
  plugins: [typescript()],
}
