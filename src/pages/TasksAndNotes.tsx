import { useState } from "react";
import { Search, Filter, Plus, CheckCircle2, Circle, Clock, AlertTriangle, MessageSquare, Phone, FileText, MoreHorizontal, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TaskPriority = "high" | "medium" | "low";
type TaskStatus = "todo" | "in_progress" | "done" | "overdue";
type NoteType = "case_note" | "contact_log" | "incident";

interface Task {
  id: string;
  title: string;
  participant: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  due: string;
  category: string;
}

interface Note {
  id: string;
  type: NoteType;
  participant: string;
  author: string;
  summary: string;
  date: string;
  time: string;
}

const tasks: Task[] = [
  { id: "T-401", title: "Review plan reassessment documents", participant: "Sarah Mitchell", assignee: "Jane D.", priority: "high", status: "in_progress", due: "25 Feb 2026", category: "Plan Review" },
  { id: "T-402", title: "Connect with new OT provider", participant: "James Thornton", assignee: "Jane D.", priority: "medium", status: "todo", due: "28 Feb 2026", category: "Provider" },
  { id: "T-403", title: "Follow up on funding period rollover", participant: "David Lee", assignee: "Mark S.", priority: "high", status: "overdue", due: "20 Feb 2026", category: "Funding" },
  { id: "T-404", title: "Prepare participant statement", participant: "Emma Kelly", assignee: "Jane D.", priority: "low", status: "todo", due: "03 Mar 2026", category: "Reporting" },
  { id: "T-405", title: "Schedule capacity building review", participant: "Anika Rao", assignee: "Mark S.", priority: "medium", status: "in_progress", due: "27 Feb 2026", category: "Plan Review" },
  { id: "T-406", title: "Submit outstanding claims to portal", participant: "Robert Nguyen", assignee: "Jane D.", priority: "high", status: "todo", due: "26 Feb 2026", category: "Claims" },
  { id: "T-407", title: "Update service booking allocations", participant: "Lucy Chen", assignee: "Mark S.", priority: "medium", status: "done", due: "22 Feb 2026", category: "Funding" },
  { id: "T-408", title: "Risk assessment follow-up call", participant: "Mohammad Al-Farsi", assignee: "Jane D.", priority: "high", status: "todo", due: "25 Feb 2026", category: "Risk" },
];

const notes: Note[] = [
  { id: "N-201", type: "case_note", participant: "Sarah Mitchell", author: "Jane Doe", summary: "Discussed plan goals and progress toward independent living. Sarah expressed interest in exploring new community programs.", date: "24 Feb 2026", time: "10:30 AM" },
  { id: "N-202", type: "contact_log", participant: "James Thornton", author: "Jane Doe", summary: "Phone call with James's nominee (mother). Confirmed new OT provider details and availability.", date: "24 Feb 2026", time: "9:15 AM" },
  { id: "N-203", type: "incident", participant: "David Lee", author: "Mark Smith", summary: "Provider reported missed appointment. David's carer was unaware of schedule change. Escalated to SC lead.", date: "23 Feb 2026", time: "3:45 PM" },
  { id: "N-204", type: "case_note", participant: "Emma Kelly", author: "Jane Doe", summary: "Quarterly review completed. Budget tracking on schedule. No changes to current supports needed.", date: "23 Feb 2026", time: "11:00 AM" },
  { id: "N-205", type: "contact_log", participant: "Anika Rao", author: "Mark Smith", summary: "Email from Therapy Plus confirming new session times starting March. Updated service agreement.", date: "22 Feb 2026", time: "2:20 PM" },
];

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

const statusConfig: Record<TaskStatus, { icon: typeof Circle; className: string }> = {
  todo: { icon: Circle, className: "text-muted-foreground" },
  in_progress: { icon: Clock, className: "text-info" },
  done: { icon: CheckCircle2, className: "text-success" },
  overdue: { icon: AlertTriangle, className: "text-destructive" },
};

const noteTypeConfig: Record<NoteType, { icon: typeof FileText; label: string; className: string }> = {
  case_note: { icon: FileText, label: "Case Note", className: "bg-accent/10 text-accent border-accent/20" },
  contact_log: { icon: Phone, label: "Contact Log", className: "bg-info/10 text-info border-info/20" },
  incident: { icon: AlertTriangle, label: "Incident", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

type ActiveTab = "tasks" | "notes";

export default function TasksAndNotes() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tasks");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks & Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Support coordination tasks, case notes, and contact logs</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          {activeTab === "tasks" ? "New Task" : "New Note"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "tasks"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {tasks.filter(t => t.status !== "done").length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "notes"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Notes & Logs
          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {notes.length}
          </span>
        </button>
      </div>

      {/* Search/Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === "tasks" ? "Search tasks..." : "Search notes..."}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {activeTab === "tasks" ? (
        /* Tasks Table */
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-8 px-5 py-2.5" />
                  <th className="px-3 py-2.5 text-left font-medium">Task</th>
                  <th className="px-5 py-2.5 text-left font-medium">Participant</th>
                  <th className="px-5 py-2.5 text-left font-medium">Assignee</th>
                  <th className="px-5 py-2.5 text-left font-medium">Category</th>
                  <th className="px-5 py-2.5 text-left font-medium">Priority</th>
                  <th className="px-5 py-2.5 text-left font-medium">Due</th>
                  <th className="w-10 px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const StatusIcon = statusConfig[task.status].icon;
                  return (
                    <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].className}`} />
                      </td>
                      <td className="px-3 py-3">
                        <p className={`font-medium ${task.status === "done" ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{task.id}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{task.participant}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                            {task.assignee.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-xs text-muted-foreground">{task.assignee}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-muted-foreground">{task.category}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-[11px] font-medium ${priorityConfig[task.priority].className}`}>
                          {priorityConfig[task.priority].label}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 text-xs ${task.status === "overdue" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {task.due}
                      </td>
                      <td className="px-5 py-3">
                        <button className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Notes Timeline */
        <div className="space-y-3">
          {notes.map((note) => {
            const config = noteTypeConfig[note.type];
            const NoteIcon = config.icon;
            return (
              <div key={note.id} className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${config.className.split(" ")[0]}`}>
                      <NoteIcon className={`h-4 w-4 ${config.className.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[11px] font-medium ${config.className}`}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-medium text-card-foreground">{note.participant}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{note.summary}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{note.author}</span>
                        <span>·</span>
                        <span>{note.date} at {note.time}</span>
                        <span>·</span>
                        <span className="font-mono">{note.id}</span>
                      </div>
                    </div>
                  </div>
                  <button className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
