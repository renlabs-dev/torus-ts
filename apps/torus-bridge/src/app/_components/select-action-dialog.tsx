import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@torus-ts/ui";
import Link from "next/link";
import Image from "next/image";
import { ArrowBigRightDash } from "lucide-react";

export function SelectActionDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select your desired Action:</AlertDialogTitle>
        </AlertDialogHeader>
        {SelectCardList.map((card) => (
          <SelectCard
            key={card.href}
            href={card.href}
            text={card.text}
            description={card.description}
            iconFrom={card.iconFrom}
            iconTo={card.iconTo}
          />
        ))}
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface SelectCardProps {
  href: string;
  text: string;
  description: string;
  iconFrom: string;
  iconTo: string;
}

export function SelectCard(props: SelectCardProps) {
  return (
    <AlertDialogAction
      asChild
      className="border border-border bg-accent/20 px-5 py-10 hover:bg-accent/70"
    >
      <Link href={props.href} className="flex w-full">
        <div className="flex h-fit w-full justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-base font-bold text-white">{props.text}</span>
            <span className="text-sm text-muted-foreground">
              {props.description}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Image src={props.iconFrom} alt="Icon" width={28} height={28} />
            <ArrowBigRightDash className="!h-7 !w-7 text-white" />
            <Image src={props.iconTo} alt="Icon" width={28} height={28} />
          </div>
        </div>
      </Link>
    </AlertDialogAction>
  );
}

const SelectCardList = [
  {
    href: "/?tab=torus&mode=bridge",
    text: "Torus to Torus EVM",
    description: "Transfer your balance from Torus to Torus EVM",
    iconFrom: "torus-balance-icon.svg",
    iconTo: "torus-evm-balance-icon.svg",
  },
  {
    href: "/?tab=torus&mode=withdraw",
    text: "Torus EVM to Torus",
    description: "Transfer your balance from Torus EVM to Torus",
    iconFrom: "torus-evm-balance-icon.svg",
    iconTo: "torus-balance-icon.svg",
  },
  {
    href: "/?tab=base&from=torustestnet&to=basesepolia",
    text: "Torus EVM to Base",
    description: "Transfer your balance from Torus EVM to Base",
    iconFrom: "torus-evm-balance-icon.svg",
    iconTo: "torus-base-balance-icon.svg",
  },
  {
    href: "/?tab=base&from=basesepolia&to=torustestnet",
    text: "Base to Torus EVM",
    description: "Transfer your balance from Base to Torus EVM",
    iconFrom: "torus-base-balance-icon.svg",
    iconTo: "torus-evm-balance-icon.svg",
  },
];
