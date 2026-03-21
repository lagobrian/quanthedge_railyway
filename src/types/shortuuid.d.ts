declare module 'shortuuid' {
  const shortuuid: {
    uuid(): string;
    generate(): string;
    decode(str: string): string;
    encode(str: string): string;
  };
  export = shortuuid;
}
