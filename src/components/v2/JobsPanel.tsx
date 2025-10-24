import React from "react";
import Card, { Skeleton, Empty } from "./Card";

export default function JobsPanel({ loading, assignedJobs, nearbyJobs }: { loading: boolean; assignedJobs: any[]; nearbyJobs: any[] }) {
  if (loading) return <Card title="Jobs"><Skeleton rows={8} /></Card>;

  return (
    <Card title="Jobs" right={<span className="text-xs text-emerald-400/70">Live</span>}>
      <Section title="Assigned Jobs">
        {assignedJobs.length ? <JobList jobs={assignedJobs} /> : <Empty label="No assigned jobs right now" />}
      </Section>
      <Section title="Available Near You">
        {nearbyJobs.length ? <JobList jobs={nearbyJobs} /> : <Empty label="No nearby openings" />}
      </Section>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-medium text-emerald-300/80">{title}</div>
      {children}
    </div>
  );
}

function JobList({ jobs }: { jobs: any[] }) {
  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div key={job.id} className="flex justify-between rounded-lg border border-emerald-500/10 bg-black/40 p-3">
          <div>
            <div className="text-sm font-medium text-emerald-100">{job.customer_name || "Job"}</div>
            <div className="text-xs text-emerald-300/70">{new Date(job.created_at).toLocaleDateString()}</div>
          </div>
          <div className="text-xs text-emerald-300/70">{job.status}</div>
        </div>
      ))}
    </div>
  );
}