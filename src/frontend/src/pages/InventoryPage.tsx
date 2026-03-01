import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Download,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Ingredient } from "../backend.d";
import {
  useAddIngredient,
  useDeleteIngredient,
  useIngredients,
  useTotalInventoryValue,
  useUpdateIngredient,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IngredientForm {
  name: string;
  quantity: string;
  unit: string;
  cost_price: string;
  supplier: string;
  low_stock_threshold: string;
}

const emptyForm: IngredientForm = {
  name: "",
  quantity: "",
  unit: "grams",
  cost_price: "",
  supplier: "",
  low_stock_threshold: "",
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportToCSV(ingredients: Ingredient[]) {
  const headers = [
    "Name",
    "Quantity",
    "Unit",
    "Cost Price (₹)",
    "Supplier",
    "Low Stock Threshold",
    "Total Value (₹)",
  ];
  const rows = ingredients.map((i) => [
    i.name,
    i.quantity,
    i.unit,
    i.cost_price.toFixed(2),
    i.supplier,
    i.low_stock_threshold,
    (i.quantity * i.cost_price).toFixed(2),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `salad-khatora-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Form Validation ─────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof IngredientForm, string>>;

function validateForm(form: IngredientForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (
    !form.quantity ||
    Number.isNaN(Number(form.quantity)) ||
    Number(form.quantity) < 0
  )
    errors.quantity = "Valid quantity required";
  if (
    !form.cost_price ||
    Number.isNaN(Number(form.cost_price)) ||
    Number(form.cost_price) < 0
  )
    errors.cost_price = "Valid cost price required";
  if (!form.supplier.trim()) errors.supplier = "Supplier is required";
  if (
    !form.low_stock_threshold ||
    Number.isNaN(Number(form.low_stock_threshold)) ||
    Number(form.low_stock_threshold) < 0
  )
    errors.low_stock_threshold = "Valid threshold required";
  return errors;
}

// ─── Ingredient Modal ─────────────────────────────────────────────────────────

interface IngredientModalProps {
  open: boolean;
  onClose: () => void;
  editTarget: Ingredient | null;
}

function IngredientModal({ open, onClose, editTarget }: IngredientModalProps) {
  const addMutation = useAddIngredient();
  const updateMutation = useUpdateIngredient();

  const [form, setForm] = useState<IngredientForm>(
    editTarget
      ? {
          name: editTarget.name,
          quantity: String(editTarget.quantity),
          unit: editTarget.unit,
          cost_price: String(editTarget.cost_price),
          supplier: editTarget.supplier,
          low_stock_threshold: String(editTarget.low_stock_threshold),
        }
      : emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const isPending = addMutation.isPending || updateMutation.isPending;

  const setField = (key: keyof IngredientForm, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const totalValue = Number(form.quantity) * Number(form.cost_price);
  const showTotalPreview =
    !Number.isNaN(totalValue) &&
    Number(form.quantity) > 0 &&
    Number(form.cost_price) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      cost_price: Number(form.cost_price),
      supplier: form.supplier.trim(),
      threshold: Number(form.low_stock_threshold),
    };

    if (editTarget) {
      updateMutation.mutate(
        { ...payload, id: editTarget.id },
        {
          onSuccess: () => {
            toast.success(`"${payload.name}" updated successfully`);
            onClose();
          },
          onError: () => toast.error("Failed to update ingredient"),
        },
      );
    } else {
      addMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`"${payload.name}" added to inventory`);
          onClose();
        },
        onError: () => toast.error("Failed to add ingredient"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {editTarget ? "Edit Ingredient" : "Add New Ingredient"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {editTarget
              ? "Update ingredient details below."
              : "Fill in the details to add a new ingredient."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="ing-name">
                Ingredient Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ing-name"
                placeholder="e.g. Lettuce"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name}</p>
              )}
            </div>

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ing-qty">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ing-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  className={errors.quantity ? "border-destructive" : ""}
                  disabled={isPending}
                />
                {errors.quantity && (
                  <p className="text-destructive text-xs">{errors.quantity}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ing-unit">Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setField("unit", v)}
                  disabled={isPending}
                >
                  <SelectTrigger id="ing-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">grams</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="liters">liters</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pieces">pieces</SelectItem>
                    <SelectItem value="packets">packets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Price */}
            <div className="space-y-1.5">
              <Label htmlFor="ing-price">
                Cost Price per Unit (₹){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₹
                </span>
                <Input
                  id="ing-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost_price}
                  onChange={(e) => setField("cost_price", e.target.value)}
                  className={cn(
                    "pl-7",
                    errors.cost_price ? "border-destructive" : "",
                  )}
                  disabled={isPending}
                />
              </div>
              {errors.cost_price && (
                <p className="text-destructive text-xs">{errors.cost_price}</p>
              )}
            </div>

            {/* Supplier */}
            <div className="space-y-1.5">
              <Label htmlFor="ing-supplier">
                Supplier Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ing-supplier"
                placeholder="e.g. Fresh Farms Ltd."
                value={form.supplier}
                onChange={(e) => setField("supplier", e.target.value)}
                className={errors.supplier ? "border-destructive" : ""}
                disabled={isPending}
              />
              {errors.supplier && (
                <p className="text-destructive text-xs">{errors.supplier}</p>
              )}
            </div>

            {/* Threshold */}
            <div className="space-y-1.5">
              <Label htmlFor="ing-threshold">
                Low Stock Threshold <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ing-threshold"
                type="number"
                min="0"
                placeholder="Alert when below this quantity"
                value={form.low_stock_threshold}
                onChange={(e) =>
                  setField("low_stock_threshold", e.target.value)
                }
                className={
                  errors.low_stock_threshold ? "border-destructive" : ""
                }
                disabled={isPending}
              />
              {errors.low_stock_threshold && (
                <p className="text-destructive text-xs">
                  {errors.low_stock_threshold}
                </p>
              )}
            </div>

            {/* Total value preview */}
            {showTotalPreview && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Total Inventory Value Preview
                </p>
                <p className="text-base font-semibold text-primary font-display">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : editTarget ? (
                "Update Ingredient"
              ) : (
                "Add Ingredient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteDialogProps {
  ingredient: Ingredient | null;
  onClose: () => void;
}

function DeleteDialog({ ingredient, onClose }: DeleteDialogProps) {
  const deleteMutation = useDeleteIngredient();

  const handleDelete = () => {
    if (!ingredient) return;
    deleteMutation.mutate(ingredient.id, {
      onSuccess: () => {
        toast.success(`"${ingredient.name}" deleted`);
        onClose();
      },
      onError: () => toast.error("Failed to delete ingredient"),
    });
  };

  return (
    <Dialog open={!!ingredient} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Delete Ingredient
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{ingredient?.name}"
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} className="mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function InventoryPage() {
  const { data: ingredients, isLoading } = useIngredients();
  const { data: totalValue } = useTotalInventoryValue();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered =
    ingredients?.filter(
      (i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.supplier.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditTarget(ingredient);
    setModalOpen(true);
  };

  const isLowStock = (i: Ingredient) => i.quantity <= i.low_stock_threshold;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-1">
            <Package size={14} />
            Total Value:{" "}
            {totalValue !== undefined ? formatCurrency(totalValue) : "—"}
          </div>
          <p className="text-sm text-muted-foreground">
            {ingredients?.length ?? 0} ingredient
            {(ingredients?.length ?? 0) !== 1 ? "s" : ""} in inventory
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => ingredients && exportToCSV(ingredients)}
            disabled={!ingredients?.length}
            className="gap-1.5"
          >
            <Download size={14} />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90 gap-1.5"
          >
            <Plus size={15} />
            Add Ingredient
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Quantity
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Cost Price
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Supplier
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Threshold
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Total Value
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                ["sk-r1", "sk-r2", "sk-r3", "sk-r4", "sk-r5", "sk-r6"].map(
                  (rk) => (
                    <TableRow key={rk}>
                      {["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"].map(
                        (ck) => (
                          <TableCell key={ck}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  ),
                )
              ) : !filtered.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package
                        size={32}
                        className="text-muted-foreground opacity-30"
                      />
                      <p className="text-sm font-medium text-foreground">
                        {searchQuery
                          ? "No results found"
                          : "No ingredients yet"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery
                          ? "Try a different search term"
                          : 'Click "Add Ingredient" to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ingredient) => {
                  const low = isLowStock(ingredient);
                  const critical =
                    ingredient.quantity <= ingredient.low_stock_threshold * 0.5;
                  return (
                    <TableRow
                      key={Number(ingredient.id)}
                      className={cn(
                        "transition-colors",
                        critical
                          ? "bg-destructive/3 hover:bg-destructive/5"
                          : low
                            ? "bg-warning/3 hover:bg-warning/5"
                            : "hover:bg-accent/30",
                      )}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {low && (
                            <AlertTriangle
                              size={13}
                              className={
                                critical
                                  ? "text-destructive"
                                  : "text-warning flex-shrink-0"
                              }
                            />
                          )}
                          <span className="truncate max-w-[140px]">
                            {ingredient.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {ingredient.quantity}{" "}
                        <span className="text-muted-foreground text-xs">
                          {ingredient.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {formatCurrency(ingredient.cost_price)}
                        <span className="text-muted-foreground text-xs">
                          /{ingredient.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[140px]">
                        <span className="truncate block">
                          {ingredient.supplier}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {ingredient.low_stock_threshold} {ingredient.unit}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums font-medium text-primary">
                        {formatCurrency(
                          ingredient.quantity * ingredient.cost_price,
                        )}
                      </TableCell>
                      <TableCell>
                        {critical ? (
                          <Badge
                            className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                            variant="outline"
                          >
                            Critical
                          </Badge>
                        ) : low ? (
                          <Badge
                            className="bg-warning/10 text-warning-foreground border-warning/30 text-[10px]"
                            variant="outline"
                          >
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                            variant="outline"
                          >
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openEdit(ingredient)}
                            aria-label={`Edit ${ingredient.name}`}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(ingredient)}
                            aria-label={`Delete ${ingredient.name}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      <IngredientModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        editTarget={editTarget}
      />
      <DeleteDialog
        ingredient={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
