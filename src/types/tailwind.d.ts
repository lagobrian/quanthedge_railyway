// tailwind.d.ts
import 'tailwindcss/tailwind.css';

declare module 'tailwindcss/tailwind.css' {
  export interface TailwindConfig {
    content: string[];
    theme: {
      extend: {
        colors: {
          blue: {
            DEFAULT: string;
            light: string;
            dark: string;
          };
          background: string;
          foreground: string;
        };
      };
    };
  }
}
