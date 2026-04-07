import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoredEvent } from "@/lib/types";

type Props = {
  events: StoredEvent[];
};

export function EventsTable({ events }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Events ({events.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <a href={event.videoUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                    {event.videoTitle}
                  </a>
                  <p className="text-xs text-muted-foreground">{event.videoId}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{event.event}</Badge>
                </TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>{event.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}