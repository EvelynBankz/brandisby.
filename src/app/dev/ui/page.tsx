"use client";

import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/forms/form-field";
import { FileUpload } from "@/components/forms/file-upload";

// Internal-only reference page for the base component library (M0.4) — not
// linked from anywhere customer-facing. Safe to delete once a real design
// docs/Storybook setup replaces it.
export default function UiShowcasePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      <PageHeader
        title="Component Library"
        description="Base components built on the brand tokens (M0.4)."
        actions={<Button variant="primary">Primary action</Button>}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="outline">Draft</Badge>
          <Badge variant="success">Paid</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Failed</Badge>
          <Badge variant="info">Processing</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Form controls</h2>
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <FormField label="Business name" htmlFor="name" required>
              <Input id="name" placeholder="Goldmakers" />
            </FormField>
            <FormField
              label="Email"
              htmlFor="email"
              error="Enter a valid email address"
            >
              <Input id="email" type="email" defaultValue="not-an-email" aria-invalid />
            </FormField>
            <FormField label="Category" htmlFor="category" helpText="Pick the closest match">
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical product</SelectItem>
                  <SelectItem value="digital">Digital product</SelectItem>
                  <SelectItem value="personalized">Personalized</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Reference image" htmlFor="reference-image">
              <FileUpload id="reference-image" accept="image/*" onFilesSelected={() => {}} />
            </FormField>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Off My Mind Journal</CardTitle>
            <CardDescription>2 packages &middot; 14 orders this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">₦20,000 base price</p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Table</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>#1042</TableCell>
                <TableCell>Ada Obi</TableCell>
                <TableCell>
                  <Badge variant="success">Paid</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>#1041</TableCell>
                <TableCell>Chidi Eze</TableCell>
                <TableCell>
                  <Badge variant="warning">Pending</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish product?</DialogTitle>
              <DialogDescription>
                This makes the product visible on your storefront immediately.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground-muted">Empty state</h2>
        <EmptyState
          icon={<Package className="size-8" />}
          title="No products yet"
          description="Create your first product to start selling."
          action={<Button variant="primary">Create product</Button>}
        />
      </section>
    </div>
  );
}
