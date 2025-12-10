import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import { ArrowBigRightDash, Logs } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function SelectActionDialog() {
  return (
    <AlertDialog>
      <Button
        asChild
        variant="link"
        className="flex h-5 w-fit items-center gap-2 p-0 text-sm"
      >
        <AlertDialogTrigger>
          <Logs className="h-4 w-4" />
          Bridge options menu
        </AlertDialogTrigger>
      </Button>
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
            priority={card.priority}
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
  priority?: boolean;
}

function SelectCard(props: Readonly<SelectCardProps>) {
  return (
    <AlertDialogAction
      asChild
      className={`border px-5 py-10 ${
        props.priority
          ? "border-blue-500 bg-blue-500/20 hover:bg-blue-500/30"
          : "border-border bg-accent/20 hover:bg-accent/70"
      }`}
    >
      <Link href={props.href} className="flex w-full">
        <div className="flex h-fit w-full justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span
              className={`text-base font-bold ${
                props.priority ? "text-blue-100" : "text-white"
              }`}
            >
              {props.text}
            </span>
            <span className="text-muted-foreground text-sm">
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
    href: "/fast",
    text: "Bridge",
    description: "Direct transfers: Base ⟷ Native Torus in one flow",
    iconFrom: "/assets/icons/bridge/torus-base.svg",
    iconTo: "/assets/icons/balance/torus.svg",
    priority: true,
  },
  {
    href: "/standard?tab=torus&mode=bridge",
    text: "Torus to Torus EVM",
    description: "Transfer your balance from Torus to Torus EVM",
    iconFrom: "/assets/icons/balance/torus.svg",
    iconTo: "/assets/icons/bridge/torus-evm.svg",
  },
  {
    href: "/standard?tab=torus&mode=withdraw",
    text: "Torus EVM to Torus",
    description: "Transfer your balance from Torus EVM to Torus",
    iconFrom: "/assets/icons/bridge/torus-evm.svg",
    iconTo: "/assets/icons/balance/torus.svg",
  },
  {
    href: "/standard?tab=base&from=torus&to=base",
    text: "Torus EVM to Base",
    description: "Transfer your balance from Torus EVM to Base",
    iconFrom: "/assets/icons/bridge/torus-evm.svg",
    iconTo: "/assets/icons/bridge/torus-base.svg",
  },
  {
    href: "/standard?tab=base&from=base&to=torus",
    text: "Base to Torus EVM",
    description: "Transfer your balance from Base to Torus EVM",
    iconFrom: "/assets/icons/bridge/torus-base.svg",
    iconTo: "/assets/icons/bridge/torus-evm.svg",
  },
];
