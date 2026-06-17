"use client";

import { useState } from "react";
import { CustomField } from "@prisma/client";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createCustomField, updateCustomField, deleteCustomField } from "@/actions/custom-fields";
import { FieldConfigDialog } from "./field-config-dialog";
import { CreateCustomFieldInput } from "@/validations/custom-field";

interface CustomFieldBuilderProps {
  initialFields: CustomField[];
}

type ModuleName = "products" | "customers" | "suppliers";

export function CustomFieldBuilder({ initialFields }: CustomFieldBuilderProps) {
  const [fields, setFields] = useState<CustomField[]>(initialFields);
  const [activeModule, setActiveModule] = useState<ModuleName>("products");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const fieldsForModule = fields.filter((f) => f.moduleName === activeModule);

  const handleOpenCreate = () => {
    setEditingField(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (field: CustomField) => {
    setEditingField(field);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all data associated with this custom field.")) return;
    
    const res = await deleteCustomField(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Custom field deleted");
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleSaveField = async (data: CreateCustomFieldInput) => {
    if (editingField) {
      const res = await updateCustomField(editingField.id, data);
      if (res.error) {
        toast.error(res.error);
        throw new Error(res.error);
      } else {
        toast.success("Field updated successfully");
        setFields((prev) => prev.map((f) => (f.id === editingField.id ? (res.data as CustomField) : f)));
      }
    } else {
      const res = await createCustomField(data);
      if (res.error) {
        toast.error(res.error);
        throw new Error(res.error);
      } else {
        toast.success("Field created successfully");
        setFields((prev) => [...prev, res.data as CustomField]);
      }
    }
  };

  const renderTable = (moduleFields: CustomField[]) => {
    if (moduleFields.length === 0) {
      return (
        <div className="text-center p-8 border rounded-md border-dashed">
          <p className="text-muted-foreground mb-4">No custom fields defined for {activeModule}</p>
          <Button onClick={handleOpenCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add First Field
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moduleFields.map((field) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium">{field.fieldName}</TableCell>
              <TableCell className="capitalize">{field.fieldType}</TableCell>
              <TableCell>{field.isRequired ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Badge variant={field.isActive ? "default" : "secondary"}>
                  {field.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(field)}>
                  <Edit2 className="h-4 w-4 text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(field.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="col-span-1 border-t-4 border-t-primary shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dynamic Custom Fields</CardTitle>
          <CardDescription>
            Extend core entities with industry-specific data fields.
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Field
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeModule} onValueChange={(val) => setActiveModule(val as ModuleName)}>
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>
          <TabsContent value="products">{renderTable(fieldsForModule)}</TabsContent>
          <TabsContent value="customers">{renderTable(fieldsForModule)}</TabsContent>
          <TabsContent value="suppliers">{renderTable(fieldsForModule)}</TabsContent>
        </Tabs>
      </CardContent>

      <FieldConfigDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        moduleName={activeModule}
        field={editingField}
        onSave={handleSaveField}
      />
    </Card>
  );
}
