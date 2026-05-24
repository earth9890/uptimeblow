"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";

interface CreateMonitorDialogProps {
  onCreated: () => void;
}

export function CreateMonitorDialog({ onCreated }: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"http" | "ping" | "port" | "keyword">(
    "http"
  );
  const [intervalSeconds, setIntervalSeconds] = useState(120);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken") || undefined;
      await api("/api/monitors", {
        method: "POST",
        token,
        body: JSON.stringify({ name, url, type, intervalSeconds }),
      });
      setOpen(false);
      setName("");
      setUrl("");
      setType("http");
      setIntervalSeconds(120);
      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create monitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button />}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Monitor
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Monitor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Monitor Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["http", "ping", "port", "keyword"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              {type === "port" ? "Host:Port" : "URL"}
            </Label>
            <Input
              id="url"
              placeholder={
                type === "port"
                  ? "example.com:443"
                  : type === "ping"
                    ? "example.com"
                    : "https://example.com"
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Check Interval</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 30, label: "30s" },
                { value: 60, label: "1m" },
                { value: 120, label: "2m" },
                { value: 300, label: "5m" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIntervalSeconds(opt.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    intervalSeconds === opt.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Monitor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
