declare type Address = string;
declare type ChainName = string;
declare type ChainId = number | string;
declare type DomainId = number;

declare module "*.yaml" {
  const data: unknown;
  export default data;
}
