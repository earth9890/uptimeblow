"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink, Globe, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface StatusPage {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
  isPublic: boolean;
  createdAt: string;
}

export default function StatusPagesPage() {
  const { data: pages, refetch } = useApi<StatusPage[]>("/api/status-pages");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/status-pages", {
        method: "POST",
        token,
        body: JSON.stringify({ name, slug }),
      });
      setOpen(false);
      setName("");
      setSlug("");
      refetch();
    } catch (err: any) {
      setError(err.message || "Failed to create");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this status page?")) return;
    await api(`/api/status-pages/${id}`, { method: "DELETE", token });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Status Pages</h1>
          <p className="text-muted-foreground">Beautiful public status pages for your services</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Create Status Page
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Status Page</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="sp-name">Name</Label>
                <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Company Status" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-slug">Slug</Label>
                <Input
                  id="sp-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="my-company"
                  required
                />
                <p className="text-xs text-muted-foreground">Public URL: /status/{slug || "my-company"}</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!pages || pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No status pages yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a beautiful public status page for your users.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Card key={page.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: page.brandColor }} />
                      <p className="font-medium">{page.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">/status/{page.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/status/${page.slug}`} target="_blank">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/status-pages/${page.id}`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(page.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
