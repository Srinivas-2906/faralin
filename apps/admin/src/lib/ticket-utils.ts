import {
  TICKET_CHANNEL_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@faralin/types';

export function ticketStatusLabel(status: keyof typeof TICKET_STATUS_LABELS) {
  return TICKET_STATUS_LABELS[status] ?? status;
}

export function ticketPriorityLabel(priority: keyof typeof TICKET_PRIORITY_LABELS) {
  return TICKET_PRIORITY_LABELS[priority] ?? priority;
}

export function ticketChannelLabel(channel: keyof typeof TICKET_CHANNEL_LABELS) {
  return TICKET_CHANNEL_LABELS[channel] ?? channel;
}

export function priorityBadgeVariant(priority: string): 'default' | 'copper' | 'crimson' {
  switch (priority) {
    case 'URGENT':
      return 'crimson';
    case 'HIGH':
      return 'copper';
    default:
      return 'default';
  }
}

export function statusBadgeVariant(status: string): 'default' | 'copper' | 'crimson' | 'verified' {
  switch (status) {
    case 'OPEN':
      return 'copper';
    case 'IN_PROGRESS':
      return 'default';
    case 'RESOLVED':
      return 'verified';
    case 'CLOSED':
      return 'default';
    default:
      return 'default';
  }
}

export function isSlaOverdue(dueAt: string | null | undefined) {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function assigneeLabel(agent: {
  email: string;
  supportAgentProfile?: { displayName: string | null } | null;
} | null) {
  if (!agent) return 'Unassigned';
  return agent.supportAgentProfile?.displayName ?? agent.email;
}
