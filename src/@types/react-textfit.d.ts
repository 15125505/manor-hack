declare module 'react-textfit' {
  import * as React from 'react';
  export interface TextfitProps {
    mode?: 'single' | 'multi';
    min?: number;
    max?: number;
    forceSingleModeWidth?: boolean;
    throttle?: number;
    onReady?: (fontSize: number) => void;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }
  export class Textfit extends React.Component<TextfitProps> {}
} 