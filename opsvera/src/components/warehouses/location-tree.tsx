"use client";

import { useState } from "react";
import { Location } from "@prisma/client";
import { ChevronRight, ChevronDown, MapPin } from "lucide-react";

import { LocationDialog } from "./location-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LocationNode extends Location {
  children?: LocationNode[];
}

interface LocationTreeViewProps {
  warehouseId: string;
  locations: LocationNode[];
}

export function LocationTreeView({ warehouseId, locations }: LocationTreeViewProps) {
  // Build tree from flat list if needed, or assume it's already a tree
  // Assuming the `getWarehouseLocations` returns a flat list for simplicity, let's build the tree here
  const buildTree = (flatLocations: Location[]) => {
    const map = new Map<string, LocationNode>();
    const roots: LocationNode[] = [];

    flatLocations.forEach((loc) => {
      map.set(loc.id, { ...loc, children: [] });
    });

    flatLocations.forEach((loc) => {
      const node = map.get(loc.id)!;
      if (loc.parentLocationId) {
        const parent = map.get(loc.parentLocationId);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node); // Parent not found, treat as root
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree(locations);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Locations Structure</h3>
        <LocationDialog warehouseId={warehouseId} />
      </div>

      {tree.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50 border-dashed">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">No locations defined yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Add a main zone to start structuring your warehouse.</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-card p-4">
          <ul className="space-y-2">
            {tree.map((node) => (
              <LocationTreeNode key={node.id} node={node} warehouseId={warehouseId} level={0} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface LocationTreeNodeProps {
  node: LocationNode;
  warehouseId: string;
  level: number;
}

function LocationTreeNode({ node, warehouseId, level }: LocationTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className="select-none">
      <div 
        className={cn(
          "flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors group",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <span className="w-4" /> // Spacer for alignment
          )}
          
          <MapPin className="h-4 w-4 text-primary opacity-70" />
          <span className="font-medium text-sm">{node.name}</span>
          
          {node.description && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px] ml-2 hidden md:inline-block">
              {node.description}
            </span>
          )}
          
          {!node.isActive && (
            <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5 font-normal">Inactive</Badge>
          )}
        </div>

        <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", isHovered && "opacity-100")}>
          <LocationDialog warehouseId={warehouseId} parentLocationId={node.id} />

          <LocationDialog warehouseId={warehouseId} initialData={node} />
        </div>
      </div>

      {isExpanded && hasChildren && (
        <ul className="mt-1 space-y-1">
          {node.children!.map((childNode) => (
            <LocationTreeNode key={childNode.id} node={childNode} warehouseId={warehouseId} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
