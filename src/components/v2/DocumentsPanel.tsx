import React from "react";
import Card, { Skeleton, Empty } from "./Card";

export default function DocumentsPanel({ loading, documents }: { loading: boolean; documents: any[] }) {
  if (loading) return <Card title="Documents"><Skeleton rows={5} /></Card>;

  return (
    <Card title="Documents" right={<span className="text-xs text-emerald-400/70">Max 5MB</span>}>
      {documents.length ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex justify-between rounded-lg border border-emerald-500/10 bg-black/40 p-3">
              <div className="text-sm text-emerald-100">{doc.file_url.split("/").pop()}</div>
              <div className="text-xs text-emerald-300/70">View</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Empty label="No documents uploaded" />
          <div className="h-24 rounded-lg border border-emerald-500/10 bg-black/40 flex items-center justify-center text-sm text-emerald-300/70">
            Drag and drop or click to upload
          </div>
        </div>
      )}
    </Card>
  );
}