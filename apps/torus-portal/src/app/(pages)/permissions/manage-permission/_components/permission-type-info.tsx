import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { AlertCircle, Info } from "lucide-react";

interface PermissionTypeInfoProps {
  permissionType: "stream" | "capability" | "unknown";
  canEdit?: boolean;
  isGrantor?: boolean;
  userRole?: string | null; // Primary role badge from getPrimaryRoleBadge
}

export function PermissionTypeInfo({
  permissionType,
  isGrantor = true,
  userRole = null,
}: PermissionTypeInfoProps) {
  if (permissionType === "capability") {
    return (
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="text-warning flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Capability Permission
          </CardTitle>
          <CardDescription className="break-words">
            Capability permissions can only be revoked. Edit functionality is
            not available for capability permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permissionType === "stream" && !isGrantor) {
    const getRoleInfo = () => {
      switch (userRole) {
        case "Recipient Manager":
          return {
            title: "Recipient Manager Access",
            description:
              "You can add/remove recipients and modify their weights. Other fields are read-only.",
          };
        case "Weight Setter":
          return {
            title: "Weight Setter Access",
            description:
              "You can modify recipient weights but cannot add/remove recipients. Other fields are read-only.",
          };
        case "Recipient":
          return {
            title: "Recipient View",
            description:
              "You are a recipient of this permission. All fields are read-only for you.",
          };
        case "Enforcement Controller":
          return {
            title: "Enforcement Controller",
            description:
              "You can enforce this permission. Permission details are read-only.",
          };
        case "Revocation Arbiter":
          return {
            title: "Revocation Arbiter",
            description:
              "You can revoke this permission. Permission details are read-only.",
          };
        default:
          return {
            title: "Read-Only Permission",
            description:
              "Only the delegator can edit this permission. You can view but not modify the permission details.",
          };
      }
    };

    const roleInfo = getRoleInfo();

    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center gap-2">
            <Info className="h-5 w-5" />
            {roleInfo.title}
          </CardTitle>
          <CardDescription className="break-words">
            {roleInfo.description}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permissionType === "unknown") {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center gap-2">
            <Info className="h-5 w-5" />
            No Permission Selected
          </CardTitle>
          <CardDescription className="break-words">
            Select a permission above to view and modify its details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return null;
}
