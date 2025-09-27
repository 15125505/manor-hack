declare module 'react-fitty' {
  import * as React from 'react';
  export interface ReactFittyProps extends React.HTMLAttributes<HTMLDivElement> {
    minSize?: number;
    maxSize?: number;
    mode?: 'multi' | 'single';
    children?: React.ReactNode;
  }
  export const ReactFitty: React.FC<ReactFittyProps>;
  export default ReactFitty;
} 