import { appTools, defineConfig } from '@modern-js/app-tools';
import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
    tailwindcssPlugin(),
  ],
  tools: {
    devServer: {
      proxy: {
        '/ad-mission': {
          target: 'https://ad.ximalaya.com',
          changeOrigin: true,
        },
      },
    },
  },
});
