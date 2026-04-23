import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Scheduler,
  TimelineView,
  DayView,
  WeekView,
  type SchedulerDataChangeEvent,
  type SchedulerItemProps,
  SchedulerItem,
} from "@progress/kendo-react-scheduler";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Plus, Users, UserCircle2 } from "lucide-react";
import {
  useBookings,
  useUpdateBooking,
  type Booking,
  type BookingStatus,
} from "@/hooks/useBookings";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { useStaff, staffDisplayName } from "@/hooks/useStaff";
import BookingDrawer from "@/components/BookingDrawer";

const UNALLOCATED_ID = "__unallocated__";

type GroupBy = "worker" | "participant";

interface SchedulerEvent {
  id: string;
  /** Composite event id: `${booking_id}::${workerId}` so each lane has its own row. */
  bookingId: string;
  title: string;
  start: Date;
  end: Date;
  workerId: string;
  participantId: string;
  status: BookingStatus;
  raw: Booking;
}

/**
 * A booking can have many staff assigned. Render one Scheduler event per
 * (booking × staff) pair so each staff lane shows the work they're on.
 * Bookings with no staff render a single "Unallocated" event.
 */
function toEvents(b: Booking): SchedulerEvent[] {
  const start = new Date(b.starts_at);
  const end = new Date(b.ends_at);
  const title = `${b.participant_name ?? "—"} · ${b.service_type}`;
  const ids = b.staff_ids.length ? b.staff_ids : [UNALLOCATED_ID];
  return ids.map((wid) => ({
    id: `${b.id}::${wid}`,
    bookingId: b.id,
    title,
    start,
    end,
    workerId: wid,
    participantId: b.participant_id,
    status: b.status,
    raw: b,
  }));
}

/** Status-tinted event renderer. */
function EventItem(props: SchedulerItemProps) {
  const status = (props.dataItem as SchedulerEvent).status;
  return (
    <SchedulerItem
      {...props}
      style={{ ...props.style }}
      className={`${props.className ?? ""} evt-${status}`}
    />
  );
}

export default function Schedule() {
  const [params, setParams] = useSearchParams();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<string>("timelineDay");
  const [groupBy, setGroupBy] = useState<GroupBy>("worker");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDefaultDate, setDrawerDefaultDate] = useState<Date | undefined>();

  const { data: bookings = [] } = useBookings();
  const { data: participants = [] } = useParticipants();
  const { data: staff = [] } = useStaff();
  const updateBooking = useUpdateBooking();

  // ?create=1 deep-link from sidebar
  useEffect(() => {
    if (params.get("create") === "1") {
      setDrawerOpen(true);
      params.delete("create");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  // Worker resources come from real staff records (active + bookable).
  const workerResources = useMemo(() => {
    const list = staff
      .filter((s) => s.bookable && s.status === "active")
      .map((s) => ({
        value: s.id,
        text: staffDisplayName(s),
        color: "hsl(var(--primary))",
      }));
    list.unshift({ value: UNALLOCATED_ID, text: "Unallocated", color: "hsl(var(--muted-foreground))" });
    return list;
  }, [staff]);

  const participantResources = useMemo(
    () =>
      participants.map((p) => ({
        value: p.id,
        text: p.name,
        color: "hsl(var(--accent))",
      })),
    [participants]
  );

  const events = useMemo(() => bookings.flatMap(toEvents), [bookings]);

  const resources = useMemo(
    () => [
      groupBy === "worker"
        ? {
            name: "Worker",
            data: workerResources,
            field: "workerId",
            valueField: "value",
            textField: "text",
            colorField: "color",
          }
        : {
            name: "Participant",
            data: participantResources,
            field: "participantId",
            valueField: "value",
            textField: "text",
            colorField: "color",
          },
    ],
    [groupBy, workerResources, participantResources]
  );

  const group = useMemo(
    () => ({ resources: [groupBy === "worker" ? "Worker" : "Participant"], orientation: "vertical" as const }),
    [groupBy]
  );

  /** Drag, resize, and inline-edit handler. */
  function handleDataChange(e: SchedulerDataChangeEvent) {
    for (const updated of e.updated) {
      const ev = updated as SchedulerEvent;
      const patch: Parameters<typeof updateBooking.mutate>[0]["patch"] = {
        starts_at: ev.start.toISOString(),
        ends_at: ev.end.toISOString(),
      };
      // Drag across worker rows reassigns the booking
      if (groupBy === "worker" && ev.workerId !== ev.raw.assigned_worker_id) {
        const target = workerResources.find((w) => w.value === ev.workerId);
        if (ev.workerId === UNALLOCATED_ID) {
          patch.assigned_worker_id = null;
          patch.assigned_worker_name = null;
        } else if (target) {
          patch.assigned_worker_id = ev.workerId;
          patch.assigned_worker_name = target.text;
        }
      }
      // Drag across participant rows reassigns the booking's participant
      if (groupBy === "participant" && ev.participantId !== ev.raw.participant_id) {
        patch.participant_id = ev.participantId;
      }
      updateBooking.mutate({ id: ev.id, patch });
    }
    // (Create/remove come through this event too — we route create to the drawer
    // for a richer form, and ignore in-Scheduler delete to keep the audit trail clean.)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resource timeline — drag to reschedule, drop on another row to reassign.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={groupBy}
            onValueChange={(v) => v && setGroupBy(v as GroupBy)}
            size="sm"
            variant="outline"
          >
            <ToggleGroupItem value="worker" aria-label="Group by worker" className="gap-1.5 px-2.5">
              <Users className="h-3.5 w-3.5" /> Workers
            </ToggleGroupItem>
            <ToggleGroupItem value="participant" aria-label="Group by participant" className="gap-1.5 px-2.5">
              <UserCircle2 className="h-3.5 w-3.5" /> Participants
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={() => {
              setDrawerDefaultDate(undefined);
              setDrawerOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New booking
          </Button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <Scheduler
          data={events}
          date={date}
          onDateChange={(e) => setDate(e.value)}
          view={view}
          onViewChange={(e) => setView(e.value)}
          editable={{
            add: false,
            remove: false,
            drag: true,
            resize: true,
            edit: true,
            select: true,
          }}
          group={group}
          resources={resources}
          onDataChange={handleDataChange}
          item={EventItem}
          height={680}
        >
          <TimelineView title="Timeline" />
          <DayView title="Day" />
          <WeekView title="Week" />
        </Scheduler>
      </div>

      <BookingDrawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setDrawerDefaultDate(undefined);
        }}
        defaultDate={drawerDefaultDate}
      />
    </div>
  );
}
