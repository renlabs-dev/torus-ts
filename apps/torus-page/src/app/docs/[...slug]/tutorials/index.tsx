// Getting Started
import BalanceOperations from "./balance-operations.mdx";
// Concepts
import Basics from "./basics.mdx";
import BuildingSubnet from "./building-a-subnet.mdx";
import CreateMiner from "./create-miner.mdx";
import CreateValidator from "./create-validator.mdx";
import DeployingSubnet from "./deploying-a-subnet.mdx";
import GeneralSubnetDao from "./general-subnet-dao.mdx";
import GeneralSubnet from "./general-subnet.mdx";
import GlobalParameters from "./global-parameters.mdx";
import Governance from "./governance.mdx";
import Intro from "./intro.mdx";
// Working with Keys
import KeyBasics from "./key-basics.mdx";
import ModuleConnect from "./module-connect.mdx";
import ModuleRegister from "./module-register.mdx";
import ParticipatingOnSubnet from "./participating-on-a-subnet.mdx";
import RunMiner from "./run-miner.mdx";
import RunValidator from "./run-validator.mdx";
import RunningLocalNode from "./running-local-node.mdx";
import RunningPrivateChain from "./running-private-chain.mdx";
// Installation
import SetupTorus from "./setup-torus.mdx";
import SetupWallet from "./setup-wallet.mdx";
import SubnetList from "./subnet-list.mdx";
import SubnetParameters from "./subnet-parameters.mdx";
import SubnetTemplate from "./subnet-template.mdx";
import Testnet from "./testnet.mdx";
// Subspace
import TorusBlockchain from "./torus-blockchain.mdx";
import WeightSystem from "./weight-system.mdx";
// Modules
import WhatIsModule from "./what-is-a-module.mdx";
// Subnets
import WhatIsSubnet from "./what-is-a-subnet.mdx";
// Mining
import WhatIsMining from "./what-is-mining.mdx";
// Validating
import WhatIsValidating from "./what-is-validating.mdx";
import YumaConsensus from "./yuma-consensus.mdx";
import YumaSubnets from "./yuma-subnets.mdx";

const gettingStartedSection = [
  {
    component: <Intro />,
    href: `intro`,
    name: "Introduction",
  },
];

const conceptsSection = [
  {
    component: <Basics />,
    href: `basics`,
    name: "Basics",
  },
  {
    component: <WeightSystem />,
    href: `weight-system`,
    name: "Weight System",
  },
  {
    component: <Governance />,
    href: `governance`,
    name: "Governance",
  },
];

const installationSection = [
  {
    component: <SetupTorus />,
    href: `setup-torus`,
    name: "Setup torus",
  },
  {
    component: <SetupWallet />,
    href: `setup-wallet`,
    name: "Setup Wallet",
  },
];

const modulesSection = [
  {
    component: <WhatIsModule />,
    href: `what-is-a-module`,
    name: "What is a Module",
  },

  {
    component: <ModuleRegister />,
    href: `module-register`,
    name: "Register a Module",
  },
  {
    component: <ModuleConnect />,
    href: `module-connect`,
    name: "Connect to a Module",
  },
];

const subnetsSection = [
  {
    component: <WhatIsSubnet />,
    href: `what-is-a-subnet`,
    name: "What is a subnet",
  },
  {
    component: <ParticipatingOnSubnet />,
    href: `participating-on-a-subnet`,
    name: "Participating on a Subnet",
  },
  {
    component: <BuildingSubnet />,
    href: `building-a-subnet`,
    name: "Building a Subnet",
  },
  {
    component: <SubnetTemplate />,
    href: `subnet-template`,
    name: "Subnet Template",
  },
  {
    component: <DeployingSubnet />,
    href: `deploying-a-subnet`,
    name: "Deploying a Subnet",
  },
  {
    component: <SubnetParameters />,
    href: `subnet-parameters`,
    name: "Subnet Parameters",
  },
  {
    component: <GeneralSubnet />,
    href: `general-subnet`,
    name: "General Subnet",
  },
  {
    component: <GeneralSubnetDao />,
    href: `general-subnet-dao`,
    name: "General Subnet DAO",
  },
  {
    component: <YumaSubnets />,
    href: `yuma-subnets`,
    name: "Yuma Subnets",
  },
  {
    component: <SubnetList />,
    href: `subnet-list`,
    name: "Subnet List",
  },
];

const workingWithKeysSection = [
  {
    component: <KeyBasics />,
    href: `key-basics`,
    name: "Key Basics",
  },
  {
    component: <BalanceOperations />,
    href: `balance-operations`,
    name: "Balance Operations",
  },
];

const miningSection = [
  {
    component: <WhatIsMining />,
    href: `what-is-mining`,
    name: "What is mining",
  },
  {
    component: <CreateMiner />,
    href: `create-miner`,
    name: "Create a miner",
  },
  {
    component: <RunMiner />,
    href: `run-miner`,
    name: "Run a miner",
  },
];

const validatingSection = [
  {
    component: <WhatIsValidating />,
    href: `what-is-validating`,
    name: "What is validating",
  },
  {
    component: <CreateValidator />,
    href: `create-validator`,
    name: "Create a validator",
  },
  {
    component: <RunValidator />,
    href: `run-validator`,
    name: "Run a validator",
  },
];

// const subnetsSection = [
//   {
//     component: <SubnetBasics />,
//     href: `subnet-basics`,
//     name: 'Subnet Basics',
//   },
//   {
//     component: <CreateSubnet />,
//     href: `create-subnet`,
//     name: 'Create a subnet',
//   },
//   {
//     component: <DeploySubnet />,
//     href: `deploy-subnet`,
//     name: 'Deploy a subnet',
//   },
//   {
//     component: <SubnetList />,
//     href: `subnet-list`,
//     name: 'Subnet List',
//   },
//   {
//     component: <StakeThresholdCalcualtion />,
//     href: `subnet-threshold-calculation`,
//     name: 'Stake threshold calcualtion',
//   },
//   {
//     component: <GeneralNetwork />,
//     href: `general-network`,
//     name: 'General Network',
//   },
//   {
//     component: <GeneralNetworkGovernance />,
//     href: `general-network-governance`,
//     name: 'General network governance',
//   },
//   {
//     component: <SubnetParameters />,
//     href: `subnet-parameters`,
//     name: 'Subnet parameters',
//   },
// ]

const subspaceSection = [
  {
    component: <TorusBlockchain />,
    href: `torus-blockchain`,
    name: "torus Blockchain",
  },
  {
    component: <GlobalParameters />,
    href: `global-parameters`,
    name: "Global Parameters",
  },
  {
    component: <YumaConsensus />,
    href: `yuma-consensus`,
    name: "Yuma Consensus",
  },
  {
    component: <Testnet />,
    href: `testnet`,
    name: "Testnet",
  },
  {
    component: <RunningLocalNode />,
    href: `running-local-node`,
    name: "Running a Local Node",
  },
  {
    component: <RunningPrivateChain />,
    href: `running-private-chain`,
    name: "Running a Private Chain",
  },
];

export interface Tutorial {
  contents: { component: JSX.Element; href: string; name: string }[];
  title: string;
  tutorialId: string;
}

export const tutorials: Tutorial[] = [
  {
    contents: gettingStartedSection,
    title: "Getting Started",
    tutorialId: "getting-started",
  },
  {
    contents: conceptsSection,
    title: "Concepts",
    tutorialId: "concepts",
  },
  {
    contents: installationSection,
    title: "Installation",
    tutorialId: "installation",
  },
  {
    contents: modulesSection,
    title: "Modules",
    tutorialId: "modules",
  },
  {
    contents: subnetsSection,
    title: "Subnets",
    tutorialId: "subnets",
  },
  {
    contents: workingWithKeysSection,
    title: "Working with Keys",
    tutorialId: "working-with-keys",
  },
  {
    contents: miningSection,
    title: "Mining",
    tutorialId: "mining",
  },
  {
    contents: validatingSection,
    title: "Validating",
    tutorialId: "validating",
  },
  // {
  //   contents: subnetsSection,
  //   title: 'Subnets',
  //   tutorialId: 'subnets',
  // },
  {
    contents: subspaceSection,
    title: "Subspace",
    tutorialId: "subspace",
  },
];
