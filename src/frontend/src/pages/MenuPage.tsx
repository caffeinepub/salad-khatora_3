import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ChefHat,
  Edit2,
  Leaf,
  Loader2,
  Plus,
  Sprout,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { IngredientUsage, MenuItem } from "../backend.d";
import {
  useAddMenuItem,
  useDeleteMenuItem,
  useMenuItems,
  useSeedMenuItems,
  useUpdateMenuItem,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientRow {
  _key: string;
  ingredientName: string;
  quantity_used: number;
}

interface MenuFormState {
  name: string;
  description: string;
  selling_price: string;
  cost_per_bowl: string;
  ingredientRows: IngredientRow[];
}

let _rowCounter = 0;
const newRowKey = () => `row-${++_rowCounter}`;

const defaultForm = (): MenuFormState => ({
  name: "",
  description: "",
  selling_price: "",
  cost_per_bowl: "",
  ingredientRows: [{ _key: newRowKey(), ingredientName: "", quantity_used: 0 }],
});

// ─── Profit Badge ─────────────────────────────────────────────────────────────

function ProfitBadge({
  sellingPrice,
  costPerBowl,
}: {
  sellingPrice: number;
  costPerBowl: number;
}) {
  const margin = sellingPrice - costPerBowl;
  const pct = sellingPrice > 0 ? Math.round((margin / sellingPrice) * 100) : 0;
  const positive = margin >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        positive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {positive ? "+" : ""}
      {formatCurrency(margin)} ({pct}%)
    </span>
  );
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}) {
  return (
    <Card className="bg-card border-border shadow-card hover:shadow-md transition-shadow duration-200 group">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-base text-foreground truncate leading-tight">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.name}`}
            >
              <Edit2 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-primary font-display">
              {formatCurrency(item.selling_price)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Cost: {formatCurrency(item.cost_per_bowl)}
          </span>
          <ProfitBadge
            sellingPrice={item.selling_price}
            costPerBowl={item.cost_per_bowl}
          />
        </div>

        {/* Ingredients */}
        {item.ingredientUsage.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.ingredientUsage.slice(0, 5).map((u) => (
              <Badge
                key={u.ingredientName}
                variant="outline"
                className="text-[10px] bg-primary/5 border-primary/20 text-primary/80 font-normal"
              >
                <Leaf size={9} className="mr-1" />
                {u.ingredientName}: {u.quantity_used}g
              </Badge>
            ))}
            {item.ingredientUsage.length > 5 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-muted border-border text-muted-foreground font-normal"
              >
                +{item.ingredientUsage.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────

function MenuItemDialog({
  open,
  onOpenChange,
  editItem,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editItem: MenuItem | null;
}) {
  const addMenuItem = useAddMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const isEdit = editItem !== null;

  const [form, setForm] = useState<MenuFormState>(defaultForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MenuFormState, string>>
  >({});

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          name: editItem.name,
          description: editItem.description,
          selling_price: String(editItem.selling_price),
          cost_per_bowl: String(editItem.cost_per_bowl),
          ingredientRows:
            editItem.ingredientUsage.length > 0
              ? editItem.ingredientUsage.map((u) => ({
                  _key: newRowKey(),
                  ingredientName: u.ingredientName,
                  quantity_used: u.quantity_used,
                }))
              : [{ _key: newRowKey(), ingredientName: "", quantity_used: 0 }],
        });
      } else {
        setForm(defaultForm());
      }
      setErrors({});
    }
  }, [open, editItem]);

  const sellingPrice = Number.parseFloat(form.selling_price) || 0;
  const costPerBowl = Number.parseFloat(form.cost_per_bowl) || 0;
  const margin = sellingPrice - costPerBowl;

  const handleSubmit = useCallback(async () => {
    // Validate inline
    const sp = Number.parseFloat(form.selling_price) || 0;
    const cp = Number.parseFloat(form.cost_per_bowl) || 0;
    const newErrors: Partial<Record<keyof MenuFormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (sp <= 0) newErrors.selling_price = "Selling price must be > 0";
    if (cp < 0) newErrors.cost_per_bowl = "Cost cannot be negative";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const ingredientUsage: IngredientUsage[] = form.ingredientRows
      .filter((r) => r.ingredientName.trim() !== "")
      .map((r) => ({
        ingredientName: r.ingredientName.trim(),
        quantity_used: r.quantity_used,
      }));

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      selling_price: sp,
      cost_per_bowl: cp,
      ingredientUsage,
    };

    try {
      if (isEdit && editItem) {
        await updateMenuItem.mutateAsync({ id: editItem.id, ...payload });
        toast.success(`"${payload.name}" updated successfully`);
      } else {
        await addMenuItem.mutateAsync(payload);
        toast.success(`"${payload.name}" added to menu`);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(
        isEdit ? "Failed to update menu item" : "Failed to add menu item",
      );
    }
  }, [form, isEdit, editItem, addMenuItem, updateMenuItem, onOpenChange]);

  const isPending = addMenuItem.isPending || updateMenuItem.isPending;

  const updateIngredientRow = (
    index: number,
    field: keyof IngredientRow,
    value: string | number,
  ) => {
    setForm((prev) => {
      const rows = [...prev.ingredientRows];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, ingredientRows: rows };
    });
  };

  const addIngredientRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredientRows: [
        ...prev.ingredientRows,
        { _key: newRowKey(), ingredientName: "", quantity_used: 0 },
      ],
    }));
  };

  const removeIngredientRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredientRows: prev.ingredientRows.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? "Edit Bowl" : "Add New Bowl"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEdit
              ? "Update the details for this salad bowl."
              : "Fill in the details to add a new salad bowl to your menu."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="menu-name" className="text-sm font-medium">
              Bowl Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="menu-name"
              placeholder="e.g. Greek Salad"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={errors.name ? "border-destructive" : ""}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="menu-desc" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="menu-desc"
              placeholder="Brief description of the bowl..."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="resize-none h-20"
              disabled={isPending}
            />
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="menu-price" className="text-sm font-medium">
                Selling Price (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="menu-price"
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={form.selling_price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, selling_price: e.target.value }))
                }
                className={errors.selling_price ? "border-destructive" : ""}
                disabled={isPending}
              />
              {errors.selling_price && (
                <p className="text-xs text-destructive">
                  {errors.selling_price}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-cost" className="text-sm font-medium">
                Cost Per Bowl (₹)
              </Label>
              <Input
                id="menu-cost"
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={form.cost_per_bowl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cost_per_bowl: e.target.value }))
                }
                className={errors.cost_per_bowl ? "border-destructive" : ""}
                disabled={isPending}
              />
              {errors.cost_per_bowl && (
                <p className="text-xs text-destructive">
                  {errors.cost_per_bowl}
                </p>
              )}
            </div>
          </div>

          {/* Live Profit Preview */}
          {(sellingPrice > 0 || costPerBowl > 0) && (
            <div
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${
                margin >= 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              <span className="text-muted-foreground text-xs font-medium">
                Estimated profit per bowl
              </span>
              <span
                className={`font-bold font-display ${
                  margin >= 0 ? "text-emerald-700" : "text-destructive"
                }`}
              >
                {margin >= 0 ? "+" : ""}
                {formatCurrency(margin)}
              </span>
            </div>
          )}

          {/* Ingredient Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Ingredient Usage</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientRow}
                className="h-7 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                disabled={isPending}
              >
                <Plus size={12} />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-2">
              {form.ingredientRows.map((row, index) => (
                <div key={row._key} className="flex items-center gap-2">
                  <Input
                    placeholder="Ingredient name"
                    value={row.ingredientName}
                    onChange={(e) =>
                      updateIngredientRow(
                        index,
                        "ingredientName",
                        e.target.value,
                      )
                    }
                    className="flex-1 text-sm h-8"
                    disabled={isPending}
                  />
                  <div className="relative flex-shrink-0 w-28">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={row.quantity_used || ""}
                      onChange={(e) =>
                        updateIngredientRow(
                          index,
                          "quantity_used",
                          Number(e.target.value),
                        )
                      }
                      className="text-sm h-8 pr-7"
                      disabled={isPending}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                      g
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredientRow(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    disabled={isPending || form.ingredientRows.length === 1}
                    aria-label="Remove ingredient"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {isEdit ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{isEdit ? "Update Bowl" : "Add Bowl"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteMenuItemDialog({
  item,
  onOpenChange,
}: {
  item: MenuItem | null;
  onOpenChange: (v: boolean) => void;
}) {
  const deleteMenuItem = useDeleteMenuItem();

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMenuItem.mutateAsync(item.id);
      toast.success(`"${item.name}" removed from menu`);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete menu item");
    }
  };

  return (
    <AlertDialog open={item !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            Delete "{item?.name}"?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this bowl from your menu. Sales history
            will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMenuItem.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleDelete()}
            disabled={deleteMenuItem.isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
          >
            {deleteMenuItem.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Bowl"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {SKELETON_KEYS.map((k) => (
        <Card key={k} className="bg-card border-border shadow-card">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMenuState({
  onSeed,
  isSeeding,
  onAdd,
}: {
  onSeed: () => void;
  isSeeding: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <UtensilsCrossed size={28} className="text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">
        No menu items yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        Add salad bowls to your menu, set prices, and track ingredient usage per
        bowl.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={onSeed}
          disabled={isSeeding}
          variant="outline"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          {isSeeding ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sprout size={15} />
          )}
          Seed Default Bowls
        </Button>
        <Button
          onClick={onAdd}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <Plus size={15} />
          Add Bowl
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MenuPage() {
  const { data: menuItems, isLoading } = useMenuItems();
  const seedMenuItems = useSeedMenuItems();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);

  const handleEdit = (item: MenuItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (v: boolean) => {
    setDialogOpen(v);
    if (!v) setEditItem(null);
  };

  const handleSeed = async () => {
    try {
      await seedMenuItems.mutateAsync();
      toast.success("Default menu items seeded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed menu items");
    }
  };

  const items = menuItems ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChefHat size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl text-foreground">
                Menu Management
              </h1>
              {!isLoading && items.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs"
                >
                  {items.length} {items.length === 1 ? "bowl" : "bowls"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Configure salad bowls, prices, and ingredient costs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSeed()}
            disabled={seedMenuItems.isPending}
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 h-8 text-xs"
          >
            {seedMenuItems.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sprout size={13} />
            )}
            Seed Defaults
          </Button>
          <Button
            onClick={handleAdd}
            size="sm"
            className="bg-primary hover:bg-primary/90 gap-1.5 h-8 text-xs"
          >
            <Plus size={13} />
            Add Bowl
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <MenuSkeleton />
      ) : items.length === 0 ? (
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-0">
            <EmptyMenuState
              onSeed={() => void handleSeed()}
              isSeeding={seedMenuItems.isPending}
              onAdd={handleAdd}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Avg Selling Price
                </p>
                <p className="text-xl font-bold font-display text-primary">
                  {formatCurrency(
                    items.reduce((sum, i) => sum + i.selling_price, 0) /
                      items.length,
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Avg Cost Per Bowl
                </p>
                <p className="text-xl font-bold font-display text-foreground">
                  {formatCurrency(
                    items.reduce((sum, i) => sum + i.cost_per_bowl, 0) /
                      items.length,
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Avg Profit Margin
                </p>
                <p className="text-xl font-bold font-display text-emerald-600">
                  {formatCurrency(
                    items.reduce(
                      (sum, i) => sum + (i.selling_price - i.cost_per_bowl),
                      0,
                    ) / items.length,
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <MenuItemCard
                key={String(item.id)}
                item={item}
                onEdit={handleEdit}
                onDelete={setDeleteItem}
              />
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Dialog */}
      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editItem={editItem}
      />

      {/* Delete Confirmation */}
      <DeleteMenuItemDialog
        item={deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
      />

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border mt-8">
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          © {new Date().getFullYear()}. Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
