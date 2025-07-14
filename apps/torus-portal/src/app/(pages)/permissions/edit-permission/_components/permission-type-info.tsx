import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@torus-ts/ui/components/card";
import { AlertCircle, Info, Lock } from "lucide-react";

interface PermissionTypeInfoProps {
  permissionType: "emission" | "capability" | "unknown";
  canEdit?: boolean;
  isGrantor?: boolean;
}

export function PermissionTypeInfo({ 
  permissionType, 
  canEdit = true,
  isGrantor = true 
}: PermissionTypeInfoProps) {
  if (permissionType === "capability") {
    return (
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Capability Permission
          </CardTitle>
          <CardDescription>
            Capability permissions can only be revoked. Edit functionality is not available for capability permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (permissionType === "emission" && !isGrantor) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5" />
            Read-Only Permission
          </CardTitle>
          <CardDescription>
            Only the delegator can edit this permission. As a recipient, you can view but not modify the permission details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permissionType === "unknown") {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-5 w-5" />
            No Permission Selected
          </CardTitle>
          <CardDescription>
            Select a permission above to view and modify its details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return null;
}